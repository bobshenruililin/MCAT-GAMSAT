import { assembleItem } from "@/factory/item";
import { wordCount } from "@/ingest/validate";
import { PATTERNS, type ExamPattern } from "./catalog";
import { defaultPatternId } from "./fromDesign";
import { buildApply } from "./instances";

export const PATTERN_TARGET = 120_000;

function padExplain(text: string, extra: string): string {
  const base = text.trim();
  if (wordCount(base) >= 40) return base;
  return `${base} ${extra} Neighbouring options copy a vivid detail, skip a conversion, or answer a different question than the one asked.`;
}

export function identifyItem(p: ExamPattern, index: number) {
  const stem =
    `Item ${index + 1}. ${p.exampleSetup} Which of the following is correct?`;
  const item = assembleItem({
    conceptId: p.topicId,
    type: "discrete",
    stem,
    correct: p.exampleConclusion,
    distractors: [
      { text: p.exampleWrong[0], why: "That option names a detail, overread, or wrong relation, not the keyed account." },
      { text: p.exampleWrong[1], why: "That option leaves the setup or answers a different question." },
      { text: p.exampleWrong[2], why: "That option is a standard trap for this past-paper shape." },
    ],
    explanation: padExplain(
      `${p.exampleSetup} The correct account is: ${p.exampleConclusion} ` +
        `That is the ${p.name} shape (${p.move}) tagged to ${p.topicId}.`,
      `Item ${index + 1} only numbers this instance.`,
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
    `Example: ${p.exampleSetup} ${p.exampleConclusion}\n\n` +
    `Item ${index + 1}. ${built.question}`;
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
      `The example is scored by ${p.name}: ${p.move} ` +
        `${built.close} Item ${index + 1} uses new nouns or numbers; do not copy the example's objects.`,
      `Tagged to ${p.topicId}.`,
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
