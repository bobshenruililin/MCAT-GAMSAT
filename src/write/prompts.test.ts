import { describe, expect, it } from "vitest";
import { packIndex, taskFor, TASK_A_PACKS, TASK_B_PACKS } from "./prompts";

describe("S2 quote packs", () => {
  it("rotates by UTC date and keeps five packs per task", () => {
    expect(TASK_A_PACKS.length).toBeGreaterThanOrEqual(10);
    expect(TASK_B_PACKS.length).toBeGreaterThanOrEqual(10);
    const a = taskFor("A", new Date("2026-09-01T00:00:00.000Z"));
    const b = taskFor("A", new Date("2026-09-02T00:00:00.000Z"));
    expect(a.id).not.toBe(b.id);
    expect(packIndex(new Date("2026-09-01T23:00:00.000Z"), 5)).toBe(
      packIndex(new Date("2026-09-01T01:00:00.000Z"), 5),
    );
    expect(taskFor("B", new Date("2026-09-01T00:00:00.000Z")).quotes.length).toBe(5);
  });
});
