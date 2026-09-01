import { describe, expect, it } from "vitest";
import {
  courseMasteryPercent,
  leveledUp,
  masteryLevel,
  proficientPlusShare,
} from "./masteryLevel";
import { pickUpNext } from "./upNext";

describe("masteryLevel", () => {
  it("maps unseen / struggling / familiar / proficient / mastered", () => {
    expect(masteryLevel({ mastery: 0.9, attempts: 0 })).toBe("unseen");
    expect(masteryLevel({ mastery: 0.2, attempts: 1 })).toBe("struggling");
    expect(masteryLevel({ mastery: 0.44, attempts: 4 })).toBe("struggling");
    expect(masteryLevel({ mastery: 0.45, attempts: 2 })).toBe("familiar");
    expect(masteryLevel({ mastery: 0.61, attempts: 2 })).toBe("familiar");
    expect(masteryLevel({ mastery: 0.62, attempts: 2 })).toBe("proficient");
    expect(masteryLevel({ mastery: 0.79, attempts: 8 })).toBe("proficient");
    expect(masteryLevel({ mastery: 0.8, attempts: 2 })).toBe("proficient");
    expect(masteryLevel({ mastery: 0.8, attempts: 3 })).toBe("mastered");
    expect(masteryLevel({ mastery: 0.95, attempts: 10 })).toBe("mastered");
  });

  it("detects a level-up", () => {
    expect(leveledUp("unseen", "struggling")).toBe(true);
    expect(leveledUp("struggling", "familiar")).toBe(true);
    expect(leveledUp("proficient", "mastered")).toBe(true);
    expect(leveledUp("familiar", "familiar")).toBe(false);
    expect(leveledUp("proficient", "struggling")).toBe(false);
  });
});

describe("courseMasteryPercent", () => {
  it("is a weight-weighted mean with unseen as 0, skipping weight 0", () => {
    expect(
      courseMasteryPercent([
        { mastery: 0.8, attempts: 5, examWeight: 0.2 },
        { mastery: 0.3, attempts: 0, examWeight: 0.2 },
        { mastery: 0.9, attempts: 4, examWeight: 0 },
      ]),
    ).toBeCloseTo(0.4, 8);
  });

  it("returns 0 on an empty or overlay-only tree", () => {
    expect(courseMasteryPercent([])).toBe(0);
    expect(courseMasteryPercent([{ mastery: 0.9, attempts: 3, examWeight: 0 }])).toBe(
      0,
    );
  });

  it("counts proficient+ as a share of weighted topics", () => {
    expect(
      proficientPlusShare([
        { mastery: 0.7, attempts: 2, examWeight: 0.1 },
        { mastery: 0.9, attempts: 3, examWeight: 0.1 },
        { mastery: 0.2, attempts: 4, examWeight: 0.1 },
        { mastery: 0.9, attempts: 3, examWeight: 0 },
      ]),
    ).toBeCloseTo(2 / 3, 8);
  });
});

describe("pickUpNext", () => {
  const base = {
    mastery: 0.3,
    attempts: 0,
    examWeight: 0.05,
    itemCount: 4,
  };

  it("returns hunt before struggling", () => {
    const next = pickUpNext(
      [
        { ...base, id: "hunt-me", name: "Hunt", mastery: 0.7, attempts: 6 },
        { ...base, id: "weak", name: "Weak", mastery: 0.2, attempts: 4, examWeight: 0.2 },
      ],
      ["hunt-me"],
    );
    expect(next?.id).toBe("hunt-me");
    expect(next?.reason).toBe("hunt");
  });

  it("picks struggling by remaining exam-weight gap", () => {
    const next = pickUpNext(
      [
        {
          ...base,
          id: "small-gap",
          name: "Small",
          mastery: 0.2,
          attempts: 4,
          examWeight: 0.05,
        },
        {
          ...base,
          id: "big-gap",
          name: "Big",
          mastery: 0.2,
          attempts: 4,
          examWeight: 0.2,
        },
        { ...base, id: "unseen-heavy", name: "Unseen", examWeight: 0.5 },
      ],
      [],
    );
    expect(next?.id).toBe("big-gap");
    expect(next?.reason).toBe("struggling");
    expect(next?.level).toBe("struggling");
  });

  it("falls through to highest-weight unseen with items", () => {
    const next = pickUpNext(
      [
        { ...base, id: "empty", name: "Empty", examWeight: 0.9, itemCount: 0 },
        { ...base, id: "light", name: "Light", examWeight: 0.05 },
        { ...base, id: "heavy", name: "Heavy", examWeight: 0.2 },
        { ...base, id: "overlay", name: "Overlay", examWeight: 0, itemCount: 8 },
      ],
      [],
    );
    expect(next?.id).toBe("heavy");
    expect(next?.reason).toBe("unseen");
  });

  it("uses weakest remaining gap when everything has been attempted", () => {
    const next = pickUpNext(
      [
        {
          ...base,
          id: "ok",
          name: "Ok",
          mastery: 0.7,
          attempts: 4,
          examWeight: 0.1,
        },
        {
          ...base,
          id: "worse",
          name: "Worse",
          mastery: 0.5,
          attempts: 4,
          examWeight: 0.2,
        },
      ],
      [],
    );
    expect(next?.id).toBe("worse");
    expect(next?.reason).toBe("weakest");
  });
});
