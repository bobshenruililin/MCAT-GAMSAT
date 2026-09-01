import { count } from "drizzle-orm";
import { openDb } from "./client";
import { items } from "./schema";
import { seedFromFile, printCounts, TaxonomyError } from "./seed-lib";
import { seedPlaceholdersIfEmpty } from "./seed-items";

try {
  const { sqlite, db } = openDb();
  const nodes = seedFromFile(db);
  printCounts(nodes);
  const added = seedPlaceholdersIfEmpty(db);
  const itemCount = db.select({ n: count() }).from(items).get()?.n ?? 0;
  if (added > 0) {
    console.log(`seeded ${added} PLACEHOLDER items (source=ai_generated, verified=false)`);
  } else {
    console.log(`item bank already has ${itemCount} items; placeholders skipped`);
  }
  sqlite.close();
} catch (err) {
  if (err instanceof TaxonomyError) {
    console.error(`SEED ERROR: ${err.message}`);
    process.exit(1);
  }
  throw err;
}
