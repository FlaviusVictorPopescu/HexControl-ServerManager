import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// Attempt to load better-sqlite3; fall back to JSON lines file when not available
let hasSqlite = false as boolean;
let db: any = null as any;
try {
  const require = createRequire(import.meta.url);
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Database = require("better-sqlite3");
  db = new Database(path.join(dataDir, "app.db"));
  db.pragma("journal_mode = WAL");
  db.exec(`CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    kind TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL,
    domain_id TEXT,
    meta TEXT
  );`);
  hasSqlite = true;
} catch {
  hasSqlite = false;
}

const jsonl = path.join(dataDir, "activities.jsonl");

export function saveActivity(row: { id: string; kind: string; message: string; createdAt: string; domainId?: string; meta?: any }) {
  if (hasSqlite) {
    const stmt = db.prepare(
      "INSERT INTO activities (id, kind, message, created_at, domain_id, meta) VALUES (?, ?, ?, ?, ?, ?)",
    );
    stmt.run(
      row.id,
      row.kind,
      row.message,
      row.createdAt,
      row.domainId ?? null,
      row.meta ? JSON.stringify(row.meta) : null,
    );
    return;
  }
  const line = JSON.stringify(row) + "\n";
  fs.appendFileSync(jsonl, line, "utf8");
}

export function fetchActivities(limit = 100) {
  if (hasSqlite) {
    const stmt = db.prepare(
      "SELECT id, kind, message, created_at as createdAt, domain_id as domainId, meta FROM activities ORDER BY created_at DESC LIMIT ?",
    );
    return stmt
      .all(limit)
      .map((r: any) => ({ ...r, meta: r.meta ? JSON.parse(r.meta) : undefined }));
  }
  if (!fs.existsSync(jsonl)) return [] as any[];
  const lines = fs.readFileSync(jsonl, "utf8").trim().split(/\n/).filter(Boolean).slice(-limit).reverse();
  return lines.map((l) => {
    try {
      const r = JSON.parse(l);
      return r;
    } catch {
      return null;
    }
  }).filter(Boolean);
}
