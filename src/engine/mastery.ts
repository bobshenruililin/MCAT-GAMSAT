import { asc, eq } from "drizzle-orm";
import type { AppDb } from "@/db/client";
import { attempts, concepts, items, masteryPriors, fsrsState } from "@/db/schema";
import { retrievabilityFromRow } from "./reviewEngine";

const ALPHA = 0.3;
const UNSEEN = 0.3;

export type MasteryMap = Record<string, number>;

export function ewmaCorrectness(values: number[]): number {
  let c = UNSEEN;
  for (const v of values) {
    c = ALPHA * v + (1 - ALPHA) * c;
  }
  return c;
}

function topicMasteryFrom(
  correctness: number[],
  retrievabilities: number[],
  prior: number | undefined,
): number {
  const C = ewmaCorrectness(correctness);
  const R =
    retrievabilities.length === 0
      ? UNSEEN
      : retrievabilities.reduce((s, n) => s + n, 0) / retrievabilities.length;

  if (correctness.length === 0 && retrievabilities.length === 0) {
    return prior ?? UNSEEN;
  }
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

  const correctnessByTopic = new Map<string, number[]>();
  const attemptRows = db
    .select({
      conceptId: items.conceptId,
      correct: attempts.correct,
    })
    .from(attempts)
    .innerJoin(items, eq(attempts.itemId, items.id))
    .orderBy(asc(attempts.createdAt))
    .all();
  for (const row of attemptRows) {
    const list = correctnessByTopic.get(row.conceptId) ?? [];
    list.push(row.correct ? 1 : 0);
    correctnessByTopic.set(row.conceptId, list);
  }

  const retrievabilityByTopic = new Map<string, number[]>();
  const fsrsRows = db
    .select({
      conceptId: items.conceptId,
      stability: fsrsState.stability,
      difficulty: fsrsState.difficulty,
      dueAt: fsrsState.dueAt,
      lastReviewAt: fsrsState.lastReviewAt,
      reps: fsrsState.reps,
      lapses: fsrsState.lapses,
      state: fsrsState.state,
      scheduledDays: fsrsState.scheduledDays,
      learningSteps: fsrsState.learningSteps,
    })
    .from(fsrsState)
    .innerJoin(items, eq(items.id, fsrsState.itemId))
    .all();
  for (const row of fsrsRows) {
    const list = retrievabilityByTopic.get(row.conceptId) ?? [];
    list.push(retrievabilityFromRow(row, now));
    retrievabilityByTopic.set(row.conceptId, list);
  }

  const priorByTopic = new Map<string, number>();
  for (const row of db.select().from(masteryPriors).all()) {
    priorByTopic.set(row.conceptId, row.value);
  }

  const topicScores: MasteryMap = {};
  for (const row of all) {
    if (row.level !== "topic") continue;
    topicScores[row.id] = topicMasteryFrom(
      correctnessByTopic.get(row.id) ?? [],
      retrievabilityByTopic.get(row.id) ?? [],
      priorByTopic.get(row.id),
    );
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
