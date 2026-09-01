import { asc, eq } from "drizzle-orm";
import type { AppDb } from "@/db/client";
import { attempts, concepts, items } from "@/db/schema";
import { getRetrievability } from "./reviewEngine";

const ALPHA = 0.3;
const UNSEEN = 0.3;

export type MasteryMap = Record<string, number>;

function ewmaCorrectness(values: number[]): number {
  let c = UNSEEN;
  for (const v of values) {
    c = ALPHA * v + (1 - ALPHA) * c;
  }
  return c;
}

function topicMastery(
  db: AppDb,
  conceptId: string,
  now: Date,
): number {
  const itemRows = db
    .select({ id: items.id })
    .from(items)
    .where(eq(items.conceptId, conceptId))
    .all();
  const itemIds = new Set(itemRows.map((r) => r.id));

  const attemptRows = db
    .select({
      itemId: attempts.itemId,
      correct: attempts.correct,
      createdAt: attempts.createdAt,
    })
    .from(attempts)
    .orderBy(asc(attempts.createdAt))
    .all()
    .filter((a) => itemIds.has(a.itemId));

  const correctness = attemptRows.map((a) => (a.correct ? 1 : 0));
  const C = ewmaCorrectness(correctness);

  const retrievabilities: number[] = [];
  for (const item of itemRows) {
    const r = getRetrievability(db, item.id, now);
    if (r !== null) retrievabilities.push(r);
  }
  const R =
    retrievabilities.length === 0
      ? UNSEEN
      : retrievabilities.reduce((s, n) => s + n, 0) / retrievabilities.length;

  if (attemptRows.length === 0 && retrievabilities.length === 0) return UNSEEN;
  return 0.6 * C + 0.4 * R;
}

function rollup(
  nodeId: string,
  childrenByParent: Map<string | null, { id: string; examWeight: number }[]>,
  topicScores: MasteryMap,
  memo: MasteryMap,
): number {
  if (nodeId in memo) return memo[nodeId];
  if (nodeId in topicScores) {
    memo[nodeId] = topicScores[nodeId];
    return topicScores[nodeId];
  }
  const kids = childrenByParent.get(nodeId) ?? [];
  if (kids.length === 0) {
    memo[nodeId] = UNSEEN;
    return UNSEEN;
  }
  let wsum = 0;
  let acc = 0;
  for (const kid of kids) {
    const m = rollup(kid.id, childrenByParent, topicScores, memo);
    const w = kid.examWeight;
    if (w > 0) {
      acc += m * w;
      wsum += w;
    }
  }
  if (wsum === 0) {
    const mean =
      kids.reduce((s, kid) => s + rollup(kid.id, childrenByParent, topicScores, memo), 0) /
      kids.length;
    memo[nodeId] = mean;
    return mean;
  }
  const value = acc / wsum;
  memo[nodeId] = value;
  return value;
}

/** Per-node mastery. Topics use MINI_SPEC; parents are exam_weight-weighted means of children. */
export function masteryByNode(db: AppDb, now: Date): MasteryMap {
  const all = db.select().from(concepts).all();
  const childrenByParent = new Map<string | null, { id: string; examWeight: number }[]>();
  for (const row of all) {
    const list = childrenByParent.get(row.parentId) ?? [];
    list.push({ id: row.id, examWeight: row.examWeight });
    childrenByParent.set(row.parentId, list);
  }

  const topicScores: MasteryMap = {};
  for (const row of all) {
    if (row.level === "topic") {
      topicScores[row.id] = topicMastery(db, row.id, now);
    }
  }

  const memo: MasteryMap = { ...topicScores };
  for (const row of all) {
    rollup(row.id, childrenByParent, topicScores, memo);
  }
  return memo;
}

export function masteryFor(db: AppDb, conceptId: string, now: Date): number {
  return masteryByNode(db, now)[conceptId] ?? UNSEEN;
}
