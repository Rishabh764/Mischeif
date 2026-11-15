/* ==========================================================================
   MISCHIEF — Local preview server (no dependencies).
   The showroom is a 3D scene, and browsers refuse to load images into 3D from
   a file opened by double-click, so it has to be served over http.

     node serve.js            → http://localhost:5173
     node serve.js 8080       → another port
   ========================================================================== */

const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PORT = Number(process.argv[2]) || 5173;
const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".webp": "image/webp", ".avif": "image/avif", ".woff2": "font/woff2", ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8"
};

function send(res, status, file) {
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(500); res.end("Server error"); return; }
    res.writeHead(status, { "Content-Type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-cache" });
    res.end(data);
  });
}

http.createServer((req, res) => {
  let rel;
  try { rel = decodeURIComponent(new URL(req.url, "http://localhost").pathname); } catch (e) { res.writeHead(400); res.end(); return; }
  if (rel.endsWith("/")) rel += "index.html";
  const file = path.join(ROOT, path.normalize(rel));
  // Never serve anything outside the project folder, or its git data.
  if (!file.startsWith(ROOT + path.sep) || rel.split("/").some((part) => part.startsWith(".git"))) { res.writeHead(403); res.end("Forbidden"); return; }
  fs.stat(file, (err, stat) => {
    if (!err && stat.isFile()) send(res, 200, file);
    else send(res, 404, path.join(ROOT, "404.html"));
  });
}).listen(PORT, () => {
  console.log(`Mischief showroom running at http://localhost:${PORT}  (Ctrl+C to stop)`);
});
