import { allocateByWeight } from "./allocate";
import { conceptualItem, scenarioItem } from "./conceptual";
import { experimentPassage, isKineticsTopic } from "./experiment";
import { tryQuant } from "./quant";
import { loadWeightedTopics } from "./taxonomy";
import { FACTORY_TARGET, type FactoryBank, type FactoryItem, type FactoryPassage, type TopicNode } from "./types";
import { s2Item, verbalPassage } from "./verbal";

/** Pad indices sit far above any per-topic run index (largest topics are ~250k at 5000×). */
export const PAD_INDEX_BASE = 1_000_000_000;

function isVerbal(id: string): boolean {
  return id.startsWith("MCAT.CARS") || id.startsWith("GAMSAT.S1");
}

function isS2(id: string): boolean {
  return id.startsWith("GAMSAT.S2");
}

function isPsych(id: string): boolean {
  return /^MCAT\.FC(6|7|8|9|10)/.test(id);
}

export function countUnit(items: FactoryItem[], passages: FactoryPassage[]): number {
  return items.length + passages.reduce((s, p) => s + p.questions.length, 0);
}

export function fillTopic(
  topic: TopicNode,
  n: number,
  startIndex = 0,
): { items: FactoryItem[]; passages: FactoryPassage[] } {
  const items: FactoryItem[] = [];
  const passages: FactoryPassage[] = [];
  let made = 0;
  let i = startIndex;
  const stop = startIndex + Math.max(n * 3, n + 8);
  while (made < n) {
    const remaining = n - made;
    if (isVerbal(topic.id)) {
      passages.push(verbalPassage(topic, i));
      made += 1;
    } else if (isS2(topic.id)) {
      items.push(s2Item(topic, i));
      made += 1;
    } else if (!isPsych(topic.id) && isKineticsTopic(topic.id) && i % 11 === 0 && remaining >= 4) {
      passages.push(experimentPassage(topic, i));
      made += 4;
    } else if (isPsych(topic.id) && i % 2 === 0) {
      items.push(scenarioItem(topic, i));
      made += 1;
    } else {
      const q = tryQuant(topic, i);
      if (q) items.push(q);
      else items.push(conceptualItem(topic, i));
      made += 1;
    }
    i += 1;
    if (i > stop) break;
  }
  while (made < n) {
    items.push(conceptualItem(topic, PAD_INDEX_BASE + startIndex + made));
    made += 1;
  }
  return { items, passages };
}

/** In-memory bank for samples and tests. Full 5000× target must use `emitFactoryBatches`. */
export function generateBank(target = FACTORY_TARGET): FactoryBank {
  const topics = loadWeightedTopics();
  const alloc = allocateByWeight(topics, target);
  const items: FactoryItem[] = [];
  const passages: FactoryPassage[] = [];
  for (const topic of topics) {
    const n = alloc.get(topic.id) ?? 0;
    const part = fillTopic(topic, n);
    items.push(...part.items);
    passages.push(...part.passages);
  }
  const total = countUnit(items, passages);
  if (total < target) {
    const pad = topics[0];
    while (countUnit(items, passages) < target) {
      items.push(conceptualItem(pad, PAD_INDEX_BASE + items.length));
    }
  }
  if (total > target) {
    // experiment passages can overshoot by <4; drop extra discretes first
    while (countUnit(items, passages) > target && items.length > 0) {
      items.pop();
    }
  }
  return { items, passages };
}

export function bankStats(bank: FactoryBank): {
  questions: number;
  discretes: number;
  passageQuestions: number;
  passages: number;
  designs: Record<string, number>;
} {
  const designs: Record<string, number> = {};
  const bump = (d: string) => {
    designs[d] = (designs[d] ?? 0) + 1;
  };
  for (const it of bank.items) bump(it.design);
  for (const p of bank.passages) {
    bump(p.design);
    for (const q of p.questions) bump(q.design);
  }
  const passageQuestions = bank.passages.reduce((s, p) => s + p.questions.length, 0);
  return {
    questions: bank.items.length + passageQuestions,
    discretes: bank.items.length,
    passageQuestions,
    passages: bank.passages.length,
    designs,
  };
}
