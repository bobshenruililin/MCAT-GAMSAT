import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { TAXONOMY_PATH } from "@/db/paths";
import { PATTERNS, PATTERN_BY_ID, isPatternTag, patternById } from "./catalog";

describe("pattern catalog", () => {
  it("has unique ids, examples, and taxonomy topic ids", () => {
    const raw = JSON.parse(readFileSync(TAXONOMY_PATH, "utf8")) as {
      nodes: { id: string }[];
    };
    const topicIds = new Set(raw.nodes.map((n) => n.id));
    const ids = new Set<string>();
    expect(PATTERNS.length).toBeGreaterThanOrEqual(18);
    for (const p of PATTERNS) {
      expect(ids.has(p.id)).toBe(false);
      ids.add(p.id);
      expect(p.id.startsWith("PAT.")).toBe(true);
      expect(p.name.length).toBeGreaterThan(0);
      expect(p.move.length).toBeGreaterThan(20);
      expect(p.exampleSetup.length).toBeGreaterThan(20);
      expect(p.exampleWrong).toHaveLength(3);
      expect(p.exampleWrong[0].length).toBeGreaterThan(8);
      expect(topicIds.has(p.topicId)).toBe(true);
      expect(PATTERN_BY_ID[p.id]).toBe(p);
    }
    expect(isPatternTag("PAT.CARS.main_point")).toBe(true);
    expect(isPatternTag("SIRS1")).toBe(false);
    expect(patternById("PAT.CARS.main_point")?.name).toMatch(/main point/i);
    expect(patternById("nope")).toBeNull();
  });
});
