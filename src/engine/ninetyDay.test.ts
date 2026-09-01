import { describe, expect, it } from "vitest";
import { createDailySession, recordAttempt } from "./sessionService";
import { getDueItems } from "./reviewEngine";
import { masteryByNode } from "./mastery";
import { insertDiscrete, insertTopicTree, tempMigratedDb } from "./testDb";

function mulberry32(seed: number) {
  return function rng() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TOPICS = [
  "MCAT.FC1.1A.t1",
  "MCAT.FC1.1B.t1",
  "MCAT.FC1.1C.t1",
  "MCAT.FC1.1D.t1",
  "MCAT.FC2.2A.t1",
  "MCAT.FC2.2B.t1",
  "MCAT.FC2.2C.t1",
  "MCAT.FC3.3A.t1",
];

describe("90-day FSRS fixture", () => {
  it("keeps due counts bounded and moves mastery up when most answers are correct", () => {
    const { db, close } = tempMigratedDb();
    insertTopicTree(db, TOPICS);
    const itemIds: string[] = [];
    for (const topic of TOPICS) {
      for (let i = 0; i < 3; i++) {
        const id = `${topic}-q${i}`;
        insertDiscrete(db, id, topic);
        itemIds.push(id);
      }
    }
    const rng = mulberry32(90);
    const start = new Date("2026-01-01T08:00:00.000Z");
    const dueCounts: number[] = [];
    const masteryStart = masteryByNode(db, start);
    const startMean =
      TOPICS.reduce((s, t) => s + masteryStart[t], 0) / TOPICS.length;

    for (let day = 0; day < 90; day++) {
      const now = new Date(start.getTime() + day * 24 * 60 * 60 * 1000);
      dueCounts.push(getDueItems(db, now, 1000).length);
      let created: ReturnType<typeof createDailySession>;
      try {
        created = createDailySession(db, now, {
          reviewCap: 50,
          newCap: 15,
        });
      } catch (err) {
        if (String(err).includes("nothing due and no new items")) continue;
        throw err;
      }
      for (const itemId of created.config.itemIds) {
        const correct = rng() > 0.15;
        recordAttempt(db, {
          sessionId: created.sessionId,
          itemId,
          answeredKey: correct ? "A" : "B",
          confidence: correct ? 4 : 2,
          seconds: 10,
          errorClass: correct ? null : "content_gap",
          now,
        });
      }
    }

    const end = new Date(start.getTime() + 90 * 24 * 60 * 60 * 1000);
    const masteryEnd = masteryByNode(db, end);
    const endMean = TOPICS.reduce((s, t) => s + masteryEnd[t], 0) / TOPICS.length;

    expect(Math.max(...dueCounts)).toBeLessThanOrEqual(itemIds.length);
    expect(dueCounts[dueCounts.length - 1]).toBeLessThan(itemIds.length);
    expect(endMean).toBeGreaterThan(startMean + 0.05);
    close();
  });
});
