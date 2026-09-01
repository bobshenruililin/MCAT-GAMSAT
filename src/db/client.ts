import { mkdirSync } from "node:fs";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { schema } from "./schema";
import { DATA_DIR, DB_PATH } from "./paths";

export function openSqlite(dbPath: string = DB_PATH): Database.Database {
  mkdirSync(DATA_DIR, { recursive: true });
  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  return sqlite;
}

export function openDb(dbPath: string = DB_PATH) {
  const sqlite = openSqlite(dbPath);
  const db = drizzle(sqlite, { schema });
  return { sqlite, db };
}
