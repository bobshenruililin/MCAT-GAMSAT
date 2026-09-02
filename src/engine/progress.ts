import type { AppDb } from "@/db/client";
import { attempts, concepts, items } from "@/db/schema";
import { count, eq } from "drizzle-orm";
import { masteryByNode } from "./mastery";
import type { ProgressNode } from "./progressTypes";
import { COVERAGE_TRACKS, sectionFamily, type SectionFamily } from "./sectionBudget";
import {
  courseMasteryPercent,
  masteryLevel,
  proficientPlusShare,
} from "./masteryLevel";

export type { ProgressNode } from "./progressTypes";

export type TrackCoverage = {
  family: SectionFamily;
  topics: number;
  withItems: number;
  attempted: number;
};

export type ProgressData = {
  nodes: ProgressNode[];
  topics: ProgressNode[];
  coverage: TrackCoverage[];
  courseMastery: number;
  proficientPlusShare: number;
};

export function getProgressData(db: AppDb, now: Date): ProgressData {
  const mastery = masteryByNode(db, now);
  const all = db.select().from(concepts).all();
  const itemCountRows = db
    .select({ conceptId: items.conceptId, n: count() })
    .from(items)
    .groupBy(items.conceptId)
    .all();
  const itemsByTopic = new Map<string, number>();
  for (const row of itemCountRows) {
    itemsByTopic.set(row.conceptId, Number(row.n));
  }
  const attemptCountRows = db
    .select({ conceptId: items.conceptId, n: count() })
    .from(attempts)
    .innerJoin(items, eq(attempts.itemId, items.id))
    .groupBy(items.conceptId)
    .all();
  const topicAttempts = new Map<string, number>();
  for (const row of attemptCountRows) {
    topicAttempts.set(row.conceptId, Number(row.n));
  }

  const children = new Map<string | null, string[]>();
  for (const row of all) {
    const list = children.get(row.parentId) ?? [];
    list.push(row.id);
    children.set(row.parentId, list);
  }

  const unseenMemo = new Map<string, boolean>();
  function unseen(id: string): boolean {
    if (unseenMemo.has(id)) return unseenMemo.get(id)!;
    const kids = children.get(id) ?? [];
    const node = all.find((n) => n.id === id);
    let value: boolean;
    if (!node) value = true;
    else if (node.level === "topic") value = (topicAttempts.get(id) ?? 0) === 0;
    else if (kids.length === 0) value = true;
    else value = kids.every((k) => unseen(k));
    unseenMemo.set(id, value);
    return value;
  }

  const nodes: ProgressNode[] = all.map((row) => {
    const masteryValue = mastery[row.id] ?? 0.3;
    const attemptCount =
      row.level === "topic"
        ? (topicAttempts.get(row.id) ?? 0)
        : (children.get(row.id) ?? []).reduce((s, id) => {
            const child = all.find((n) => n.id === id);
            if (!child) return s;
            if (child.level === "topic") return s + (topicAttempts.get(id) ?? 0);
            return s;
          }, 0);
    return {
      id: row.id,
      parentId: row.parentId,
      exam: row.exam,
      level: row.level,
      name: row.name,
      examWeight: row.examWeight,
      mastery: masteryValue,
      attempts: attemptCount,
      unseen: unseen(row.id),
      itemCount: row.level === "topic" ? (itemsByTopic.get(row.id) ?? 0) : 0,
      masteryLevel: masteryLevel({ mastery: masteryValue, attempts: attemptCount }),
    };
  });

  // parent attempt counts: sum descendant topic attempts
  const byId = new Map(nodes.map((n) => [n.id, n]));
  function addAttempts(id: string): number {
    const node = byId.get(id);
    if (!node) return 0;
    if (node.level === "topic") return node.attempts;
    const kids = children.get(id) ?? [];
    const n = kids.reduce((s, k) => s + addAttempts(k), 0);
    node.attempts = n;
    node.masteryLevel = masteryLevel({ mastery: node.mastery, attempts: n });
    return n;
  }
  function addItems(id: string): number {
    const node = byId.get(id);
    if (!node) return 0;
    if (node.level === "topic") return node.itemCount;
    const kids = children.get(id) ?? [];
    const n = kids.reduce((s, k) => s + addItems(k), 0);
    node.itemCount = n;
    return n;
  }
  for (const n of nodes) {
    if (n.parentId === null) {
      addAttempts(n.id);
      addItems(n.id);
    }
  }

  const topics = nodes
    .filter((n) => n.level === "topic")
    .sort((a, b) => a.mastery - b.mastery || b.examWeight - a.examWeight);

  const coverage: TrackCoverage[] = COVERAGE_TRACKS.map((family) => {
    const track = topics.filter(
      (t) => sectionFamily(t.id) === family && t.examWeight > 0,
    );
    return {
      family,
      topics: track.length,
      withItems: track.filter((t) => (itemsByTopic.get(t.id) ?? 0) > 0).length,
      attempted: track.filter((t) => t.attempts > 0).length,
    };
  });

  return {
    nodes,
    topics,
    coverage,
    courseMastery: courseMasteryPercent(topics),
    proficientPlusShare: proficientPlusShare(topics),
  };
}
