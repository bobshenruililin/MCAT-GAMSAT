import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { TAXONOMY_PATH } from "@/db/paths";
import { validateIngestFile } from "./validate";
import { parseTaxonomyJson, validateTaxonomy } from "@/db/seed-lib";

const BATCH_DIR = path.join(process.cwd(), "content", "batches");

describe("exam bank files", () => {
  it("every numbered batch passes ingest schema with no rejects", () => {
    const files = readdirSync(BATCH_DIR)
      .filter((name) => /^\d+-.*\.json$/.test(name))
      .sort();
    expect(files.length).toBeGreaterThanOrEqual(8);
    let passed = 0;
    for (const name of files) {
      const raw = readFileSync(path.join(BATCH_DIR, name), "utf8");
      const result = validateIngestFile(raw, TAXONOMY_PATH);
      expect(result.rejected, name).toEqual([]);
      passed +=
        result.items.length +
        result.passages.reduce((s, p) => s + p.questions.length, 0);
    }
    expect(passed).toBeGreaterThanOrEqual(315);
    for (const name of files) {
      const raw = readFileSync(path.join(BATCH_DIR, name), "utf8");
      expect(raw.includes("PLACEHOLDER"), name).toBe(false);
    }
  });

  it("covers every exam_weight > 0 topic with at least one real item", () => {
    const nodes = validateTaxonomy(
      parseTaxonomyJson(readFileSync(TAXONOMY_PATH, "utf8"), TAXONOMY_PATH),
      TAXONOMY_PATH,
    );
    const weighted = nodes.filter((n) => n.level === "topic" && n.exam_weight > 0);
    const covered = new Set<string>();
    const files = readdirSync(BATCH_DIR)
      .filter((name) => /^\d+-.*\.json$/.test(name))
      .sort();
    for (const name of files) {
      const result = validateIngestFile(
        readFileSync(path.join(BATCH_DIR, name), "utf8"),
        TAXONOMY_PATH,
      );
      for (const item of result.items) covered.add(item.conceptId);
      for (const p of result.passages) {
        for (const q of p.questions) covered.add(q.conceptId);
      }
    }
    const missing = weighted.filter((t) => !covered.has(t.id)).map((t) => t.id);
    expect(missing).toEqual([]);
  });
});
