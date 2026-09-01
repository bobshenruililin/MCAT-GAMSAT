import { existsSync, unlinkSync } from "node:fs";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { openDb } from "./client";
import { getDbPath, MIGRATIONS_DIR } from "./paths";

const dbPath = getDbPath();
for (const suffix of ["", "-wal", "-shm"]) {
  const file = `${dbPath}${suffix}`;
  if (existsSync(file)) unlinkSync(file);
}

const { sqlite, db } = openDb();
migrate(db, { migrationsFolder: MIGRATIONS_DIR });
sqlite.close();
console.log(`reset and migrated ${dbPath}`);
