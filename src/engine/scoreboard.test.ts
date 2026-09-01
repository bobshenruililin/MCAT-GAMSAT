import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { attempts, sessions } from "@/db/schema";
import {
  renderScoreboard,
  scoreboardStats,
  writeScoreboard,
} from "./scoreboard";
import { insertDiscrete, insertTopicTree, tempMigratedDb } from "./testDb";

const OFFICIAL_WITH_ROW = `## Official scores

| date | exam | source | section | score | percentile |
|------|------|--------|---------|-------|------------|
| 2026-08-01 | MCAT | AAMC FL1 | C/P | 127 | 90 |

`;

const WEEKLY = `## Weekly verdict

Week of 2026-08-31: FAIL (human). No study days.`;

describe("scoreboard study log", () => {
  it("excludes demo and simulation and preserves official scores", () => {
    const { db, close } = tempMigratedDb();
    const now = new Date("2026-09-01T12:00:00.000Z");
    insertTopicTree(db, ["MCAT.FC1.1A.t1"]);
    insertDiscrete(db, "q1", "MCAT.FC1.1A.t1");

    db.insert(sessions)
      .values({
        id: "sim",
        kind: "simulation",
        startedAt: "2026-08-20T00:00:00.000Z",
        endedAt: "2026-08-20T00:10:00.000Z",
        config: { demo: true, itemIds: ["q1"] },
      })
      .run();
    db.insert(attempts)
      .values({
        id: "a-demo",
        itemId: "q1",
        sessionId: "sim",
        answeredKey: "A",
        correct: true,
        confidence: 4,
        seconds: 8,
        errorClass: null,
        createdAt: "2026-08-20T00:00:00.000Z",
      })
      .run();

    expect(scoreboardStats(db, now)).toMatchObject({
      dailySessions: 0,
      diagnosticSessions: 0,
      attempts: 0,
      studyDays: 0,
      lastStudyDay: null,
      topicsAttempted: 0,
    });

    db.insert(sessions)
      .values({
        id: "daily-1",
        kind: "daily",
        startedAt: "2026-08-31T00:00:00.000Z",
        endedAt: "2026-08-31T00:20:00.000Z",
        config: { itemIds: ["q1"] },
      })
      .run();
    db.insert(sessions)
      .values({
        id: "diag-1",
        kind: "diagnostic",
        startedAt: "2026-09-01T00:00:00.000Z",
        endedAt: "2026-09-01T00:20:00.000Z",
        config: { itemIds: ["q1"] },
      })
      .run();
    db.insert(attempts)
      .values({
        id: "a-real-1",
        itemId: "q1",
        sessionId: "daily-1",
        answeredKey: "B",
        correct: false,
        confidence: 2,
        seconds: 20,
        errorClass: "content_gap",
        createdAt: "2026-08-31T00:05:00.000Z",
      })
      .run();
    db.insert(attempts)
      .values({
        id: "a-real-2",
        itemId: "q1",
        sessionId: "diag-1",
        answeredKey: "A",
        correct: true,
        confidence: 3,
        seconds: 12,
        errorClass: null,
        createdAt: "2026-09-01T00:05:00.000Z",
      })
      .run();

    const stats = scoreboardStats(db, now);
    expect(stats).toMatchObject({
      dailySessions: 1,
      diagnosticSessions: 1,
      attempts: 2,
      studyDays: 2,
      lastStudyDay: "2026-09-01",
      topicsAttempted: 1,
    });
    expect(stats.meanMastery).not.toBeNull();

    const rendered = renderScoreboard(
      `# SCOREBOARD\n\nkeep preamble\n\n${OFFICIAL_WITH_ROW}${WEEKLY}\n`,
      stats,
    );
    expect(rendered).toContain("keep preamble");
    expect(rendered).toContain("| 2026-08-01 | MCAT | AAMC FL1 | C/P | 127 | 90 |");
    expect(rendered).toContain("Week of 2026-08-31: FAIL (human). No study days.");
    expect(rendered).toContain(
      "Sessions: 2 (1 daily, 1 diagnostic) | Attempts: 2 | Last study day: 2026-09-01",
    );
    expect(rendered).toContain("Study days: 2");
    expect(rendered).not.toContain("Sessions: 0 | Attempts: 0");

    const dir = mkdtempSync(path.join(tmpdir(), "mcat-scoreboard-"));
    const file = path.join(dir, "SCOREBOARD.md");
    writeFileSync(file, `# SCOREBOARD\n\n${OFFICIAL_WITH_ROW}${WEEKLY}\n`, "utf8");
    writeScoreboard(db, now, file);
    const written = readFileSync(file, "utf8");
    expect(written).toContain("AAMC FL1");
    expect(written).toContain("Study days: 2");
    close();
  });
});
