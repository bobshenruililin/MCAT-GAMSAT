import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { openDb } from "./client";
import { getDbPath, MIGRATIONS_DIR } from "./paths";

const { sqlite, db } = openDb();
migrate(db, { migrationsFolder: MIGRATIONS_DIR });
sqlite.close();
console.log(`migrated ${getDbPath()}`);
