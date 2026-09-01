import { PATTERNS, patternById, type ExamPattern } from "./catalog";

export type PatternCard = {
  id: string;
  name: string;
  move: string;
};

export function decorateExplanation(input: {
  explanation: string;
  skillTag: string | null;
  conceptId: string;
  conceptName?: string | null;
}): { explanation: string; pattern: PatternCard | null } {
  const pattern = patternById(input.skillTag);
  const content = input.conceptName?.trim() || input.conceptId;
  const patternBlock = pattern
    ? `Pattern (${pattern.id} — ${pattern.name}): ${pattern.move}`
    : null;
  const contentBlock = `Content grain (${input.conceptId}): ${content}.`;
  let explanation = input.explanation.trim();
  if (pattern && !explanation.includes(`Pattern (${pattern.id}`)) {
    explanation = `${patternBlock} ${contentBlock} ${explanation}`;
  } else if (!explanation.includes("Content grain (")) {
    explanation = `${contentBlock} ${explanation}`;
  }
  return {
    explanation,
    pattern: pattern
      ? { id: pattern.id, name: pattern.name, move: pattern.move }
      : null,
  };
}

export function contrastPatternId(patternId: string): string {
  const cur = patternById(patternId);
  const pool = PATTERNS.filter((p) => p.id !== patternId);
  const otherFamily = pool.filter((p) => p.family !== cur?.family);
  const pickFrom = otherFamily.length > 0 ? otherFamily : pool;
  return pickFrom[0]?.id ?? PATTERNS[0].id;
}

export function entryDifficultyMax(p: ExamPattern, index: number): number {
  return 0.22 + (index % 3) * 0.06;
}
