import { openDb } from "./client";
import { getDbPath } from "./paths";
import { migrateDb } from "./migrate-lib";

const { sqlite, db } = openDb();
migrateDb(db);
sqlite.close();
console.log(`migrated ${getDbPath()}`);
