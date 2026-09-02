import { describe, expect, it } from "vitest";
import { toIngestJson } from "@/factory/item";
import { wordCount, validateIngestFile } from "@/ingest/validate";
import { PATTERNS } from "./catalog";
import { applyItem, generatePatternBank, identifyItem, patternBankStats } from "./generate";

describe("pattern generate", () => {
  it("puts the analog in identify and apply stems", () => {
    const p = PATTERNS[0];
    const id = identifyItem(p, 0);
    const ap = applyItem(p, 1);
    expect(id.stem).toContain(p.exampleSetup);
    expect(id.stem).toMatch(/^Item 1\./);
    expect(id.choices.map((c) => c.text)).toContain(p.exampleConclusion);
    expect(id.skill_tag).toBe(p.id);
    expect(ap.stem).toContain(p.exampleSetup);
    expect(ap.stem).toMatch(/^Example:/);
    expect(ap.stem).not.toMatch(/solved example of the move|booklet \d/);
    expect(ap.skill_tag).toBe(p.id);
    expect(wordCount(id.explanation)).toBeGreaterThanOrEqual(40);
    expect(wordCount(ap.explanation)).toBeGreaterThanOrEqual(40);
    expect(id.explanation).toContain(p.name);
    expect(ap.explanation).toContain(p.name);
  });

  it("emits an ingest-valid ranked bank with unique stems", () => {
    const items = generatePatternBank(90);
    expect(items).toHaveLength(90);
    const stats = patternBankStats(items);
    expect(stats.patterns).toBe(PATTERNS.length);
    expect(stats.minDiff).toBeLessThan(0.42);
    expect(stats.maxDiff).toBeGreaterThan(0.5);
    const stems = new Set(items.map((it) => it.stem));
    expect(stems.size).toBe(90);
    const diffs = [...items.map((it) => it.difficulty_est)].sort((a, b) => a - b);
    expect(diffs[0]).toBeLessThanOrEqual(diffs[diffs.length - 1]);
    const json = JSON.stringify({ items: items.map(toIngestJson) });
    const validated = validateIngestFile(json);
    expect(validated.rejected).toHaveLength(0);
    expect(validated.items).toHaveLength(90);
    for (const row of validated.items) {
      expect(row.skillTag?.startsWith("PAT.")).toBe(true);
    }
  });

  it("keeps unique stems at the 10× pattern target", () => {
    const items = generatePatternBank();
    expect(items).toHaveLength(120_000);
    expect(new Set(items.map((it) => it.stem)).size).toBe(120_000);
    const stats = patternBankStats(items);
    expect(stats.patterns).toBe(PATTERNS.length);
  }, 60_000);
});
