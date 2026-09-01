import { openDb } from "./client";
import { seedDemoHistory, DEMO_LABEL } from "@/engine/demoSeed";

try {
  const { sqlite, db } = openDb();
  const now = process.env.DEMO_SEED_NOW
    ? new Date(process.env.DEMO_SEED_NOW)
    : new Date();
  const result = seedDemoHistory(db, now);
  sqlite.close();
  console.log(
    `demo:seed ${result.sessions} sessions, ${result.attempts} attempts over ${result.days} days`,
  );
  console.log(DEMO_LABEL);
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}
