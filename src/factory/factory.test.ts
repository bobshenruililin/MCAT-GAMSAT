import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { TAXONOMY_PATH } from "@/db/paths";
import { wordCount, validateIngestFile } from "@/ingest/validate";
import { allocateByWeight, allocationSum } from "./allocate";
import { emitFactoryBatches } from "./emit";
import { generateBank, bankStats, fillTopic, countUnit } from "./generate";
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

function ingestQuestionCount(file: string): number {
  const result = validateIngestFile(readFileSync(file, "utf8"), TAXONOMY_PATH);
  expect(result.rejected).toEqual([]);
  return result.items.length + result.passages.reduce((s, p) => s + p.questions.length, 0);
}

describe("score-max factory", () => {
  it("targets 5000× the hand bank, allocated by exam_weight with a floor", () => {
    expect(HAND_BANK * TARGET_MULTIPLIER).toBe(FACTORY_TARGET);
    expect(FACTORY_TARGET).toBe(4_235_000);
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

  it("keeps unique ingest-valid stems for one science topic at 12k (no 4.2M RAM bank)", () => {
    const topics = loadWeightedTopics();
    const topic = topics.find(
      (t) =>
        !t.id.startsWith("MCAT.CARS") &&
        !t.id.startsWith("GAMSAT.S1") &&
        !t.id.startsWith("GAMSAT.S2"),
    );
    expect(topic).toBeTruthy();
    const part = fillTopic(topic!, 12_000);
    expect(countUnit(part.items, part.passages)).toBe(12_000);
    const keys = [
      ...part.items.map((i) => `${i.concept_id}\n${i.stem}`),
      ...part.passages.flatMap((p) => p.questions.map((q) => `${q.concept_id}\n${q.stem}`)),
    ];
    expect(new Set(keys).size).toBe(keys.length);
    for (let i = 0; i < part.items.length; i += 2000) {
      const result = validateIngestFile(
        JSON.stringify({ items: part.items.slice(i, i + 2000).map(toIngestJson) }),
        TAXONOMY_PATH,
      );
      expect(result.rejected).toEqual([]);
    }
    for (let i = 0; i < part.passages.length; i += 250) {
      const result = validateIngestFile(
        JSON.stringify({
          passages: part.passages.slice(i, i + 250).map((p) => ({
            concept_id: p.concept_id,
            title: p.title,
            body: p.body,
            questions: p.questions.map(toIngestJson),
          })),
        }),
        TAXONOMY_PATH,
      );
      expect(result.rejected).toEqual([]);
    }
  });

  it("streams emit to an exact target without holding a giant in-memory bank", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "factory-10x-"));
    try {
      const result = emitFactoryBatches(1_500, dir);
      expect(result.questions).toBe(1_500);
      expect(result.files.length).toBeGreaterThan(0);
      const counted = result.files.reduce((s, f) => s + ingestQuestionCount(f), 0);
      expect(counted).toBe(1_500);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

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

  it("does not leak factory scaffolding into the stem or passage body", () => {
    const forbidden =
      /pack \d|vignette \d|tested grain|this bank|cover story|productive retrieval|Entry — identify|\(run \d+\)|\(trial \d+\)|\(issue \d+\)|\(set \d+\)|Seed \d+|as tagged in this bank|item-writer workshop|In passage \d|idea that covers|craft grain|which writing move|solved example of the move|new cover for the same|booklet \d/;
    const topics = loadWeightedTopics();
    const byId = new Map(topics.map((t) => [t.id, t]));
    const bank = generateBank(900);
    for (const it of bank.items) {
      expect(it.stem, it.stem.slice(0, 160)).not.toMatch(forbidden);
      expect(it.explanation).not.toMatch(/Seed \d+|tested grain|this bank/);
      for (const ch of it.choices) {
        expect(ch.text).not.toMatch(/is the idea that covers/i);
      }
    }
    for (const p of bank.passages) {
      expect(p.body).not.toMatch(/Seed \d+ only changes/);
      expect(p.body).not.toMatch(/argumentative shape stays this concession/);
      for (const q of p.questions) {
        expect(q.stem, q.stem.slice(0, 160)).not.toMatch(forbidden);
        expect(q.stem).not.toMatch(/Table \d+ is attached/);
        expect(q.explanation).not.toMatch(/Seed \d+/);
      }
    }
    const s2 = bank.items.find((it) => it.concept_id.startsWith("GAMSAT.S2"));
    expect(s2).toBeTruthy();
    expect(s2!.stem).toMatch(/Task [AB] — 30 minutes/);
    expect(s2!.stem).not.toMatch(/craft grain|writing move/);

    const conceptual = bank.items.find((it) => it.design.startsWith("conceptual"));
    expect(conceptual).toBeTruthy();
    const topic = byId.get(conceptual!.concept_id);
    expect(topic).toBeTruthy();
    if (topic && !topic.description.includes(topic.name)) {
      expect(conceptual!.stem.includes(topic.name)).toBe(false);
    }

    const scene = bank.items.find((it) => it.design === "scenario.construct");
    if (scene) {
      const st = byId.get(scene.concept_id);
      if (st && !st.description.includes(st.name)) {
        expect(scene.stem.includes(st.name)).toBe(false);
      }
      expect(scene.stem).toMatch(/Which construct is illustrated\?/);
    }

    const quant = bank.items.find((it) => it.design.startsWith("kinematics") || it.design.startsWith("newton"));
    if (quant) {
      expect(quant.stem).toMatch(/^In experiment \d+/);
    }

    for (const it of bank.items) {
      const texts = it.choices.map((ch) => ch.text);
      expect(new Set(texts).size, it.stem.slice(0, 80)).toBe(4);
    }
  });
});
