import Database from "better-sqlite3";
import path from "path";
import { mkdirSync } from "fs";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "hayati.db");

let _db: Database.Database | null = null;

export function getDb() {
  if (!_db) {
    mkdirSync(DATA_DIR, { recursive: true });
    _db = new Database(DB_PATH);
    _db.exec(`CREATE TABLE IF NOT EXISTS kv (
      key        TEXT PRIMARY KEY,
      value      TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )`);
  }
  return _db;
}
