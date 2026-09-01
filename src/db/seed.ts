import { count } from "drizzle-orm";
import { openDb } from "./client";
import { items } from "./schema";
import { seedFromFile, printCounts, TaxonomyError } from "./seed-lib";

try {
  const { sqlite, db } = openDb();
  const nodes = seedFromFile(db);
  printCounts(nodes);
  const itemCount = db.select({ n: count() }).from(items).get()?.n ?? 0;
  sqlite.close();
  if (itemCount === 0) {
    console.log("taxonomy seeded; item bank empty. Run pnpm bootstrap to ingest real batches.");
  } else {
    console.log(`taxonomy seeded; item bank already has ${itemCount} items`);
  }
} catch (err) {
  if (err instanceof TaxonomyError) {
    console.error(`SEED ERROR: ${err.message}`);
    process.exit(1);
  }
  throw err;
}
