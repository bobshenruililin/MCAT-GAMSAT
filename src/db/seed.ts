import { openDb } from "./client";
import { seedFromFile, printCounts, TaxonomyError } from "./seed-lib";

try {
  const { sqlite, db } = openDb();
  const nodes = seedFromFile(db);
  printCounts(nodes);
  sqlite.close();
} catch (err) {
  if (err instanceof TaxonomyError) {
    console.error(`SEED ERROR: ${err.message}`);
    process.exit(1);
  }
  throw err;
}
