const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = Number(process.env.PORT) || 3002;
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

http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split("?")[0]);
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
