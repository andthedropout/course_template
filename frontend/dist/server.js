// @bun
// server.ts
import { join } from "path";
import { readdir } from "fs/promises";
import { createHash } from "crypto";
var CLIENT_DIR = ".";
var PORT = parseInt(process.env.PORT || "3000", 10);
var MAX_ASSET_SIZE = 5 * 1024 * 1024;
var ENABLE_GZIP = true;
var ENABLE_ETAGS = true;
var GZIP_THRESHOLD = 1024;
var assets = new Map;
function generateETag(content) {
  return `"${createHash("md5").update(content).digest("hex")}"`;
}
async function gzipContent(content) {
  return Bun.gzipSync(content);
}
async function loadStaticAssets() {
  console.log(`\uD83D\uDCE6 Loading static assets from ${CLIENT_DIR}...`);
  const files = await readdir(CLIENT_DIR, { recursive: true });
  let memoryLoaded = 0;
  let diskLoaded = 0;
  for (const relativePath of files) {
    const filepath = join(CLIENT_DIR, relativePath);
    const file = Bun.file(filepath);
    if (!await file.exists() || file.size === 0)
      continue;
    const route = `/${relativePath.split("\\").join("/")}`;
    const fileSize = file.size;
    const shouldLoadInMemory = fileSize <= MAX_ASSET_SIZE;
    if (shouldLoadInMemory) {
      const content = Buffer.from(await file.arrayBuffer());
      const asset = {
        content,
        type: file.type || "application/octet-stream"
      };
      if (ENABLE_ETAGS) {
        asset.etag = generateETag(content);
      }
      if (ENABLE_GZIP && content.length > GZIP_THRESHOLD) {
        asset.gzipped = await gzipContent(content);
      }
      assets.set(route, asset);
      memoryLoaded++;
    } else {
      assets.set(route, {
        content: null,
        type: file.type || "application/octet-stream",
        path: filepath
      });
      diskLoaded++;
    }
  }
  console.log(`\u2705 Loaded ${memoryLoaded} assets into memory, ${diskLoaded} assets will be lazy-loaded`);
}
function serveAsset(request, route) {
  const asset = assets.get(route);
  if (!asset)
    return null;
  const url = new URL(request.url);
  const acceptEncoding = request.headers.get("accept-encoding") || "";
  const ifNoneMatch = request.headers.get("if-none-match");
  if (ENABLE_ETAGS && asset.etag && ifNoneMatch === asset.etag) {
    return new Response(null, { status: 304 });
  }
  const headers = new Headers({
    "Content-Type": asset.type,
    "Cache-Control": "public, max-age=31536000, immutable"
  });
  if (asset.etag) {
    headers.set("ETag", asset.etag);
  }
  if (asset.content) {
    if (asset.gzipped && acceptEncoding.includes("gzip")) {
      headers.set("Content-Encoding", "gzip");
      return new Response(asset.gzipped, { headers });
    }
    return new Response(asset.content, { headers });
  }
  if (asset.path) {
    const file = Bun.file(asset.path);
    return new Response(file, { headers });
  }
  return null;
}
async function startServer() {
  await loadStaticAssets();
  console.log(`\uD83D\uDE80 Starting static file server on port ${PORT}...`);
  const indexHtml = await Bun.file(join(CLIENT_DIR, "index.html")).text();
  Bun.serve({
    port: PORT,
    async fetch(request) {
      const url = new URL(request.url);
      const staticResponse = serveAsset(request, url.pathname);
      if (staticResponse) {
        return staticResponse;
      }
      return new Response(indexHtml, {
        headers: {
          "Content-Type": "text/html"
        }
      });
    }
  });
  console.log(`\u2705 Server running at http://localhost:${PORT}`);
}
startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
