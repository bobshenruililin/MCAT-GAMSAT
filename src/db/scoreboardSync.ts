import { openDb } from "./client";
import { writeScoreboard, getScoreboardPath } from "@/engine/scoreboard";

try {
  const { sqlite, db } = openDb();
  const now = process.env.SCOREBOARD_NOW
    ? new Date(process.env.SCOREBOARD_NOW)
    : new Date();
  const path = getScoreboardPath();
  const stats = writeScoreboard(db, now, path);
  sqlite.close();
  console.log(
    `scoreboard:sync ${path} — ${stats.studyDays} study days, ${stats.attempts} attempts, last ${stats.lastStudyDay ?? "none"}`,
  );
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}
