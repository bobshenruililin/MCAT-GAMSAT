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

const SETTINGS = [
  "a timed section block",
  "a wet-lab notebook page",
  "an OSCE-style stem",
  "a first-year lecture clicker",
  "a passage table footnote",
  "a hallway argument between two students",
  "a research-methods vignette",
  "an item-writer workshop",
];

function siblingPool(topic: TopicNode): { id: string; name: string; description: string }[] {
  const pool = [...topic.siblings];
  if (pool.length < 3) {
    pool.push(
      { id: "foil.overlay", name: "unrelated overlay skill", description: "A weight-0 overlay (SIRS or rfd) that is not this content grain." },
      { id: "foil.family", name: "a different exam family", description: "A node from another section of the outline, not this topic." },
      { id: "foil.reread", name: "a notes-reread strategy", description: "Re-reading a summary instead of answering a tagged retrieval item." },
    );
  }
  return pool;
}

function frameStem(topic: TopicNode, index: number, frame: string, setting: string): string {
  const salt = `#${index}`;
  switch (frame) {
    case "apply":
      return `In ${setting}${salt}, a stem is built so that only the definition of ${topic.name} licenses the key. Which statement is the productive retrieval target?`;
    case "contrast":
      return `Two nearby outline nodes are easy to swap. In ${setting}${salt}, which option correctly names ${topic.name} rather than a sibling?`;
    case "predict":
      return `If the tested grain is ${topic.name}, which prediction should survive in ${setting}${salt}?`;
    case "confound":
      return `An experiment write-up in ${setting}${salt} claims to isolate ${topic.name}. Which description actually matches that grain instead of a confound from a neighboring topic?`;
    case "definition":
      return `Which option is the accurate capsule of ${topic.name} as tagged in this bank${salt}?`;
    case "transfer":
      return `A new cover story in ${setting}${salt} still tests ${topic.name}. Which statement transfers the grain instead of a look-alike sibling?`;
    case "exception":
      return `Which statement correctly describes ${topic.name} and would falsify a sibling substitution in ${setting}${salt}?`;
    default:
      return `Which option correctly identifies ${topic.name} (${topic.description}) as the tested grain${salt}?`;
  }
}

export function conceptualItem(topic: TopicNode, index: number): FactoryItem {
  const rng = mulberry(hashStr(`${topic.id}:${index}:concept`));
  const frame = FRAMES[index % FRAMES.length];
  const setting = SETTINGS[index % SETTINGS.length];
  const pool = siblingPool(topic);
  const traps = pickN(pool, 3, rng);
  const correct = `${topic.name}: ${topic.description}`;
  const explain =
    `${topic.name} is the tagged grain: ${topic.description} ` +
    `The item is a discrimination drill — exam score is lost when a neighboring node is selected because it “sounds related.” ` +
    `Siblings ${traps.map((t) => t.name).join("; ")} are live look-alikes, not second keys. ` +
    `Frame ${frame} in ${setting} changes only the cover story (index ${index}), not the outline node.`;
  return assembleItem({
    conceptId: topic.id,
    type: "discrete",
    stem: frameStem(topic, index, frame, setting),
    correct,
    distractors: [
      { text: `${traps[0].name}: ${traps[0].description}`, why: `That is ${traps[0].name}, a sibling or foil, not ${topic.name}.` },
      { text: `${traps[1].name}: ${traps[1].description}`, why: `That is ${traps[1].name}, not the tagged node.` },
      { text: `${traps[2].name}: ${traps[2].description}`, why: `That is ${traps[2].name}, a nearby-outline trap.` },
    ],
    explanation: explain,
    difficulty: 0.35 + (index % 5) * 0.08,
    rotate: hashStr(topic.id + String(index)) % 4,
    design: `conceptual.${frame}`,
    salt: `${topic.id}#${index}`,
  });
}

/** Psych/soc and similar: scenario that still discriminates the named construct. */
export function scenarioItem(topic: TopicNode, index: number): FactoryItem {
  const rng = mulberry(hashStr(`${topic.id}:${index}:scene`));
  const who = pick(
    ["A first-year student", "A clinic observer", "A field ethnographer", "A trial subject", "A debate speaker"],
    rng,
  );
  const stem =
    `${who} in vignette ${index} must choose the construct that matches ${topic.name}. ` +
    `The behaviour in the stem is exactly the outline description, not a neighboring theory. Which label is correct?`;
  const pool = siblingPool(topic);
  const traps = pickN(pool, 3, rng);
  return assembleItem({
    conceptId: topic.id,
    type: "discrete",
    stem,
    correct: `${topic.name} — ${topic.description}`,
    distractors: traps.map((t) => ({
      text: `${t.name} — ${t.description}`,
      why: `${t.name} is the neighboring construct; the vignette was written to the ${topic.name} definition.`,
    })) as [ { text: string; why: string }, { text: string; why: string }, { text: string; why: string } ],
    explanation:
      `The vignette is a cover story for ${topic.name}: ${topic.description} ` +
      `MCAT P/S and similar items are lost by picking a famous neighbor (the traps). ` +
      `Index ${index} only changes who is speaking; the tagged node does not change. ` +
      `This is retrieval of the outline grain, not a reread of a notes paragraph.`,
    difficulty: 0.42 + (index % 4) * 0.07,
    rotate: (index + hashStr(topic.id)) % 4,
    design: "scenario.construct",
    salt: `${topic.id}#${index}`,
  });
}
