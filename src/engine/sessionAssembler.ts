import { sectionFamily } from "./sectionBudget";

export type AssemblerItem = {
  id: string;
  conceptId: string;
};

export type NewCandidate = AssemblerItem & {
  mastery: number;
  examWeight: number;
  difficultyEst?: number;
};

export const ADAPTIVE_EASIER_BELOW = 0.5;

export type AssembleConfig = {
  reviewCap: number;
  newCap: number;
  maxNewPerTopic: number;
  huntTopicIds?: string[];
};

export const DEFAULT_ASSEMBLE_CONFIG: AssembleConfig = {
  reviewCap: 50,
  newCap: 15,
  maxNewPerTopic: 3,
  huntTopicIds: [],
};

export type AssembleResult = {
  items: AssemblerItem[];
  interleaveExceptions: number;
};

function pickNewItems(
  candidates: NewCandidate[],
  newCap: number,
  maxNewPerTopic: number,
  huntTopicIds: string[] = [],
): AssemblerItem[] {
  const hunt = new Set(huntTopicIds);
  const byTopic = new Map<string, NewCandidate[]>();
  for (const c of candidates) {
    if (c.examWeight <= 0) continue;
    const list = byTopic.get(c.conceptId) ?? [];
    list.push(c);
    byTopic.set(c.conceptId, list);
  }

  const rankedTopics = [...byTopic.entries()].sort((a, b) => {
    const ha = hunt.has(a[0]) ? 1 : 0;
    const hb = hunt.has(b[0]) ? 1 : 0;
    if (hb !== ha) return hb - ha;
    const pa = (1 - a[1][0].mastery) * a[1][0].examWeight;
    const pb = (1 - b[1][0].mastery) * b[1][0].examWeight;
    if (pb !== pa) return pb - pa;
    return a[0].localeCompare(b[0]);
  });

  const picked: AssemblerItem[] = [];
  for (const [, topicItems] of rankedTopics) {
    const sorted = sortNewForTopic(topicItems);
    for (const item of sorted.slice(0, maxNewPerTopic)) {
      picked.push({ id: item.id, conceptId: item.conceptId });
      if (picked.length >= newCap) return picked;
    }
  }
  return picked;
}

/** Low topic mastery → easier first. Otherwise stretch (harder first). Tie-break by id. */
export function sortNewForTopic(topicItems: NewCandidate[]): NewCandidate[] {
  const mastery = topicItems[0]?.mastery ?? 0.3;
  const easierFirst = mastery < ADAPTIVE_EASIER_BELOW;
  return [...topicItems].sort((x, y) => {
    const dx = x.difficultyEst ?? 0.5;
    const dy = y.difficultyEst ?? 0.5;
    if (dx !== dy) return easierFirst ? dx - dy : dy - dx;
    return x.id.localeCompare(y.id);
  });
}

export type SkillFocusConfig = {
  skillTopicId: string;
  contrastTopicId?: string;
  focusCap?: number;
  contrastCap?: number;
  extraItems?: AssemblerItem[];
};

export type MasteryCheckConfig = {
  topicIds: string[];
  itemsPerTopic?: number;
  maxTopics?: number;
  extraItems?: AssemblerItem[];
};

function takeFromTopic(
  dueItems: AssemblerItem[],
  candidateNewItems: NewCandidate[],
  extraItems: AssemblerItem[],
  topicId: string,
  cap: number,
): AssemblerItem[] {
  const fromDue = dueItems.filter((d) => d.conceptId === topicId);
  const fromNew = sortNewForTopic(
    candidateNewItems.filter((n) => n.conceptId === topicId && n.examWeight > 0),
  );
  const pickedIds = new Set([...fromDue, ...fromNew].map((i) => i.id));
  const fromExtra = extraItems.filter(
    (e) => e.conceptId === topicId && !pickedIds.has(e.id),
  );
  return [...fromDue, ...fromNew, ...fromExtra].slice(0, cap);
}

/** Contrast skill: prefer a different section family, then highest exam_weight. */
export function pickContrastTopicId(
  dueItems: AssemblerItem[],
  candidateNewItems: NewCandidate[],
  extraItems: AssemblerItem[],
  skillTopicId: string,
): string | undefined {
  const skillFamily = sectionFamily(skillTopicId);
  const topics = new Map<string, { examWeight: number; family: ReturnType<typeof sectionFamily> }>();
  function touch(conceptId: string, examWeight: number) {
    if (conceptId === skillTopicId) return;
    const prev = topics.get(conceptId);
    topics.set(conceptId, {
      examWeight: Math.max(prev?.examWeight ?? 0, examWeight),
      family: sectionFamily(conceptId),
    });
  }
  for (const d of dueItems) touch(d.conceptId, 0);
  for (const e of extraItems) touch(e.conceptId, 0);
  for (const n of candidateNewItems) {
    if (n.examWeight <= 0) continue;
    touch(n.conceptId, n.examWeight);
  }
  const ranked = [...topics.entries()].sort((a, b) => {
    const da = a[1].family === skillFamily ? 1 : 0;
    const db = b[1].family === skillFamily ? 1 : 0;
    if (da !== db) return da - db;
    if (b[1].examWeight !== a[1].examWeight) return b[1].examWeight - a[1].examWeight;
    return a[0].localeCompare(b[0]);
  });
  return ranked[0]?.[0];
}

/**
 * Skill-focus without a same-topic burst: ~focusCap from the skill, ~contrastCap
 * from a different topic, then the existing interleave pass.
 */
export function assembleSkillFocusSession(
  dueItems: AssemblerItem[],
  candidateNewItems: NewCandidate[],
  config: SkillFocusConfig,
): AssembleResult {
  const focusCap = config.focusCap ?? 4;
  const contrastCap = config.contrastCap ?? 4;
  const extraItems = config.extraItems ?? [];
  const contrastTopicId =
    config.contrastTopicId ??
    pickContrastTopicId(dueItems, candidateNewItems, extraItems, config.skillTopicId);
  const focus = takeFromTopic(
    dueItems,
    candidateNewItems,
    extraItems,
    config.skillTopicId,
    focusCap,
  );
  const contrast = contrastTopicId
    ? takeFromTopic(
        dueItems,
        candidateNewItems,
        extraItems,
        contrastTopicId,
        contrastCap,
      )
    : [];
  return interleaveItems([...focus, ...contrast]);
}

/** Mix recently attempted topics (default 2 items × 4 topics) and interleave. */
export function assembleMasteryCheckSession(
  dueItems: AssemblerItem[],
  candidateNewItems: NewCandidate[],
  config: MasteryCheckConfig,
): AssembleResult {
  const per = config.itemsPerTopic ?? 2;
  const maxTopics = config.maxTopics ?? 4;
  const extraItems = config.extraItems ?? [];
  const picked: AssemblerItem[] = [];
  for (const topicId of config.topicIds.slice(0, maxTopics)) {
    picked.push(
      ...takeFromTopic(
        dueItems,
        candidateNewItems,
        extraItems,
        topicId,
        per,
      ),
    );
  }
  return interleaveItems(picked);
}

export function interleaveItems(items: AssemblerItem[]): AssembleResult {
  const remaining = [...items];
  const out: AssemblerItem[] = [];
  let interleaveExceptions = 0;
  while (remaining.length > 0) {
    const lastTopic = out.length === 0 ? null : out[out.length - 1].conceptId;
    let idx = remaining.findIndex((item) => item.conceptId !== lastTopic);
    if (idx < 0) {
      idx = 0;
      interleaveExceptions += 1;
    }
    out.push(remaining.splice(idx, 1)[0]);
  }
  return { items: out, interleaveExceptions };
}

/**
 * Pure assembler. Due reviews are first-class (all taken up to reviewCap).
 * Hunt-topic dues keep their relative due order but are pulled ahead of other dues
 * so a trap that is already due is seen first. New items: hunt topics first, then
 * (1-mastery)*exam_weight, max 3 per topic. Combined queue is interleaved.
 */
export function assembleSession(
  dueItems: AssemblerItem[],
  candidateNewItems: NewCandidate[],
  config: Partial<AssembleConfig> = {},
): AssembleResult {
  const { reviewCap, newCap, maxNewPerTopic, huntTopicIds } = {
    ...DEFAULT_ASSEMBLE_CONFIG,
    ...config,
  };
  const hunt = new Set(huntTopicIds ?? []);
  const due = [...dueItems.slice(0, reviewCap)].sort((a, b) => {
    const ha = hunt.has(a.conceptId) ? 0 : 1;
    const hb = hunt.has(b.conceptId) ? 0 : 1;
    return ha - hb;
  });
  const news = pickNewItems(
    candidateNewItems,
    newCap,
    maxNewPerTopic,
    huntTopicIds ?? [],
  );
  return interleaveItems([...due, ...news]);
}
