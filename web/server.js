const http = require("http");
const fs = require("fs");
const path = require("path");
const resolveSupabaseBundle = require("../scripts/supabase-bundle");

const port = 8080;
const root = __dirname;
const envPath = path.resolve(root, "..", ".env");
const vendorPath = resolveSupabaseBundle();

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};

  const values = {};
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;

    const separator = trimmed.indexOf("=");
    if (separator < 1) return;

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  });
  return values;
}

const env = { ...readEnvFile(envPath), ...process.env };

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

const server = http.createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" });
    res.end("Method not allowed");
    return;
  }

  let urlPath;
  try {
    urlPath = decodeURIComponent(new URL(req.url || "/", "http://localhost").pathname);
  } catch {
    res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Invalid URL");
    return;
  }

  if (urlPath === "/api/config") {
    const url = env.NEXT_PUBLIC_SUPABASE_URL;
    const publishableKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !publishableKey) {
      res.writeHead(503, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ error: "Set the Supabase URL and publishable key in the root .env file." }));
      return;
    }

    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    });
    res.end(JSON.stringify({ url, publishableKey }));
    return;
  }

  if (urlPath === "/vendor/supabase.js") {
    fs.readFile(vendorPath, (err, data) => {
      if (err) {
        res.writeHead(503, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Supabase client package is unavailable. Run npm install from the project root.");
        return;
      }
      res.writeHead(200, {
        "Content-Type": "text/javascript; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      });
      res.end(req.method === "HEAD" ? undefined : data);
    });
    return;
  }

  const relativePath = urlPath === "/" ? "index.html" : urlPath.replace(/^[/\\]+/, "");
  const filePath = path.resolve(root, relativePath);
  const relative = path.relative(root, filePath);
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": types[ext] || "application/octet-stream" });
    res.end(req.method === "HEAD" ? undefined : data);
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log("Gradely web app: http://127.0.0.1:" + port);
});
