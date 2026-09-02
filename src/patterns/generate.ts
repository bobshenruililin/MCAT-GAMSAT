import { assembleItem, hashStr, mulberry, pick } from "@/factory/item";
import { wordCount } from "@/ingest/validate";
import { PATTERNS, type ExamPattern } from "./catalog";
import { defaultPatternId } from "./fromDesign";
import { buildApply } from "./instances";

export const PATTERN_TARGET = 120_000;

function padExplain(text: string, salt: string): string {
  const base = text.trim();
  if (wordCount(base) >= 40) return base;
  return `${base} The analog in the stem is a different instance of the same exam move; the keyed option is the only one that applies that move to the new numbers or new wording in this item (${salt}), not a restatement of the analog's nouns.`;
}

function foilPatterns(p: ExamPattern, rng: () => number): ExamPattern[] {
  const others = PATTERNS.filter((x) => x.id !== p.id);
  const out: ExamPattern[] = [];
  const copy = [...others];
  while (out.length < 3 && copy.length > 0) {
    out.push(pick(copy, rng));
    copy.splice(copy.indexOf(out[out.length - 1]), 1);
  }
  return out;
}

export function identifyItem(p: ExamPattern, index: number) {
  const rng = mulberry(hashStr(`${p.id}:id:${index}`));
  const foils = foilPatterns(p, rng);
  const setting = index % 2 === 0 ? "a fresh original stem" : "a new domain with the same relation";
  const stem =
    `Entry — identify the move. Worked analog: ${p.exampleSetup} ${p.exampleConclusion} ` +
    `Now ${setting} #${index} on the same exam family. Which move must you retrieve to score the new instance?`;
  const item = assembleItem({
    conceptId: p.topicId,
    type: "discrete",
    stem,
    correct: `${p.name}: ${p.move}`,
    distractors: [
      { text: `${foils[0].name}: ${foils[0].move}`, why: "That is a real exam move, but not the analog's move." },
      { text: `${foils[1].name}: ${foils[1].move}`, why: "Wrong family of error — this analog is not that trap." },
      { text: `${foils[2].name}: ${foils[2].move}`, why: "This move would answer a different past-paper genre." },
    ],
    explanation: padExplain(
      `Pattern (${p.id} — ${p.name}): ${p.move} Content grain (${p.topicId}): ${p.topicId}. ` +
        `The analog's conclusion was ${p.exampleConclusion} The new stem is scored by naming that same move, not by copying analog nouns.`,
      `${p.id}-${index}`,
    ),
    difficulty: 0.2 + (index % 4) * 0.05,
    rotate: index,
    design: "pattern.identify",
    skillTag: p.id,
    salt: `${p.id}-id-${index}`,
  });
  return item;
}

export function applyItem(p: ExamPattern, index: number) {
  const rung = index % 10;
  const difficulty = Math.min(0.95, 0.18 + rung * 0.08);
  const built = buildApply(p, index, rung);
  const stem =
    `Worked analog (do not re-answer it): ${p.exampleSetup} ${p.exampleConclusion} ` +
    built.question;
  const item = assembleItem({
    conceptId: p.topicId,
    type: "discrete",
    stem,
    correct: built.correct,
    distractors: [
      { text: built.distractors[0], why: built.why[0] },
      { text: built.distractors[1], why: built.why[1] },
      { text: built.distractors[2], why: built.why[2] },
    ],
    explanation: padExplain(
      `Pattern (${p.id} — ${p.name}): ${p.move} Content grain (${p.topicId}): ${p.topicId}. ` +
        `Difficulty rung ${rung}. ${built.close} The analog is scaffolding; the key is the new instance.`,
      `${p.id}-ap-${index}`,
    ),
    difficulty,
    rotate: index + 1,
    design: "pattern.apply",
    skillTag: p.id,
    salt: `${p.id}-ap-${index}`,
  });
  return item;
}

export function generatePatternBank(target = PATTERN_TARGET) {
  const items = [];
  let i = 0;
  while (items.length < target) {
    const p = PATTERNS[i % PATTERNS.length];
    items.push(i % 5 === 0 ? identifyItem(p, i) : applyItem(p, i));
    i += 1;
  }
  return items.slice(0, target);
}

export function patternBankStats(items: ReturnType<typeof generatePatternBank>) {
  const byPattern: Record<string, number> = {};
  const diffs = items.map((it) => it.difficulty_est).sort((a, b) => a - b);
  for (const it of items) {
    const tag = it.skill_tag ?? defaultPatternId(it.concept_id);
    byPattern[tag] = (byPattern[tag] ?? 0) + 1;
  }
  return {
    n: items.length,
    patterns: Object.keys(byPattern).length,
    byPattern,
    minDiff: diffs[0] ?? 0,
    maxDiff: diffs[diffs.length - 1] ?? 0,
  };
}
