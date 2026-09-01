import { FACTORY_TARGET, FLOOR_PER_TOPIC, type TopicNode } from "./types";

/**
 * First principles: expected score ≈ Σ P(correct on exam grain i) × exam_weight(i).
 * Practice volume should follow exam_weight, with a floor so no node is a single
 * memorized card (FSRS needs distinct stems for transfer).
 */
export function allocateByWeight(
  topics: TopicNode[],
  total = FACTORY_TARGET,
  floor = FLOOR_PER_TOPIC,
): Map<string, number> {
  if (topics.length === 0) return new Map();
  const minFloor = Math.floor(total / topics.length);
  const usedFloor = Math.min(floor, minFloor);
  const out = new Map<string, number>();
  let remaining = total - usedFloor * topics.length;
  const weightSum = topics.reduce((s, t) => s + t.examWeight, 0);
  const raw: { id: string; frac: number; extra: number }[] = topics.map((t) => {
    const share = weightSum > 0 ? (t.examWeight / weightSum) * remaining : remaining / topics.length;
    const extra = Math.floor(share);
    return { id: t.id, frac: share - extra, extra };
  });
  const assigned = raw.reduce((s, r) => s + r.extra, 0);
  remaining -= assigned;
  raw.sort((a, b) => b.frac - a.frac || a.id.localeCompare(b.id));
  for (const row of raw) {
    let n = usedFloor + row.extra;
    if (remaining > 0) {
      n += 1;
      remaining -= 1;
    }
    out.set(row.id, n);
  }
  return out;
}

export function allocationSum(alloc: Map<string, number>): number {
  let n = 0;
  for (const v of alloc.values()) n += v;
  return n;
}
