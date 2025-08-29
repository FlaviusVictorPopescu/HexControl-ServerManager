import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const db = new Database(path.join(dataDir, "app.db"));

db.pragma("journal_mode = WAL");

db.exec(`CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL,
  domain_id TEXT,
  meta TEXT
);`);

export function saveActivity(row: { id: string; kind: string; message: string; createdAt: string; domainId?: string; meta?: any }) {
  const stmt = db.prepare("INSERT INTO activities (id, kind, message, created_at, domain_id, meta) VALUES (?, ?, ?, ?, ?, ?)");
  stmt.run(row.id, row.kind, row.message, row.createdAt, row.domainId ?? null, row.meta ? JSON.stringify(row.meta) : null);
}

export function fetchActivities(limit = 100) {
  const stmt = db.prepare("SELECT id, kind, message, created_at as createdAt, domain_id as domainId, meta FROM activities ORDER BY created_at DESC LIMIT ?");
  return stmt.all(limit).map((r: any) => ({ ...r, meta: r.meta ? JSON.parse(r.meta) : undefined }));
}
