import { assembleItem, hashStr, mulberry, pick, pickN } from "./item";
import type { FactoryItem, TopicNode } from "./types";

const FRAMES = [
  "identify",
  "apply",
  "contrast",
  "predict",
  "confound",
  "definition",
  "transfer",
  "exception",
] as const;

const WHO = [
  "An investigator",
  "A clinician",
  "A first-year student",
  "A lab partner",
  "A field observer",
];

function specimen(topic: TopicNode, index: number): string {
  const n = index + 1;
  if (/^MCAT\.FC(6|7|8|9|10)/.test(topic.id)) return `Participant ${n}`;
  if (topic.id.startsWith("MCAT.FC4") || topic.id.startsWith("MCAT.FC5")) {
    return `Compound ${n}`;
  }
  if (topic.id.startsWith("GAMSAT.S3")) return `Sample ${n}`;
  return `Mutant ${n}`;
}

function claim(name: string, description: string): string {
  const d = description.replace(/\.$/, "");
  return `${name} is the idea that covers ${d}.`;
}

function frameStem(topic: TopicNode, index: number, frame: string): string {
  const spec = specimen(topic, index);
  switch (frame) {
    case "apply":
      return `Results from ${spec} make sense only if you have a correct account of ${topic.name}. Which account is correct?`;
    case "contrast":
      return `Two nearby ideas are easy to swap when scoring ${spec}. Which statement correctly describes ${topic.name}?`;
    case "predict":
      return `If ${topic.name} is the operative idea for ${spec}, which description should you use?`;
    case "confound":
      return `A write-up of ${spec} claims to isolate ${topic.name}. Which description actually matches that idea rather than a neighbor?`;
    case "definition":
      return `Which statement correctly describes ${topic.name}? Use it on ${spec}.`;
    case "transfer":
      return `${spec} is a new cover for the same idea. Which statement still describes ${topic.name}?`;
    case "exception":
      return `Which statement about ${topic.name} would correctly score ${spec} and would be false of a neighboring idea?`;
    default:
      return `Which statement correctly describes ${topic.name}, as needed to interpret ${spec}?`;
  }
}

export function conceptualItem(topic: TopicNode, index: number): FactoryItem {
  const rng = mulberry(hashStr(`${topic.id}:${index}:concept`));
  const frame = FRAMES[index % FRAMES.length];
  const pool = siblingPool(topic);
  const traps = pickN(pool, 3, rng);
  const spec = specimen(topic, index);
  const explain =
    `${topic.name} covers ${topic.description} ` +
    `${spec} is just the case label; the keyed idea does not change. ` +
    `The misses name neighboring ideas (${traps.map((t) => t.name).join("; ")}) that sound related on exam morning. ` +
    `Pick the outline idea that actually licenses the key, not the famous neighbor.`;
  return assembleItem({
    conceptId: topic.id,
    type: "discrete",
    stem: frameStem(topic, index, frame),
    correct: claim(topic.name, topic.description),
    distractors: [
      { text: claim(traps[0].name, traps[0].description), why: `That describes ${traps[0].name}, a neighbor, not ${topic.name}.` },
      { text: claim(traps[1].name, traps[1].description), why: `That describes ${traps[1].name}, not ${topic.name}.` },
      { text: claim(traps[2].name, traps[2].description), why: `That describes ${traps[2].name}, a nearby-outline trap.` },
    ],
    explanation: explain,
    difficulty: 0.35 + (index % 5) * 0.08,
    rotate: hashStr(topic.id + String(index)) % 4,
    design: `conceptual.${frame}`,
    salt: `${topic.id}#${index}`,
  });
}

function siblingPool(topic: TopicNode): { id: string; name: string; description: string }[] {
  const pool = [...topic.siblings];
  if (pool.length < 3) {
    pool.push(
      { id: "foil.overlay", name: "an overlay skill with no exam weight", description: "a SIRS or reasoning-from-data overlay that is not this content idea." },
      { id: "foil.family", name: "a different exam family", description: "a node from another section of the outline, not this topic." },
      { id: "foil.reread", name: "rereading a summary", description: "going back over notes instead of answering a tagged question." },
    );
  }
  return pool;
}

/** Psych/soc: a short vignette that still discriminates the named construct. */
export function scenarioItem(topic: TopicNode, index: number): FactoryItem {
  const rng = mulberry(hashStr(`${topic.id}:${index}:scene`));
  const who = pick(WHO, rng);
  const spec = specimen(topic, index);
  const stem =
    `${who} writes up ${spec}. The behaviour in the write-up matches ${topic.name} and not a neighboring theory. Which label is correct?`;
  const pool = siblingPool(topic);
  const traps = pickN(pool, 3, rng);
  return assembleItem({
    conceptId: topic.id,
    type: "discrete",
    stem,
    correct: claim(topic.name, topic.description),
    distractors: traps.map((t) => ({
      text: claim(t.name, t.description),
      why: `${t.name} is the neighboring construct; the write-up was built to the ${topic.name} definition.`,
    })) as [{ text: string; why: string }, { text: string; why: string }, { text: string; why: string }],
    explanation:
      `${topic.name} covers ${topic.description} ` +
      `P/S items are lost by picking a famous neighbor. ` +
      `${spec} only names the case; the construct does not change. ` +
      `This is retrieval of the idea, not a reread of a notes paragraph.`,
    difficulty: 0.42 + (index % 4) * 0.07,
    rotate: (index + hashStr(topic.id)) % 4,
    design: "scenario.construct",
    salt: `${topic.id}#${index}`,
  });
}
