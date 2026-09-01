import { count } from "drizzle-orm";
import { openDb } from "./client";
import { items } from "./schema";
import { seedFromFile, printCounts, TaxonomyError } from "./seed-lib";
import { ingestAllBatches } from "@/ingest/ingestAll";
import { removeCoveredPlaceholders } from "@/ingest/ingest";

/**
 * Taxonomy + every real batch. No PLACEHOLDER items.
 * Usage: pnpm db:reset && pnpm bootstrap
 */
try {
  const { sqlite, db } = openDb();
  const nodes = seedFromFile(db);
  printCounts(nodes);
  sqlite.close();

  const stats = ingestAllBatches();
  const { sqlite: sqlite2, db: db2 } = openDb();
  const stripped = removeCoveredPlaceholders(db2);
  const itemCount = db2.select({ n: count() }).from(items).get()?.n ?? 0;
  sqlite2.close();
  if (stripped > 0) {
    console.log(`removed ${stripped} leftover PLACEHOLDER items`);
  }
  console.log(
    `bootstrap: ${stats.inserted} inserted, ${stats.skipped} skipped, bank ${itemCount} items (verified=false)`,
  );
  if (stats.failed > 0) process.exit(1);
} catch (err) {
  if (err instanceof TaxonomyError) {
    console.error(`SEED ERROR: ${err.message}`);
    process.exit(1);
  }
  throw err;
}
