import { describe, expect, it } from "vitest";
import { HAND_BANK } from "@/factory/types";
import { exportWebBank } from "./exportBank";

describe("exportWebBank", () => {
  it("emits the hand-authored sit-able website bank, never verified", () => {
    const bank = exportWebBank();
    expect(bank.itemCount).toBe(HAND_BANK);
    expect(bank.items).toHaveLength(HAND_BANK);
    expect(bank.items.every((it) => it.verified === false)).toBe(true);
    expect(bank.items.every((it) => it.choices.length === 4)).toBe(true);
    expect(new Set(bank.items.map((it) => it.id)).size).toBe(HAND_BANK);
  });
});
