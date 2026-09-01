import { mkdirSync } from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { schema } from "./schema";
import { getDbPath } from "./paths";

export type AppDb = BetterSQLite3Database<typeof schema>;

export function openSqlite(dbPath: string = getDbPath()): Database.Database {
  mkdirSync(path.dirname(dbPath), { recursive: true });
  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  return sqlite;
}

export function openDb(dbPath: string = getDbPath()): {
  sqlite: Database.Database;
  db: AppDb;
} {
  const sqlite = openSqlite(dbPath);
  const db = drizzle(sqlite, { schema });
  return { sqlite, db };
}
