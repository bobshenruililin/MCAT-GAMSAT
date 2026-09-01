import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { count } from "drizzle-orm";
import { items } from "@/db/schema";
import { seedFromFile } from "@/db/seed-lib";
import { TAXONOMY_PATH } from "@/db/paths";
import { tempMigratedDb } from "@/engine/testDb";
import { wordCount } from "./validate";
import { ingestFileContents, removeCoveredPlaceholders, writeQuarantine } from "./ingest";

const EXPL = Array.from({ length: 42 }, (_, i) => `word${i}`).join(" ");

function discrete(overrides: Record<string, unknown> = {}) {
  return {
    concept_id: "MCAT.FC1.1A.t1",
    type: "discrete",
    stem: "A peptide is titrated; which residue is uncharged at pH 7 and cannot be phosphorylated?",
    choices: [
      { key: "A", text: "Serine" },
      { key: "B", text: "Glycine" },
      { key: "C", text: "Tyrosine" },
      { key: "D", text: "Threonine" },
    ],
    correct_key: "B",
    explanation: EXPL,
    distractor_rationales: {
      A: "Serine has a polar CH2OH side chain that can be phosphorylated.",
      C: "Tyrosine has a phenolic OH that can be phosphorylated.",
      D: "Threonine has a secondary alcohol that can be phosphorylated.",
    },
    difficulty_est: 0.4,
    ...overrides,
  };
}

describe("ingest validation", () => {
  it("counts explanation words", () => {
    expect(wordCount(EXPL)).toBeGreaterThanOrEqual(40);
    expect(wordCount("only three words")).toBe(3);
  });

  it("inserts a valid discrete and quarantines a short explanation", () => {
    const { db, close } = tempMigratedDb();
    seedFromFile(db, TAXONOMY_PATH);
    const raw = JSON.stringify({
      items: [discrete(), discrete({ stem: "short", explanation: "too short" })],
    });
    const result = ingestFileContents(db, raw, "fixture.json");
    expect(result.passed).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.inserted).toBe(1);
    expect(db.select({ n: count() }).from(items).get()?.n).toBe(1);
    expect(result.rejected[0].reasons.join(" ")).toMatch(/40/);
    const dir = mkdtempSync(path.join(tmpdir(), "q-"));
    const q = writeQuarantine("fixture.json", result.rejected, dir);
    expect(q).toBeTruthy();
    const dumped = JSON.parse(readFileSync(q!, "utf8")) as { rejected: unknown[] };
    expect(dumped.rejected).toHaveLength(1);
    close();
  });

  it("rejects unknown concept_id and missing distractor keys", () => {
    const { db, close } = tempMigratedDb();
    seedFromFile(db, TAXONOMY_PATH);
    const raw = JSON.stringify({
      items: [
        discrete({ concept_id: "NOPE.t1" }),
        discrete({
          stem: "other",
          distractor_rationales: { A: "only A" },
        }),
      ],
    });
    const result = ingestFileContents(db, raw, "fixture.json");
    expect(result.passed).toBe(0);
    expect(result.failed).toBe(2);
    close();
  });

  it("skips duplicate stem+concept and removes covered PLACEHOLDER items", () => {
    const { db, close } = tempMigratedDb();
    seedFromFile(db, TAXONOMY_PATH);
    const first = ingestFileContents(
      db,
      JSON.stringify({ items: [discrete()] }),
      "a.json",
    );
    const second = ingestFileContents(
      db,
      JSON.stringify({ items: [discrete()] }),
      "a.json",
    );
    expect(first.inserted).toBe(1);
    expect(second.skipped).toBe(1);
    expect(db.select({ n: count() }).from(items).get()?.n).toBe(1);

    db.insert(items)
      .values({
        id: "ph1",
        type: "discrete",
        passageId: null,
        conceptId: "MCAT.FC1.1A.t1",
        skillTag: null,
        stem: "[PLACEHOLDER] amino acids",
        choices: [
          { key: "A", text: "a" },
          { key: "B", text: "b" },
        ],
        correctKey: "A",
        explanation: "placeholder",
        distractorRationales: { B: "x" },
        difficultyEst: 0.4,
        source: "ai_generated",
        verified: false,
        createdAt: "2026-09-01T00:00:00.000Z",
      })
      .run();
    const removed = removeCoveredPlaceholders(db);
    expect(removed).toBe(1);
    expect(db.select({ n: count() }).from(items).get()?.n).toBe(1);
    close();
  });
});
