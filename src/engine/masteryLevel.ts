/**
 * Khan-like skill levels on top of existing topic mastery.
 * Unseen stays 0 attempts. Mastered requires both high mastery and enough retrievals.
 * No energy points, avatars, or pre-reveal hints — those conflict with NORTH_STAR.
 */

export const MASTERY_LEVELS = [
  "unseen",
  "struggling",
  "familiar",
  "proficient",
  "mastered",
] as const;

export type MasteryLevel = (typeof MASTERY_LEVELS)[number];

export const LEVEL_ORDER: Record<MasteryLevel, number> = {
  unseen: 0,
  struggling: 1,
  familiar: 2,
  proficient: 3,
  mastered: 4,
};

export const LEVEL_LABELS: Record<MasteryLevel, string> = {
  unseen: "Unseen",
  struggling: "Struggling",
  familiar: "Familiar",
  proficient: "Proficient",
  mastered: "Mastered",
};

/** Mastery below this after at least one attempt is struggling. */
export const STRUGGLING_MAX = 0.45;
/** Familiar is [STRUGGLING_MAX, FAMILIAR_MAX). */
export const FAMILIAR_MAX = 0.62;
/** Proficient is [FAMILIAR_MAX, PROFICIENT_MAX). Mastered needs this and enough attempts. */
export const PROFICIENT_MAX = 0.8;
export const MASTERED_MIN_ATTEMPTS = 3;

export type MasteryLevelInput = {
  mastery: number;
  attempts: number;
};

export function masteryLevel(input: MasteryLevelInput): MasteryLevel {
  if (input.attempts <= 0) return "unseen";
  if (input.mastery < STRUGGLING_MAX) return "struggling";
  if (input.mastery < FAMILIAR_MAX) return "familiar";
  if (input.mastery < PROFICIENT_MAX) return "proficient";
  if (input.attempts >= MASTERED_MIN_ATTEMPTS) return "mastered";
  return "proficient";
}

export function leveledUp(before: MasteryLevel, after: MasteryLevel): boolean {
  return LEVEL_ORDER[after] > LEVEL_ORDER[before];
}

/**
 * Exam-weight-weighted course mastery. Unseen topics count as 0 so a fresh
 * bank reads 0%, not the 0.3 unseen prior.
 */
export function courseMasteryPercent(
  topics: { mastery: number; attempts: number; examWeight: number }[],
): number {
  const weighted = topics.filter((t) => t.examWeight > 0);
  const wsum = weighted.reduce((s, t) => s + t.examWeight, 0);
  if (wsum === 0) return 0;
  const acc = weighted.reduce((s, t) => {
    const m = t.attempts <= 0 ? 0 : t.mastery;
    return s + m * t.examWeight;
  }, 0);
  return acc / wsum;
}

/** Share of weighted topics at proficient or mastered. */
export function proficientPlusShare(
  topics: { mastery: number; attempts: number; examWeight: number }[],
): number {
  const weighted = topics.filter((t) => t.examWeight > 0);
  if (weighted.length === 0) return 0;
  const n = weighted.filter((t) => {
    const level = masteryLevel(t);
    return level === "proficient" || level === "mastered";
  }).length;
  return n / weighted.length;
}

export function formatPercent(n: number): string {
  return `${Math.round(n * 100)}%`;
}
