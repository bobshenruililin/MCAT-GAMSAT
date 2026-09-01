import { describe, expect, it } from "vitest";
import { attempts, sessions } from "@/db/schema";
import { seedFromFile } from "@/db/seed-lib";
import { TAXONOMY_PATH } from "@/db/paths";
import { insertDiscrete, tempMigratedDb } from "./testDb";
import { masterySwatch } from "./masteryColor";
import { getProgressData } from "./progress";

describe("progress heatmap data", () => {
  it("marks topics with no attempts unseen and sorts weakest first", () => {
    const { db, close } = tempMigratedDb();
    seedFromFile(db, TAXONOMY_PATH);
    insertDiscrete(db, "hit-1", "MCAT.FC1.1A.t1", "A");
    insertDiscrete(db, "miss-1", "MCAT.FC1.1A.t2", "A");
    db.insert(sessions)
      .values({
        id: "s1",
        kind: "daily",
        startedAt: "2026-09-01T00:00:00.000Z",
        endedAt: null,
        config: {},
      })
      .run();
    db.insert(attempts)
      .values({
        id: "a1",
        itemId: "hit-1",
        sessionId: "s1",
        answeredKey: "A",
        correct: true,
        confidence: 4,
        errorClass: null,
        seconds: 12,
        createdAt: "2026-09-01T00:01:00.000Z",
      })
      .run();
    db.insert(attempts)
      .values({
        id: "a2",
        itemId: "miss-1",
        sessionId: "s1",
        answeredKey: "B",
        correct: false,
        confidence: 2,
        errorClass: "content_gap",
        seconds: 20,
        createdAt: "2026-09-01T00:02:00.000Z",
      })
      .run();

    const data = getProgressData(db, new Date("2026-09-01T00:03:00.000Z"));
    const t1 = data.topics.find((n) => n.id === "MCAT.FC1.1A.t1");
    const t2 = data.topics.find((n) => n.id === "MCAT.FC1.1A.t2");
    const other = data.topics.find((n) => n.id === "MCAT.FC1.1A.t4");
    expect(t1?.unseen).toBe(false);
    expect(t2?.unseen).toBe(false);
    expect(other?.unseen).toBe(true);
    expect(t1!.attempts).toBe(1);
    expect(t2!.attempts).toBe(1);
    const bb = data.coverage.find((c) => c.family === "MCAT B/B");
    expect(bb?.withItems).toBeGreaterThanOrEqual(2);
    expect(bb?.attempted).toBeGreaterThanOrEqual(2);

    const seen = data.topics.filter((n) => !n.unseen);
    for (let i = 1; i < seen.length; i++) {
      expect(seen[i].mastery).toBeGreaterThanOrEqual(seen[i - 1].mastery);
    }
    close();
  });

  it("uses gray for unseen and a non-gray swatch for seen mastery", () => {
    expect(masterySwatch(true, 0.9)).toBe("#d4d4d8");
    expect(masterySwatch(false, 0.2)).not.toBe("#d4d4d8");
    expect(masterySwatch(false, 0.9)).not.toBe(masterySwatch(false, 0.2));
  });
});
