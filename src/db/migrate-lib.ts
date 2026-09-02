import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import type { AppDb } from "./client";
import { MIGRATIONS_DIR } from "./paths";

export function migrateDb(db: AppDb): void {
  migrate(db, { migrationsFolder: MIGRATIONS_DIR });
}
