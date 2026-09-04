import { describe, expect, it } from "vitest";
import { HAND_BANK, SITABLE_DEPTH } from "@/factory/types";
import { exportWebBank } from "./exportBank";

describe("exportWebBank", () => {
  it("emits the sit-able website bank, never verified, depth floor on every weighted topic", () => {
    const bank = exportWebBank();
    expect(bank.itemCount).toBeGreaterThan(HAND_BANK);
    expect(bank.items).toHaveLength(bank.itemCount);
    expect(bank.items.every((it) => it.verified === false)).toBe(true);
    expect(bank.items.every((it) => it.choices.length === 4)).toBe(true);
    expect(new Set(bank.items.map((it) => it.id)).size).toBe(bank.itemCount);
    expect(bank.coverage.depthFloor).toBe(SITABLE_DEPTH);
    expect(bank.coverage.topicsAtOrAboveFloor).toBe(bank.coverage.weightedTopicCount);
    expect(bank.coverage.weightedTopicCount).toBe(290);
    expect(bank.coverage.origin.peer).toBeGreaterThan(1000);
    expect(bank.coverage.landscape[0]?.items).toBe(bank.itemCount);
  });
});
