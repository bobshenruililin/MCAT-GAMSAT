import { Rating, State } from "ts-fsrs";
import { describe, expect, it } from "vitest";
import { schedule } from "./reviewEngine";
import { insertDiscrete, insertTopicTree, tempMigratedDb } from "./testDb";

describe("reviewEngine FSRS properties", () => {
  it("interval grows on Good/Easy once the card is in Review", () => {
    const { db, close } = tempMigratedDb();
    insertTopicTree(db, ["MCAT.FC1.1A.t1"]);
    insertDiscrete(db, "item-good", "MCAT.FC1.1A.t1");
    let now = new Date("2026-01-01T00:00:00.000Z");
    let card = schedule(db, "item-good", Rating.Good, now);
    let guard = 0;
    while (card.state !== State.Review && guard < 8) {
      now = card.due;
      card = schedule(db, "item-good", Rating.Good, now);
      guard += 1;
    }
    expect(card.state).toBe(State.Review);
    const afterFirstReview = now;
    const interval1 = card.due.getTime() - afterFirstReview.getTime();
    now = card.due;
    card = schedule(db, "item-good", Rating.Good, now);
    const intervalGood = card.due.getTime() - now.getTime();
    expect(intervalGood).toBeGreaterThan(interval1);

    insertDiscrete(db, "item-easy", "MCAT.FC1.1A.t1");
    now = new Date("2026-01-01T00:00:00.000Z");
    card = schedule(db, "item-easy", Rating.Easy, now);
    guard = 0;
    while (card.state !== State.Review && guard < 8) {
      now = card.due;
      card = schedule(db, "item-easy", Rating.Easy, now);
      guard += 1;
    }
    const easyAnchor = now;
    const easyInterval1 = card.due.getTime() - easyAnchor.getTime();
    now = card.due;
    card = schedule(db, "item-easy", Rating.Easy, now);
    const easyInterval2 = card.due.getTime() - now.getTime();
    expect(easyInterval2).toBeGreaterThan(easyInterval1);
    expect(easyInterval2).toBeGreaterThan(intervalGood);
    close();
  });

  it("Again from Review moves toward relearning and shortens the next due", () => {
    const { db, close } = tempMigratedDb();
    insertTopicTree(db, ["MCAT.FC1.1A.t1"]);
    insertDiscrete(db, "item-again", "MCAT.FC1.1A.t1");
    let now = new Date("2026-01-01T00:00:00.000Z");
    let card = schedule(db, "item-again", Rating.Good, now);
    let guard = 0;
    while (card.state !== State.Review && guard < 8) {
      now = card.due;
      card = schedule(db, "item-again", Rating.Good, now);
      guard += 1;
    }
    now = card.due;
    card = schedule(db, "item-again", Rating.Good, now);
    const longInterval = card.due.getTime() - now.getTime();
    now = card.due;
    card = schedule(db, "item-again", Rating.Again, now);
    expect(card.state).toBe(State.Relearning);
    expect(card.lapses).toBeGreaterThan(0);
    expect(card.due.getTime() - now.getTime()).toBeLessThan(longInterval);
    close();
  });
});
