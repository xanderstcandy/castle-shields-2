const http = require("http");
const fs = require("fs");
const path = require("path");
const { WebSocketServer } = require("ws");
const { createMatchServer } = require("./match-server.js");

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
  delete next.leagueRank;
  delete next.rankPoints;
  return next;
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

function readAccounts() {
  try {
    const parsed = JSON.parse(fs.readFileSync(accountsFile, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAccounts(accounts) {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(accountsFile, JSON.stringify(accounts));
}

function loadAccounts() {
  const accounts = readAccounts()
    .filter(isRealAccount)
    .map((account) => ensureAccountFields(account));
  writeAccounts(accounts);
  return accounts;
}

function findAccount(usernameKey, accounts = null) {
  const list = accounts || readAccounts();
  return list.find((account) => account.username.toLowerCase() === usernameKey) || null;
}

function putAccount(username, password) {
  const accounts = readAccounts();
  const usernameKey = username.toLowerCase();
  const index = accounts.findIndex((account) => account.username.toLowerCase() === usernameKey);
  const seeded = ensureAccountFields({ username, password, drops: 0, stars: 0, league: "wood" });

  if (index === -1) {
    accounts.push(seeded);
  } else {
    accounts[index] = ensureAccountFields({
      username: accounts[index].username,
      password,
      drops: accounts[index].drops || 0,
      league: "wood",
      stars: Number.isFinite(accounts[index].stars) ? accounts[index].stars : 0
    });
  }

  writeAccounts(accounts);
  return ensureAccountFields(accounts[index === -1 ? accounts.length - 1 : index]);
}

const lastMatchResults = new Map();

function verifyAccount(username, password) {
  const account = findAccount(username.trim().toLowerCase());
  if (!account || account.password !== password.trim()) return null;
  return account;
}

function awardStars(username, stars) {
  const accounts = readAccounts();
  const index = accounts.findIndex((account) => account.username.toLowerCase() === username.toLowerCase());
  if (index === -1) return;
  const account = ensureAccountFields(accounts[index]);
  account.stars += stars;
  account.drops = (account.drops || 0) + 1;
  accounts[index] = account;
  writeAccounts(accounts);
  lastMatchResults.set(account.username.toLowerCase(), { stars, at: Date.now() });
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

  const accounts = loadAccounts();
  const existing = findAccount(username.toLowerCase(), accounts);

  if (urlPath === "/api/create-account") {
    if (existing) {
      sendJson(res, 409, { error: "That callsign is taken. Drop in with its passcode instead." });
      return;
    }

    if (password.length < 4) {
      sendJson(res, 400, { error: "Passcodes need at least 4 characters." });
      return;
    }

    const created = putAccount(username, password);
    sendJson(res, 201, publicAccount(created, loadAccounts()));
    return;
  }

  if (urlPath === "/api/sign-in") {
    if (!existing || existing.password !== password) {
      sendJson(res, 401, { error: "No squad member matches that callsign and passcode." });
      return;
    }
    sendJson(res, 200, publicAccount(existing, accounts));
    return;
  }

  if (urlPath === "/api/leaderboard") {
    if (!existing || existing.password !== password) {
      sendJson(res, 401, { error: "Sign in again to view the leaderboard." });
      return;
    }

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
    sendJson(res, 200, {
      account: publicAccount(existing, accounts),
      lastRankedAward: lastMatchResults.get(existing.username.toLowerCase()) || null
    });
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

server.listen(port, "0.0.0.0", () => {
  console.log(`B.B: BudyBattle, For Real-(battle royale) listening on http://localhost:${port}`);
});
