import { createApi, fail } from "../shared/team-api.mjs";
import http from "node:http";
import { randomBytes, createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync, existsSync, createReadStream, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = process.env.DATA_DIR || path.join(root, ".data");
mkdirSync(dataDir, { recursive: true });
const db = new DatabaseSync(path.join(dataDir, "dagachi.sqlite"));
db.exec(`PRAGMA journal_mode = WAL;
 CREATE TABLE IF NOT EXISTS teams (id TEXT PRIMARY KEY, data TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, team_id TEXT NOT NULL, member_id TEXT, kind TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS submissions (id TEXT PRIMARY KEY, kind TEXT, data TEXT, created_at TEXT);`);
const api = createApi(db, {
  randomHex: (size) => randomBytes(size).toString("hex"),
  hashToken: (value) => createHash("sha256").update(value).digest("hex"),
});
async function body(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 100_000) fail("입력 내용이 너무 커요.", 413);
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString() || "{}");
  } catch {
    fail("잘못된 요청이에요.");
  }
}
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".woff2": "font/woff2",
  ".json": "application/json",
};
const server = http.createServer(async (req, res) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "same-origin");
  try {
    const pathname = new URL(req.url, "http://localhost").pathname;
    if (pathname.startsWith("/api/")) {
      res.setHeader("Cache-Control", "no-store");
      const data = await api(
        req,
        pathname,
        req.method === "POST" ? await body(req) : {},
      );
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(data));
      return;
    }
    if (!["GET", "HEAD"].includes(req.method))
      fail("지원하지 않는 요청이에요.", 405);
    const dist = path.join(root, "dist");
    const decoded = decodeURIComponent(pathname);
    const requested = path.resolve(dist, "." + decoded);
    if (!requested.startsWith(dist + path.sep) && requested !== dist)
      fail("잘못된 경로예요.", 400);
    const file =
      existsSync(requested) && statSync(requested).isFile()
        ? requested
        : path.join(dist, "index.html");
    if (!existsSync(file)) fail("먼저 npm run build를 실행해 주세요.", 503);
    res.writeHead(200, {
      "Content-Type": types[path.extname(file)] || "application/octet-stream",
    });
    if (req.method === "HEAD") res.end();
    else createReadStream(file).pipe(res);
  } catch (error) {
    res.writeHead(error.status || 500, {
      "Content-Type": "application/json; charset=utf-8",
    });
    res.end(
      JSON.stringify({
        error: error.status
          ? error.message
          : "저장 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.",
      }),
    );
    if (!error.status) console.error(error);
  }
});
server.listen(Number(process.env.PORT || 3000), "0.0.0.0", () =>
  console.log(`다가치 서버 시작 · port ${process.env.PORT || 3000}`),
);
const shutdown = () =>
  server.close(() => {
    db.close();
    process.exit(0);
  });
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
