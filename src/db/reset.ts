import { existsSync, unlinkSync } from "node:fs";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { openDb } from "./client";
import { DB_PATH, MIGRATIONS_DIR } from "./paths";

for (const suffix of ["", "-wal", "-shm"]) {
  const file = `${DB_PATH}${suffix}`;
  if (existsSync(file)) unlinkSync(file);
}

const { sqlite, db } = openDb();
migrate(db, { migrationsFolder: MIGRATIONS_DIR });
sqlite.close();
console.log(`reset and migrated ${DB_PATH}`);
