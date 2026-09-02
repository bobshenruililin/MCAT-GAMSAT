import { existsSync, unlinkSync } from "node:fs";
import { openDb } from "./client";
import { getDbPath } from "./paths";
import { migrateDb } from "./migrate-lib";

const dbPath = getDbPath();
for (const suffix of ["", "-wal", "-shm"]) {
  const file = `${dbPath}${suffix}`;
  if (existsSync(file)) unlinkSync(file);
}

const { sqlite, db } = openDb();
migrateDb(db);
sqlite.close();
console.log(`reset and migrated ${dbPath}`);
