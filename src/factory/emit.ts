import { mkdirSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { allocateByWeight } from "./allocate";
import { conceptualItem } from "./conceptual";
import { countUnit, fillTopic, PAD_INDEX_BASE } from "./generate";
import { toIngestJson } from "./item";
import { loadWeightedTopics } from "./taxonomy";
import { FACTORY_TARGET, type FactoryItem, type FactoryPassage } from "./types";

export const FACTORY_DIR = path.join(process.cwd(), "content", "batches", "factory");

const DISC_CHUNK = 2000;
const PASS_CHUNK = 250;

function clearGenerated(dir: string, names: string[]): void {
  mkdirSync(dir, { recursive: true });
  for (const name of readdirSync(dir)) {
    if (names.some((prefix) => name === prefix || name.startsWith(prefix))) {
      unlinkSync(path.join(dir, name));
    }
  }
}

function passagePayload(passages: FactoryPassage[]) {
  return {
    passages: passages.map((p) => ({
      concept_id: p.concept_id,
      title: p.title,
      body: p.body,
      questions: p.questions.map(toIngestJson),
    })),
  };
}

/**
 * Stream one topic at a time so the 5000× bank (~4.2M items) is never held in RAM
 * or JSON.stringified as one blob (V8 max string / heap).
 */
export function emitFactoryBatches(
  target = FACTORY_TARGET,
  dir = FACTORY_DIR,
): {
  files: string[];
  questions: number;
} {
  mkdirSync(dir, { recursive: true });
  clearGenerated(dir, ["90-scoremax-disc-", "91-scoremax-pass-", "MANIFEST.json"]);

  const topics = loadWeightedTopics();
  const alloc = allocateByWeight(topics, target);
  const itemBuf: FactoryItem[] = [];
  const passBuf: FactoryPassage[] = [];
  const files: string[] = [];
  const designs: Record<string, number> = {};
  let discIndex = 0;
  let passIndex = 0;
  let discretes = 0;
  let passageQuestions = 0;
  let passages = 0;

  const bump = (d: string) => {
    designs[d] = (designs[d] ?? 0) + 1;
  };

  const writeDisc = (items: FactoryItem[]) => {
    const name = `90-scoremax-disc-${String(discIndex).padStart(4, "0")}.json`;
    discIndex += 1;
    const abs = path.join(dir, name);
    writeFileSync(abs, JSON.stringify({ items: items.map(toIngestJson) }));
    files.push(abs);
  };

  const writePass = (chunk: FactoryPassage[]) => {
    const name = `91-scoremax-pass-${String(passIndex).padStart(4, "0")}.json`;
    passIndex += 1;
    const abs = path.join(dir, name);
    writeFileSync(abs, JSON.stringify(passagePayload(chunk)));
    files.push(abs);
  };

  const flushItems = (force = false) => {
    while (itemBuf.length >= DISC_CHUNK || (force && itemBuf.length > 0)) {
      const n = Math.min(DISC_CHUNK, itemBuf.length);
      if (!force && n < DISC_CHUNK) break;
      writeDisc(itemBuf.splice(0, n));
    }
  };

  const flushPassages = (force = false) => {
    while (passBuf.length >= PASS_CHUNK || (force && passBuf.length > 0)) {
      const n = Math.min(PASS_CHUNK, passBuf.length);
      if (!force && n < PASS_CHUNK) break;
      writePass(passBuf.splice(0, n));
    }
  };

  for (const topic of topics) {
    const n = alloc.get(topic.id) ?? 0;
    if (n <= 0) continue;
    const part = fillTopic(topic, n);
    if (countUnit(part.items, part.passages) !== n) {
      // fillTopic pads to n; a mismatch here is a generator bug, not a silent short bank
      throw new Error(`fillTopic(${topic.id}) produced ${countUnit(part.items, part.passages)}, expected ${n}`);
    }
    for (const it of part.items) {
      bump(it.design);
      itemBuf.push(it);
    }
    discretes += part.items.length;
    for (const p of part.passages) {
      bump(p.design);
      for (const q of p.questions) bump(q.design);
      passBuf.push(p);
      passages += 1;
      passageQuestions += p.questions.length;
    }
    flushItems();
    flushPassages();
  }

  let questions = discretes + passageQuestions;
  if (questions < target) {
    const pad = topics[0];
    while (questions < target) {
      const it = conceptualItem(pad, PAD_INDEX_BASE + questions);
      bump(it.design);
      itemBuf.push(it);
      discretes += 1;
      questions += 1;
    }
  }
  while (questions > target && itemBuf.length > 0) {
    const removed = itemBuf.pop();
    if (!removed) break;
    designs[removed.design] = (designs[removed.design] ?? 1) - 1;
    discretes -= 1;
    questions -= 1;
  }

  flushItems(true);
  flushPassages(true);

  if (questions !== target) {
    throw new Error(`factory emit produced ${questions} questions, expected ${target}`);
  }

  writeFileSync(
    path.join(dir, "MANIFEST.json"),
    JSON.stringify({
      target,
      questions,
      discretes,
      passageQuestions,
      passages,
      files: files.map((f) => path.basename(f)),
      designs,
    }),
  );
  return { files, questions };
}

if (process.argv[1]?.includes(`${path.sep}factory${path.sep}emit.ts`)) {
  const n = process.argv[2] ? Number(process.argv[2]) : FACTORY_TARGET;
  const result = emitFactoryBatches(n);
  console.log(
    `factory:emit ${result.questions} questions in ${result.files.length} files → ${FACTORY_DIR}`,
  );
}
