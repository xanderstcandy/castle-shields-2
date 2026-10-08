const http = require("http");
const fs = require("fs");
const path = require("path");
const { WebSocketServer } = require("ws");
const { createMatchServer } = require("./match-server.js");
const { createStore } = require("./accounts-store.js");

const root = __dirname;
const port = Number(process.env.PORT) || 3003;
const dataDir = process.env.DATA_DIR || root;
const accountsFile = path.join(dataDir, "accounts.json");
const maxBodyBytes = 1024 * 1024;

const LEAGUE_TIERS = [
  { id: "diamond", name: "Diamond", percent: 3, label: "Top 3% of players" },
  { id: "platinum", name: "Platinum", percent: 5, label: "5% of players" },
  { id: "gold", name: "Gold", percent: 12, label: "12% of players" },
  { id: "silver", name: "Silver", percent: 20, label: "20% of players" },
  { id: "bronze", name: "Bronze", percent: 25, label: "25% of players" },
  { id: "wood", name: "Wood", percent: 35, label: "35% of players" }
];

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

function tierById(leagueId) {
  return LEAGUE_TIERS.find((tier) => tier.id === leagueId) || LEAGUE_TIERS[LEAGUE_TIERS.length - 1];
}

function isRealAccount(account) {
  return Boolean(
    account
    && typeof account.username === "string"
    && account.username.trim()
    && typeof account.password === "string"
    && account.password
  );
}

function ensureAccountFields(account) {
  const next = { ...account };
  if (!Number.isFinite(next.stars)) next.stars = 0;
  next.shopCoins = Math.max(0, Number(next.shopCoins) || 0);
  next.shopDiamonds = Math.max(0, Number(next.shopDiamonds) || 0);
  delete next.leagueRank;
  delete next.rankPoints;
  return next;
}

const walletGrantsFile = path.join(dataDir, "wallet-grants.json");
const walletGrantsAppliedFile = path.join(dataDir, "wallet-grants-applied.json");

function readJsonFile(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

async function applyWalletGrants() {
  const grants = readJsonFile(walletGrantsFile, []);
  if (!Array.isArray(grants) || !grants.length) return;
  const applied = readJsonFile(walletGrantsAppliedFile, []);
  const appliedIds = new Set(Array.isArray(applied) ? applied : []);
  let changed = false;
  for (const grant of grants) {
    if (!grant || typeof grant.id !== "string" || appliedIds.has(grant.id)) continue;
    const username = String(grant.username || "").trim();
    if (!username) continue;
    const account = await store.find(username.toLowerCase());
    if (!account) continue;
    const next = ensureAccountFields(account);
    next.shopCoins += Math.max(0, Math.floor(Number(grant.coins) || 0));
    next.shopDiamonds += Math.max(0, Math.floor(Number(grant.diamonds) || 0));
    await store.save(next);
    appliedIds.add(grant.id);
    changed = true;
    console.log(`Applied wallet grant ${grant.id} to ${next.username}: +${grant.coins || 0} coins, +${grant.diamonds || 0} diamonds`);
  }
  if (changed) fs.writeFileSync(walletGrantsAppliedFile, JSON.stringify([...appliedIds]));
}

function leagueFromPlacement(rank, total, stars) {
  if (!stars || total < 1) return "wood";

  const topPercent = (rank / total) * 100;
  if (topPercent <= 3) return "diamond";
  if (topPercent <= 8) return "platinum";
  if (topPercent <= 20) return "gold";
  if (topPercent <= 40) return "silver";
  if (topPercent <= 65) return "bronze";
  return "wood";
}

const store = createStore(accountsFile, dataDir);
let storeReadyPromise = null;

function ensureStoreReady() {
  if (!storeReadyPromise) {
    storeReadyPromise = Promise.resolve(store.ready()).catch((error) => {
      storeReadyPromise = null;
      throw error;
    });
  }
  return storeReadyPromise;
}

async function loadAccounts() {
  const accounts = (await store.list())
    .filter(isRealAccount)
    .map((account) => ensureAccountFields(account));
  return accounts;
}

const lastMatchResults = new Map();

async function verifyAccount(username, password) {
  await ensureStoreReady();
  const account = await store.find(username.trim().toLowerCase());
  if (!account || account.password !== password.trim()) return null;
  return ensureAccountFields(account);
}

async function awardStars(username, stars) {
  await ensureStoreReady();
  const account = await store.find(username.toLowerCase());
  if (!account) return;
  const next = ensureAccountFields(account);
  next.stars += stars;
  next.drops = (next.drops || 0) + 1;
  await store.save(next);
  lastMatchResults.set(next.username.toLowerCase(), { stars, at: Date.now() });
}

function buildRealRoster(accounts, viewerUsername) {
  const ranked = accounts
    .filter(isRealAccount)
    .map((account) => ensureAccountFields(account))
    .sort((left, right) => {
      if (right.stars !== left.stars) return right.stars - left.stars;
      return left.username.localeCompare(right.username);
    });

  return ranked.map((entry, index) => {
    const rank = index + 1;
    const league = leagueFromPlacement(rank, ranked.length, entry.stars);
    const tier = tierById(league);
    return {
      rank,
      username: entry.username,
      stars: entry.stars,
      league,
      leagueName: tier.name,
      you: entry.username.toLowerCase() === viewerUsername.toLowerCase()
    };
  });
}

function publicAccount(account, accounts) {
  const fields = ensureAccountFields(account);
  const roster = buildRealRoster(accounts, fields.username);
  const youRow = roster.find((row) => row.you);
  const league = youRow ? youRow.league : "wood";
  const tier = tierById(league);

  return {
    username: fields.username,
    drops: fields.drops || 0,
    league,
    leagueName: tier.name,
    leagueLabel: tier.label,
    leagueRank: youRow ? youRow.rank : roster.length || 1,
    stars: fields.stars,
    shopCoins: fields.shopCoins,
    shopDiamonds: fields.shopDiamonds,
    leagueSize: roster.length
  };
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > maxBodyBytes) {
        req.destroy();
        reject(new Error("Body too large"));
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

async function handleApi(req, res, urlPath) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  let payload;
  try {
    payload = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "That request was not readable." });
    return;
  }

  const username = typeof payload.username === "string" ? payload.username.trim() : "";
  const password = typeof payload.password === "string" ? payload.password.trim() : "";

  if (!username || !password) {
    sendJson(res, 400, { error: "Enter both a callsign and a passcode." });
    return;
  }

  if (username.length > 20) {
    sendJson(res, 400, { error: "Callsigns max out at 20 characters." });
    return;
  }

  await ensureStoreReady();

  const usernameKey = username.toLowerCase();
  const existing = await store.find(usernameKey);

  if (urlPath === "/api/create-account") {
    if (existing) {
      sendJson(res, 409, { error: "That callsign is taken. Drop in with its passcode instead." });
      return;
    }

    if (password.length < 4) {
      sendJson(res, 400, { error: "Passcodes need at least 4 characters." });
      return;
    }

    const created = ensureAccountFields(await store.create(username, password));
    const accounts = await loadAccounts();
    sendJson(res, 201, publicAccount(created, accounts));
    return;
  }

  if (urlPath === "/api/sign-in") {
    if (!existing || existing.password !== password) {
      sendJson(res, 401, { error: "No squad member matches that callsign and passcode." });
      return;
    }
    const accounts = await loadAccounts();
    sendJson(res, 200, publicAccount(ensureAccountFields(existing), accounts));
    return;
  }

  if (urlPath === "/api/leaderboard") {
    if (!existing || existing.password !== password) {
      sendJson(res, 401, { error: "Sign in again to view the leaderboard." });
      return;
    }

    const accounts = await loadAccounts();
    const you = ensureAccountFields(existing);
    sendJson(res, 200, {
      you: publicAccount(you, accounts),
      tiers: LEAGUE_TIERS,
      roster: buildRealRoster(accounts, you.username),
      realAccountsOnly: true
    });
    return;
  }

  if (urlPath === "/api/match-result") {
    if (!existing || existing.password !== password) {
      sendJson(res, 401, { error: "Sign in again to see your match result." });
      return;
    }
    const accounts = await loadAccounts();
    sendJson(res, 200, {
      account: publicAccount(ensureAccountFields(existing), accounts),
      lastRankedAward: lastMatchResults.get(existing.username.toLowerCase()) || null
    });
    return;
  }

  if (urlPath === "/api/wallet") {
    if (!existing || existing.password !== password) {
      sendJson(res, 401, { error: "Sign in again to save your shop balance." });
      return;
    }
    const coins = Math.max(0, Math.floor(Number(payload.coins) || 0));
    const diamonds = Math.max(0, Math.floor(Number(payload.diamonds) || 0));
    const next = ensureAccountFields(existing);
    next.shopCoins = coins;
    next.shopDiamonds = diamonds;
    await store.save(next);
    const accounts = await loadAccounts();
    sendJson(res, 200, publicAccount(next, accounts));
    return;
  }

  sendJson(res, 404, { error: "Unknown endpoint." });
}

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split("?")[0]);

  if (urlPath === "/health") {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (urlPath.startsWith("/api/")) {
    handleApi(req, res, urlPath).catch(() => {
      sendJson(res, 500, { error: "The drop server hit a problem." });
    });
    return;
  }

  if (urlPath === "/") urlPath = "/index.html";

  const relativePath = urlPath.replace(/^\/+/, "");
  const filePath = path.normalize(path.join(root, relativePath));
  const resolvedPath = path.resolve(filePath);
  const resolvedRoot = path.resolve(root);

  if (!resolvedPath.startsWith(resolvedRoot + path.sep) && resolvedPath !== resolvedRoot) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  if (resolvedPath === path.resolve(accountsFile)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(resolvedPath, (err, data) => {
    if (err) {
      res.writeHead(err.code === "ENOENT" ? 404 : 500);
      res.end(err.code === "ENOENT" ? "Not found" : "Server error");
      return;
    }

    const ext = path.extname(resolvedPath);
    const cacheControl = ext === ".html" || ext === ".js" || ext === ".css"
      ? "no-cache"
      : "public, max-age=86400";

    res.writeHead(200, {
      "Content-Type": types[ext] || "application/octet-stream",
      "Cache-Control": cacheControl
    });
    res.end(data);
  });
});

createMatchServer({ wss: new WebSocketServer({ server, path: "/ws" }), verifyAccount, awardStars });

ensureStoreReady()
  .then(() => applyWalletGrants())
  .then(() => {
    server.listen(port, "0.0.0.0", () => {
      console.log(`B.B: BudyBattle, For Real-(battle royale) listening on http://localhost:${port} (accounts in ${store.label})`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize account storage:", error);
    process.exit(1);
  });
