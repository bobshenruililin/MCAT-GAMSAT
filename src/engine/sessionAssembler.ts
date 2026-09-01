export type AssemblerItem = {
  id: string;
  conceptId: string;
};

export type NewCandidate = AssemblerItem & {
  mastery: number;
  examWeight: number;
};

export type AssembleConfig = {
  reviewCap: number;
  newCap: number;
  maxNewPerTopic: number;
};

export const DEFAULT_ASSEMBLE_CONFIG: AssembleConfig = {
  reviewCap: 50,
  newCap: 15,
  maxNewPerTopic: 3,
};

export type AssembleResult = {
  items: AssemblerItem[];
  interleaveExceptions: number;
};

function pickNewItems(
  candidates: NewCandidate[],
  newCap: number,
  maxNewPerTopic: number,
): AssemblerItem[] {
  const byTopic = new Map<string, NewCandidate[]>();
  for (const c of candidates) {
    if (c.examWeight <= 0) continue;
    const list = byTopic.get(c.conceptId) ?? [];
    list.push(c);
    byTopic.set(c.conceptId, list);
  }

  const rankedTopics = [...byTopic.entries()].sort((a, b) => {
    const pa = (1 - a[1][0].mastery) * a[1][0].examWeight;
    const pb = (1 - b[1][0].mastery) * b[1][0].examWeight;
    if (pb !== pa) return pb - pa;
    return a[0].localeCompare(b[0]);
  });

  const picked: AssemblerItem[] = [];
  for (const [, topicItems] of rankedTopics) {
    const sorted = [...topicItems].sort((x, y) => x.id.localeCompare(y.id));
    for (const item of sorted.slice(0, maxNewPerTopic)) {
      picked.push({ id: item.id, conceptId: item.conceptId });
      if (picked.length >= newCap) return picked;
    }
  }
  return picked;
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
 * Pure assembler. Due reviews are first-class (all taken up to reviewCap, in given order).
 * New items come from (1-mastery)*exam_weight topics, max 3 per topic.
 * Combined queue is interleaved so consecutive items avoid the same topic when possible.
 */
export function assembleSession(
  dueItems: AssemblerItem[],
  candidateNewItems: NewCandidate[],
  config: Partial<AssembleConfig> = {},
): AssembleResult {
  const { reviewCap, newCap, maxNewPerTopic } = {
    ...DEFAULT_ASSEMBLE_CONFIG,
    ...config,
  };
  const due = dueItems.slice(0, reviewCap);
  const news = pickNewItems(candidateNewItems, newCap, maxNewPerTopic);
  return interleaveItems([...due, ...news]);
}
