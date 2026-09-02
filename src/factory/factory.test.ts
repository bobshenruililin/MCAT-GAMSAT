import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { TAXONOMY_PATH } from "@/db/paths";
import { wordCount, validateIngestFile } from "@/ingest/validate";
import { allocateByWeight, allocationSum } from "./allocate";
import { generateBank, bankStats } from "./generate";
import { toIngestJson } from "./item";
import { loadWeightedTopics } from "./taxonomy";
import { FACTORY_TARGET, FLOOR_PER_TOPIC, HAND_BANK, TARGET_MULTIPLIER } from "./types";

function serialize(bank: ReturnType<typeof generateBank>): string {
  return JSON.stringify({
    items: bank.items.map(toIngestJson),
    passages: bank.passages.map((p) => ({
      concept_id: p.concept_id,
      title: p.title,
      body: p.body,
      questions: p.questions.map(toIngestJson),
    })),
  });
}

describe("score-max factory", () => {
  it("targets 500× the hand bank, allocated by exam_weight with a floor", () => {
    expect(HAND_BANK * TARGET_MULTIPLIER).toBe(FACTORY_TARGET);
    expect(FACTORY_TARGET).toBe(423_500);
    const topics = loadWeightedTopics();
    const alloc = allocateByWeight(topics);
    expect(allocationSum(alloc)).toBe(FACTORY_TARGET);
    expect(topics).toHaveLength(290);
    for (const t of topics) {
      expect(alloc.get(t.id) ?? 0).toBeGreaterThanOrEqual(FLOOR_PER_TOPIC);
    }
    const cars = topics.filter((t) => t.id.startsWith("MCAT.CARS"));
    const fc10 = topics.filter((t) => t.id.startsWith("MCAT.FC10"));
    const carsMean =
      cars.reduce((s, t) => s + (alloc.get(t.id) ?? 0), 0) / cars.length;
    const fc10Mean =
      fc10.reduce((s, t) => s + (alloc.get(t.id) ?? 0), 0) / fc10.length;
    expect(carsMean).toBeGreaterThan(fc10Mean);
  });

  it("emits ingest-valid unique items on a 900-question sample covering every family", () => {
    const bank = generateBank(900);
    const stats = bankStats(bank);
    expect(stats.questions).toBe(900);
    expect(stats.passageQuestions).toBeGreaterThan(50);
    expect(stats.discretes).toBeGreaterThan(50);
    const result = validateIngestFile(serialize(bank), TAXONOMY_PATH);
    expect(result.rejected).toEqual([]);
    const rows = [
      ...result.items.map((i) => `${i.conceptId}\n${i.stem}`),
      ...result.passages.flatMap((p) => p.questions.map((q) => `${q.conceptId}\n${q.stem}`)),
    ];
    expect(new Set(rows).size).toBe(rows.length);
    for (const row of result.items) {
      expect(wordCount(row.explanation)).toBeGreaterThanOrEqual(40);
    }
  });

  it("emits exactly 500× questions for the full factory target", () => {
    const bank = generateBank(FACTORY_TARGET);
    expect(bankStats(bank).questions).toBe(FACTORY_TARGET);
    const keys = [
      ...bank.items.map((i) => `${i.concept_id}\n${i.stem}`),
      ...bank.passages.flatMap((p) =>
        p.questions.map((q) => `${q.concept_id}\n${q.stem}`),
      ),
    ];
    expect(new Set(keys).size).toBe(keys.length);

    // One JSON.stringify of 423k items exceeds V8's max string length.
    let validated = 0;
    for (let i = 0; i < bank.items.length; i += 2000) {
      const result = validateIngestFile(
        JSON.stringify({ items: bank.items.slice(i, i + 2000).map(toIngestJson) }),
        TAXONOMY_PATH,
      );
      expect(result.rejected).toEqual([]);
      validated += result.items.length;
    }
    for (let i = 0; i < bank.passages.length; i += 250) {
      const result = validateIngestFile(
        JSON.stringify({
          passages: bank.passages.slice(i, i + 250).map((p) => ({
            concept_id: p.concept_id,
            title: p.title,
            body: p.body,
            questions: p.questions.map(toIngestJson),
          })),
        }),
        TAXONOMY_PATH,
      );
      expect(result.rejected).toEqual([]);
      validated += result.passages.reduce((s, p) => s + p.questions.length, 0);
    }
    expect(validated).toBe(FACTORY_TARGET);
  }, 120_000);

  it("does not collide with the committed hand bank on a sampled factory slice", () => {
    const bank = generateBank(400);
    const factoryKeys = new Set(
      [
        ...bank.items.map((i) => `${i.concept_id}\n${i.stem}`),
        ...bank.passages.flatMap((p) =>
          p.questions.map((q) => `${q.concept_id}\n${q.stem}`),
        ),
      ],
    );
    const raw = readFileSync(
      `${process.cwd()}/content/batches/01-fc1-proteins.json`,
      "utf8",
    );
    const hand = validateIngestFile(raw, TAXONOMY_PATH);
    for (const item of hand.items) {
      expect(factoryKeys.has(`${item.conceptId}\n${item.stem}`)).toBe(false);
    }
  });
});
