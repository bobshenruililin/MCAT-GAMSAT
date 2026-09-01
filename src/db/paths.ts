import path from "node:path";

export const DATA_DIR = path.join(process.cwd(), "data");
export const DB_PATH = path.join(DATA_DIR, "app.db");
export const MIGRATIONS_DIR = path.join(process.cwd(), "drizzle");
export const TAXONOMY_PATH = path.join(
  process.cwd(),
  "content",
  "taxonomy.json",
);
