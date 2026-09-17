const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = Number(process.env.PORT) || 3002;
const dataDir = process.env.DATA_DIR || root;
const accountsFile = path.join(dataDir, "accounts.json");
const maxBodyBytes = 2 * 1024 * 1024;
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

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
    sendJson(res, 400, { error: "Enter both a username and password." });
    return;
  }

  const accounts = readAccounts();
  const normalizedUsername = username.toLowerCase();
  const index = accounts.findIndex((account) => account.username.toLowerCase() === normalizedUsername);

  if (urlPath === "/api/create-account") {
    if (index !== -1) {
      if (accounts[index].password === password) {
        sendJson(res, 200, { username: accounts[index].username, save: accounts[index].save ?? null });
        return;
      }
      sendJson(res, 409, {
        error: "That username is already taken. Sign in with the password you created for it."
      });
      return;
    }

    if (accounts.some((account) => account.password === password)) {
      sendJson(res, 409, {
        error: "That password is already used by another account. Pick a different one."
      });
      return;
    }

    accounts.push({ username, password, save: null });
    writeAccounts(accounts);
    sendJson(res, 201, { username, save: null });
    return;
  }

  if (urlPath === "/api/sign-in") {
    if (index === -1 || accounts[index].password !== password) {
      sendJson(res, 401, { error: "No account matches that username and password together." });
      return;
    }
    sendJson(res, 200, { username: accounts[index].username, save: accounts[index].save ?? null });
    return;
  }

  if (urlPath === "/api/save") {
    if (index === -1) {
      accounts.push({ username, password, save: payload.save ?? null });
      writeAccounts(accounts);
      sendJson(res, 200, { saved: true });
      return;
    }
    if (accounts[index].password !== password) {
      sendJson(res, 401, { error: "Sign in again to keep saving." });
      return;
    }
    accounts[index] = { ...accounts[index], save: payload.save ?? null };
    writeAccounts(accounts);
    sendJson(res, 200, { saved: true });
    return;
  }

  sendJson(res, 404, { error: "Unknown endpoint." });
}

http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split("?")[0]);

  if (urlPath.startsWith("/api/")) {
    handleApi(req, res, urlPath).catch(() => {
      sendJson(res, 500, { error: "The castle server hit a problem." });
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
}).listen(port, "0.0.0.0", () => {
  console.log(`Castle Shields 2 listening on http://localhost:${port}`);
});
