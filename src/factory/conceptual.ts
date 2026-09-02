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
  "A clinician",
  "An investigator",
  "A first-year student",
  "A field observer",
  "A methods tutor",
] as const;

const SETTINGS = [
  "A teaching-lab notebook",
  "A hospital assay bench",
  "An undergraduate practical",
  "A methods paragraph",
  "A research write-up",
] as const;

const SCIENCE_FOILS = [
  { id: "foil.photo", name: "Photosynthesis", description: "light-driven carbohydrate synthesis in chloroplasts" },
  { id: "foil.hw", name: "Hardy–Weinberg equilibrium", description: "constant allele frequencies without selection, drift, mutation, migration, or nonrandom mating" },
  { id: "foil.snell", name: "Snell’s law", description: "n1 sin θ1 = n2 sin θ2 at a refractive boundary" },
] as const;

const PSYCH_FOILS = [
  { id: "foil.habit", name: "Habituation", description: "decreased response after repeated benign stimulation" },
  { id: "foil.group", name: "Groupthink", description: "consensus pressure that suppresses dissent in cohesive groups" },
  { id: "foil.fae", name: "Fundamental attribution error", description: "over-weighting disposition relative to situation" },
] as const;

function isPsych(id: string): boolean {
  return /^MCAT\.FC(6|7|8|9|10)/.test(id);
}

function specimen(topic: TopicNode, index: number): string {
  const n = index + 1;
  if (isPsych(topic.id)) return `Participant ${n}`;
  if (topic.id.startsWith("MCAT.FC4") || topic.id.startsWith("MCAT.FC5")) {
    return `Compound ${n}`;
  }
  if (topic.id.startsWith("GAMSAT.S3")) return `Sample ${n}`;
  return `Isolate ${n}`;
}

function grains(description: string): string[] {
  return description
    .split(/,\s*/)
    .map((s) => s.replace(/\.$/, "").trim())
    .filter((s) => s.length > 1);
}

/** Two outline facts as observations — not the syllabus title. */
function observed(description: string, index: number): string {
  const g = grains(description);
  if (g.length === 0) return description.replace(/\.$/, "");
  if (g.length === 1) return g[0];
  const a = g[index % g.length];
  const b = g[(index + 1) % g.length];
  return a === b ? a : `${a}; ${b}`;
}

function account(name: string, description: string): string {
  const d = description.replace(/\.$/, "");
  return `${name} — ${d}.`;
}

function frameStem(topic: TopicNode, index: number, frame: string): string {
  const spec = specimen(topic, index);
  const fact = observed(topic.description, index);
  const setting = SETTINGS[index % SETTINGS.length];
  switch (frame) {
    case "apply":
      return `${setting} describes ${spec} as showing ${fact}. Which statement is correct?`;
    case "contrast":
      return `${spec} shows ${fact}. A neighboring class is easy to confuse with this one. Which statement is correct?`;
    case "predict":
      return `Before any calculation, ${spec} should be treated as showing ${fact}. Which statement is correct?`;
    case "confound":
      return `${spec} was filed under a neighboring heading. The notes actually report ${fact}. Which statement is correct?`;
    case "definition":
      return `Which statement is correct of ${spec}, recorded as showing ${fact}?`;
    case "transfer":
      return `A second bench records ${spec} with the same properties (${fact}). Which statement is correct?`;
    case "exception":
      return `${spec} shows ${fact}. Which statement is true of this case and not of a neighboring class?`;
    default:
      return `${setting}: ${spec} shows ${fact}. Which statement is correct?`;
  }
}

export function conceptualItem(topic: TopicNode, index: number): FactoryItem {
  const rng = mulberry(hashStr(`${topic.id}:${index}:concept`));
  const frame = FRAMES[index % FRAMES.length];
  const pool = siblingPool(topic);
  const traps = pickN(pool, 3, rng);
  const spec = specimen(topic, index);
  const explain =
    `${topic.name} matches the observations in the stem: ${topic.description} ` +
    `${spec} is the specimen label. ` +
    `The other options describe ${traps.map((t) => t.name).join("; ")}, which share vocabulary and are the usual misses. ` +
    `Pick the account that licenses the observations, not a famous neighbor.`;
  return assembleItem({
    conceptId: topic.id,
    type: "discrete",
    stem: frameStem(topic, index, frame),
    correct: account(topic.name, topic.description),
    distractors: [
      { text: account(traps[0].name, traps[0].description), why: `That describes ${traps[0].name}, a neighbor, not ${topic.name}.` },
      { text: account(traps[1].name, traps[1].description), why: `That describes ${traps[1].name}, not ${topic.name}.` },
      { text: account(traps[2].name, traps[2].description), why: `That describes ${traps[2].name}, a nearby-outline trap.` },
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
  const foils = isPsych(topic.id) ? PSYCH_FOILS : SCIENCE_FOILS;
  for (const foil of foils) {
    if (pool.length >= 3) break;
    if (foil.name === topic.name) continue;
    if (pool.some((s) => s.name === foil.name)) continue;
    pool.push({ id: foil.id, name: foil.name, description: foil.description });
  }
  return pool;
}

/** Psych/soc: behaviour in the stem, construct name in the options — the AAMC discrete shape. */
export function scenarioItem(topic: TopicNode, index: number): FactoryItem {
  const rng = mulberry(hashStr(`${topic.id}:${index}:scene`));
  const who = pick(WHO, rng);
  const spec = specimen(topic, index);
  const notes = topic.description.replace(/\.$/, "");
  const stem =
    `${who} interviews ${spec}. The record notes ${notes.charAt(0).toLowerCase()}${notes.slice(1)}. ` +
    `Which construct is illustrated?`;
  const pool = siblingPool(topic);
  const traps = pickN(pool, 3, rng);
  return assembleItem({
    conceptId: topic.id,
    type: "discrete",
    stem,
    correct: topic.name,
    distractors: traps.map((t) => ({
      text: t.name,
      why: `${t.name} is a neighboring construct; the record was written to ${topic.name}.`,
    })) as [{ text: string; why: string }, { text: string; why: string }, { text: string; why: string }],
    explanation:
      `${topic.name} is the construct whose outline is ${topic.description} ` +
      `P/S discretes are lost by picking a famous neighbor (${traps.map((t) => t.name).join("; ")}). ` +
      `${spec} only names the case. Match the recorded behaviour to the construct, not a look-alike theory.`,
    difficulty: 0.42 + (index % 4) * 0.07,
    rotate: (index + hashStr(topic.id)) % 4,
    design: "scenario.construct",
    salt: `${topic.id}#${index}`,
  });
}
