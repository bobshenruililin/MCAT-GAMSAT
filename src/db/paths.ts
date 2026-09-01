import path from "node:path";

export function getDbPath(): string {
  return process.env.MCAT_DB_PATH ?? path.join(process.cwd(), "data", "app.db");
}

export function getDataDir(): string {
  return path.dirname(getDbPath());
}

export const MIGRATIONS_DIR = path.join(process.cwd(), "drizzle");
export const TAXONOMY_PATH = path.join(
  process.cwd(),
  "content",
  "taxonomy.json",
);

/** @deprecated use getDbPath() — kept for existing imports */
export const DB_PATH = getDbPath();
export const DATA_DIR = getDataDir();
