const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = process.env.FRONTEND_PORT || 3003;
const apiTarget = process.env.API_TARGET || "https://nearbayan-beta.onrender.com";

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

async function proxyApi(req, res) {
  const target = new URL(req.url, apiTarget);
  const headers = { ...req.headers };
  delete headers.host;

  try {
    const body = await new Promise((resolve, reject) => {
      if (["GET", "HEAD"].includes(req.method)) {
        resolve(undefined);
        return;
      }

      const chunks = [];
      req.on("data", (chunk) => chunks.push(chunk));
      req.on("end", () => resolve(Buffer.concat(chunks)));
      req.on("error", reject);
    });

    const response = await fetch(target, {
      method: req.method,
      headers,
      body,
    });

    const responseHeaders = Object.fromEntries(response.headers.entries());
    delete responseHeaders["content-encoding"];
    delete responseHeaders["content-length"];
    responseHeaders["access-control-allow-origin"] = "*";

    res.writeHead(response.status, responseHeaders);
    const buffer = Buffer.from(await response.arrayBuffer());
    res.end(buffer);
  } catch (error) {
    res.writeHead(502, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ success: false, message: `API proxy failed: ${error.message}` }));
  }
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith("/api/") || req.url.startsWith("/health")) {
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
      });
      res.end();
      return;
    }

    proxyApi(req, res);
    return;
  }

  const rawPath = req.url === "/" ? "/index.html" : req.url.split("?")[0];
  let urlPath;
  try {
    urlPath = decodeURIComponent(rawPath);
  } catch {
    urlPath = rawPath;
  }
  const filePath = path.join(root, path.normalize(urlPath));

  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    res.writeHead(200, {
      "Content-Type": types[path.extname(filePath)] || "application/octet-stream",
    });
    res.end(data);
  });
});

server.listen(port, () => {
  console.log(`NearBaYan prototype frontend running at http://localhost:${port}`);
  console.log(`Proxying API requests to ${apiTarget}`);
});
