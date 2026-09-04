import { describe, expect, it } from "vitest";
import { sittingItemIds } from "./assembleWeb";
import { emptyLedger } from "./ledger";
import type { WebItem } from "./types";

function item(partial: Partial<WebItem> & { id: string; conceptId: string }): WebItem {
  return {
    family: "MCAT B/B",
    type: "discrete",
    stem: partial.stem ?? partial.id,
    choices: [
      { key: "A", text: "a" },
      { key: "B", text: "b" },
      { key: "C", text: "c" },
      { key: "D", text: "d" },
    ],
    correctKey: "A",
    explanation: "because",
    distractorRationales: {},
    difficultyEst: 0.4,
    examWeight: 0.01,
    passage: null,
    verified: false,
    skillTag: null,
    origin: "hand",
    ...partial,
  };
}

describe("sittingItemIds", () => {
  it("interleaves topics and stays at the web cap", () => {
    const items = [
      item({ id: "a1", conceptId: "MCAT.FC1.1A.t1" }),
      item({ id: "a2", conceptId: "MCAT.FC1.1A.t1" }),
      item({ id: "a3", conceptId: "MCAT.FC1.1A.t1" }),
      item({ id: "b1", conceptId: "MCAT.FC5.5A.t1", family: "MCAT C/P" }),
      item({ id: "b2", conceptId: "MCAT.FC5.5A.t1", family: "MCAT C/P" }),
      item({ id: "c1", conceptId: "MCAT.CARS.t1", family: "MCAT CARS" }),
    ];
    const ids = sittingItemIds(items, emptyLedger(), undefined, new Date("2026-09-02T00:00:00Z"));
    expect(ids.length).toBeGreaterThan(0);
    expect(ids.length).toBeLessThanOrEqual(12);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("filters a family track", () => {
    const items = [
      item({ id: "cars1", conceptId: "MCAT.CARS.t1", family: "MCAT CARS" }),
      item({ id: "bb1", conceptId: "MCAT.FC1.1A.t1", family: "MCAT B/B" }),
    ];
    const ids = sittingItemIds(items, emptyLedger(), "MCAT CARS", new Date());
    expect(ids).toEqual(["cars1"]);
  });

  it("ladders mode prefers SIRS-tagged items when enough exist", () => {
    const items = [
      item({ id: "plain", conceptId: "MCAT.FC1.1A.t1" }),
      item({
        id: "sirs",
        conceptId: "MCAT.FC4.4A.t4",
        family: "MCAT C/P",
        skillTag: "SIRS2",
      }),
      item({
        id: "teach",
        conceptId: "MCAT.FC1.1A.t2",
        skillTag: "teach_on_miss",
      }),
    ];
    const ids = sittingItemIds(items, emptyLedger(), undefined, new Date(), {
      mode: "ladders",
    });
    expect(ids).toContain("sirs");
    expect(ids).toContain("teach");
    expect(ids).not.toContain("plain");
  });
});
