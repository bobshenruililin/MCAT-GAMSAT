import { Rating } from "ts-fsrs";
import { describe, expect, it } from "vitest";
import { attempts, sessions } from "@/db/schema";
import { ewmaCorrectness, masteryByNode } from "./mastery";
import { getRetrievability, schedule } from "./reviewEngine";
import { insertDiscrete, insertTopicTree, tempMigratedDb } from "./testDb";

describe("mastery", () => {
  it("EWMA α=0.3 seeds at 0.3 (MINI_SPEC)", () => {
    expect(ewmaCorrectness([])).toBeCloseTo(0.3, 10);
    expect(ewmaCorrectness([1])).toBeCloseTo(0.3 * 1 + 0.7 * 0.3, 10);
    expect(ewmaCorrectness([1, 0])).toBeCloseTo(0.3 * 0 + 0.7 * (0.3 * 1 + 0.7 * 0.3), 10);
  });

  it("unseen nodes are 0.3; correct attempts raise topic mastery; parents roll up by weight", () => {
    const { db, close } = tempMigratedDb();
    insertTopicTree(db, ["MCAT.FC1.1A.t1", "MCAT.FC1.1A.t2"], 0.05);
    insertDiscrete(db, "a", "MCAT.FC1.1A.t1");
    insertDiscrete(db, "b", "MCAT.FC1.1A.t2");
    const now = new Date("2026-06-01T00:00:00.000Z");
    const before = masteryByNode(db, now);
    expect(before["MCAT.FC1.1A.t1"]).toBeCloseTo(0.3, 5);
    expect(before["MCAT.FC1.1A"]).toBeCloseTo(0.3, 5);

    db.insert(sessions)
      .values({
        id: "s1",
        kind: "daily",
        startedAt: now.toISOString(),
        endedAt: null,
        config: {},
      })
      .run();
    schedule(db, "a", Rating.Easy, now);
    db.insert(attempts)
      .values({
        id: "att-1",
        itemId: "a",
        sessionId: "s1",
        answeredKey: "A",
        correct: true,
        confidence: 5,
        seconds: 5,
        errorClass: null,
        createdAt: now.toISOString(),
      })
      .run();

    const afterNow = new Date("2026-06-02T00:00:00.000Z");
    const after = masteryByNode(db, afterNow);
    const C = ewmaCorrectness([1]);
    const R = getRetrievability(db, "a", afterNow);
    expect(R).not.toBeNull();
    expect(after["MCAT.FC1.1A.t1"]).toBeCloseTo(0.6 * C + 0.4 * (R as number), 5);
    expect(after["MCAT.FC1.1A.t1"]).toBeGreaterThan(before["MCAT.FC1.1A.t1"]);
    expect(after["MCAT.FC1.1A.t2"]).toBeCloseTo(0.3, 5);
    expect(after["MCAT.FC1.1A"]).toBeGreaterThan(before["MCAT.FC1.1A"]);
    expect(after["MCAT.FC1.1A"]).toBeLessThan(after["MCAT.FC1.1A.t1"]);
    close();
  });
});
