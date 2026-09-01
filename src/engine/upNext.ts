import { masteryLevel, type MasteryLevel } from "./masteryLevel";

export type UpNextReason = "hunt" | "struggling" | "unseen" | "weakest";

export type UpNextTopicInput = {
  id: string;
  name: string;
  mastery: number;
  attempts: number;
  examWeight: number;
  itemCount: number;
};

export type UpNextSkill = {
  id: string;
  name: string;
  mastery: number;
  attempts: number;
  examWeight: number;
  level: MasteryLevel;
  reason: UpNextReason;
  reasonText: string;
};

function gap(t: UpNextTopicInput): number {
  return (1 - t.mastery) * t.examWeight;
}

function toSkill(
  t: UpNextTopicInput,
  reason: UpNextReason,
  reasonText: string,
): UpNextSkill {
  return {
    id: t.id,
    name: t.name,
    mastery: t.mastery,
    attempts: t.attempts,
    examWeight: t.examWeight,
    level: masteryLevel({ mastery: t.mastery, attempts: t.attempts }),
    reason,
    reasonText,
  };
}

/**
 * One recommended skill. Hunt first (error-driven), then struggling by
 * remaining exam-weight gap, then highest-weight unseen with items, else
 * largest remaining (1 − mastery) × weight.
 */
export function pickUpNext(
  topics: UpNextTopicInput[],
  huntTopicIds: string[],
): UpNextSkill | null {
  const eligible = topics.filter((t) => t.examWeight > 0 && t.itemCount > 0);
  if (eligible.length === 0) return null;
  const byId = new Map(eligible.map((t) => [t.id, t]));

  for (const hid of huntTopicIds) {
    const t = byId.get(hid);
    if (t) {
      return toSkill(
        t,
        "hunt",
        "A trap, content gap, or twice-missed item on this skill has not recovered.",
      );
    }
  }

  const struggling = eligible
    .filter(
      (t) =>
        t.attempts > 0 &&
        masteryLevel({ mastery: t.mastery, attempts: t.attempts }) === "struggling",
    )
    .sort((a, b) => {
      const g = gap(b) - gap(a);
      if (g !== 0) return g;
      return a.id.localeCompare(b.id);
    });
  if (struggling[0]) {
    return toSkill(
      struggling[0],
      "struggling",
      "Highest remaining exam-weight gap among skills still below familiar.",
    );
  }

  const unseen = eligible
    .filter((t) => t.attempts === 0)
    .sort((a, b) => {
      if (b.examWeight !== a.examWeight) return b.examWeight - a.examWeight;
      return a.id.localeCompare(b.id);
    });
  if (unseen[0]) {
    return toSkill(
      unseen[0],
      "unseen",
      "Highest-weight skill with items that has no attempts yet.",
    );
  }

  const weakest = [...eligible].sort((a, b) => {
    const g = gap(b) - gap(a);
    if (g !== 0) return g;
    return a.id.localeCompare(b.id);
  });
  if (!weakest[0]) return null;
  return toSkill(
    weakest[0],
    "weakest",
    "Largest remaining (1 − mastery) × exam weight.",
  );
}
