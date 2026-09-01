import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { TAXONOMY_PATH } from "@/db/paths";
import { validateIngestFile } from "./validate";

const BATCH_DIR = path.join(process.cwd(), "content", "batches");

describe("starter bank files", () => {
  it("every 0*.json batch passes ingest schema with no rejects", () => {
    const files = readdirSync(BATCH_DIR)
      .filter((name) => /^0\d-.*\.json$/.test(name))
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
    expect(passed).toBe(315);
  });
});
