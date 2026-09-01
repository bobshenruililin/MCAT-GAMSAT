import { describe, expect, it } from "vitest";
import { sessions } from "@/db/schema";
import {
  createDailySession,
  createDiagnosticSession,
  listOpenSessions,
  recordAttempt,
} from "./sessionService";
import { getTodayStats } from "./today";
import { insertDiscrete, insertTopicTree, tempMigratedDb } from "./testDb";

describe("open sessions and empty starts", () => {
  const now = new Date("2026-09-01T12:00:00.000Z");

  it("refuses an empty daily sitting instead of a dead session", () => {
    const { db, close } = tempMigratedDb();
    insertTopicTree(db, ["MCAT.FC1.1A.t1"]);
    expect(() => createDailySession(db, now, { reviewCap: 50, newCap: 15 })).toThrow(
      /nothing due and no new items/,
    );
    expect(() => createDiagnosticSession(db, now)).toThrow(
      /no items available for this diagnostic/,
    );
    close();
  });

  it("lists unfinished real sittings and skips demo", () => {
    const { db, close } = tempMigratedDb();
    insertTopicTree(db, ["MCAT.FC1.1A.t1", "MCAT.FC1.1B.t1"]);
    insertDiscrete(db, "q1", "MCAT.FC1.1A.t1");
    insertDiscrete(db, "q2", "MCAT.FC1.1B.t1");
    insertDiscrete(db, "q3", "MCAT.FC1.1A.t1");
    insertDiscrete(db, "q4", "MCAT.FC1.1B.t1");
    insertDiscrete(db, "q5", "MCAT.FC1.1A.t1");
    insertDiscrete(db, "q6", "MCAT.FC1.1B.t1");
    const created = createDailySession(db, now, { reviewCap: 0, newCap: 2 });
    expect(created.config.itemIds).toHaveLength(2);
    recordAttempt(db, {
      sessionId: created.sessionId,
      itemId: created.config.itemIds[0],
      answeredKey: "A",
      confidence: 3,
      seconds: 8,
      errorClass: null,
      now,
    });
    db.insert(sessions)
      .values({
        id: "demo-open",
        kind: "daily",
        startedAt: "2026-09-01T11:00:00.000Z",
        endedAt: null,
        config: { demo: true, itemIds: ["q1", "q2"] },
      })
      .run();

    const open = listOpenSessions(db);
    expect(open).toHaveLength(1);
    expect(open[0].id).toBe(created.sessionId);
    expect(open[0].answered).toBe(1);
    expect(open[0].remaining).toBe(1);
    expect(open[0].total).toBe(2);
    expect(getTodayStats(db, now).openSessions.map((s) => s.id)).toEqual([
      created.sessionId,
    ]);

    const older = createDailySession(db, new Date("2026-08-31T12:00:00.000Z"), {
      reviewCap: 0,
      newCap: 2,
    });
    const newerUntouched = createDailySession(db, now, { reviewCap: 0, newCap: 2 });
    const ranked = listOpenSessions(db);
    expect(ranked[0]?.id).toBe(created.sessionId);
    expect(ranked[0]?.answered).toBe(1);
    expect(ranked.filter((s) => s.answered === 0)).toHaveLength(1);
    expect(ranked.some((s) => s.id === newerUntouched.sessionId)).toBe(true);
    expect(ranked.some((s) => s.id === older.sessionId)).toBe(false);
    close();
  });
});
