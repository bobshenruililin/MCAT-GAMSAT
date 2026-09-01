import { describe, expect, it } from "vitest";
import { huntTopicIds, type HuntAttempt } from "./hunt";
import { assembleSession, type NewCandidate } from "./sessionAssembler";
import { attempts, sessions } from "@/db/schema";
import { createDailySession, huntTopicsFromDb } from "./sessionService";
import { getTodayStats } from "./today";
import { insertDiscrete, insertTopicTree, tempMigratedDb } from "./testDb";

function row(
  partial: Partial<HuntAttempt> & Pick<HuntAttempt, "itemId" | "conceptId">,
): HuntAttempt {
  return {
    correct: false,
    errorClass: "trap",
    createdAt: "2026-08-28T12:00:00.000Z",
    demo: false,
    ...partial,
  };
}

describe("huntTopicIds", () => {
  const now = new Date("2026-09-01T12:00:00.000Z");

  it("hunts a topic when one item was missed twice and is still wrong", () => {
    const ids = huntTopicIds(
      [
        row({ itemId: "i1", conceptId: "t-leech", createdAt: "2026-08-20T00:00:00.000Z" }),
        row({ itemId: "i1", conceptId: "t-leech", createdAt: "2026-08-25T00:00:00.000Z" }),
      ],
      now,
    );
    expect(ids).toEqual(["t-leech"]);
  });

  it("ignores demo attempts and recovered items", () => {
    expect(
      huntTopicIds(
        [
          row({ itemId: "d1", conceptId: "t-demo", demo: true }),
          row({ itemId: "d1", conceptId: "t-demo", demo: true, createdAt: "2026-08-29T00:00:00.000Z" }),
        ],
        now,
      ),
    ).toEqual([]);
    expect(
      huntTopicIds(
        [
          row({ itemId: "i2", conceptId: "t-ok" }),
          row({
            itemId: "i2",
            conceptId: "t-ok",
            correct: true,
            errorClass: null,
            createdAt: "2026-08-30T00:00:00.000Z",
          }),
        ],
        now,
      ),
    ).toEqual([]);
  });

  it("hunts topics with two recent trap or content_gap misses", () => {
    const ids = huntTopicIds(
      [
        row({ itemId: "a", conceptId: "t-trap", errorClass: "trap" }),
        row({
          itemId: "b",
          conceptId: "t-trap",
          errorClass: "content_gap",
          createdAt: "2026-08-29T00:00:00.000Z",
        }),
      ],
      now,
    );
    expect(ids).toContain("t-trap");
  });
});

describe("huntTopicsFromDb", () => {
  it("ignores demo sessions and prefers hunt-topic new items in daily assemble", () => {
    const { db, close } = tempMigratedDb();
    const now = new Date("2026-09-01T12:00:00.000Z");
    insertTopicTree(db, ["MCAT.FC1.1A.t1", "MCAT.FC1.1B.t1"], 0.05);
    insertDiscrete(db, "heavy-seen", "MCAT.FC1.1A.t1");
    insertDiscrete(db, "heavy-new-1", "MCAT.FC1.1A.t1");
    insertDiscrete(db, "heavy-new-2", "MCAT.FC1.1A.t1");
    insertDiscrete(db, "hunt-seen", "MCAT.FC1.1B.t1");
    insertDiscrete(db, "hunt-new-1", "MCAT.FC1.1B.t1");
    insertDiscrete(db, "hunt-new-2", "MCAT.FC1.1B.t1");

    db.insert(sessions)
      .values({
        id: "demo-s",
        kind: "simulation",
        startedAt: "2026-08-28T00:00:00.000Z",
        endedAt: "2026-08-28T00:10:00.000Z",
        config: { demo: true, itemIds: ["heavy-seen"] },
      })
      .run();
    db.insert(attempts)
      .values({
        id: "d1",
        itemId: "heavy-seen",
        sessionId: "demo-s",
        answeredKey: "B",
        correct: false,
        confidence: 4,
        seconds: 10,
        errorClass: "trap",
        createdAt: "2026-08-28T00:00:00.000Z",
      })
      .run();
    db.insert(attempts)
      .values({
        id: "d2",
        itemId: "heavy-seen",
        sessionId: "demo-s",
        answeredKey: "B",
        correct: false,
        confidence: 4,
        seconds: 10,
        errorClass: "trap",
        createdAt: "2026-08-29T00:00:00.000Z",
      })
      .run();
    expect(huntTopicsFromDb(db, now)).toEqual([]);

    db.insert(sessions)
      .values({
        id: "real-s",
        kind: "daily",
        startedAt: "2026-08-28T00:00:00.000Z",
        endedAt: "2026-08-28T00:10:00.000Z",
        config: { itemIds: ["hunt-seen"] },
      })
      .run();
    db.insert(attempts)
      .values({
        id: "r1",
        itemId: "hunt-seen",
        sessionId: "real-s",
        answeredKey: "B",
        correct: false,
        confidence: 2,
        seconds: 12,
        errorClass: "content_gap",
        createdAt: "2026-08-28T00:00:00.000Z",
      })
      .run();
    db.insert(attempts)
      .values({
        id: "r2",
        itemId: "hunt-seen",
        sessionId: "real-s",
        answeredKey: "B",
        correct: false,
        confidence: 2,
        seconds: 12,
        errorClass: "trap",
        createdAt: "2026-08-29T00:00:00.000Z",
      })
      .run();
    expect(huntTopicsFromDb(db, now)).toEqual(["MCAT.FC1.1B.t1"]);
    expect(getTodayStats(db, now).huntTopics.map((t) => t.id)).toEqual([
      "MCAT.FC1.1B.t1",
    ]);

    const daily = createDailySession(db, now, { reviewCap: 0, newCap: 2 });
    expect(daily.config.huntTopicIds).toEqual(["MCAT.FC1.1B.t1"]);
    expect(daily.config.itemIds.every((id) => id.startsWith("hunt-new"))).toBe(true);
    close();
  });
});

describe("assembleSession hunt preference", () => {
  it("draws hunt-topic new items before higher-weight unhunted topics", () => {
    const due = [{ id: "d1", conceptId: "other" }];
    const news: NewCandidate[] = [
      { id: "w1", conceptId: "t-weight", mastery: 0.2, examWeight: 0.2 },
      { id: "w2", conceptId: "t-weight", mastery: 0.2, examWeight: 0.2 },
      { id: "h1", conceptId: "t-hunt", mastery: 0.5, examWeight: 0.01 },
      { id: "h2", conceptId: "t-hunt", mastery: 0.5, examWeight: 0.01 },
    ];
    const result = assembleSession(due, news, {
      reviewCap: 50,
      newCap: 2,
      maxNewPerTopic: 3,
      huntTopicIds: ["t-hunt"],
    });
    const newIds = result.items.filter((i) => i.id !== "d1").map((i) => i.id);
    expect(newIds).toEqual(["h1", "h2"]);
  });
});
