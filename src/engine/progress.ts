import type { AppDb } from "@/db/client";
import { attempts, concepts, items } from "@/db/schema";
import { masteryByNode } from "./mastery";
import type { ProgressNode } from "./progressTypes";
import { COVERAGE_TRACKS, sectionFamily, type SectionFamily } from "./sectionBudget";

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
};

export function getProgressData(db: AppDb, now: Date): ProgressData {
  const mastery = masteryByNode(db, now);
  const all = db.select().from(concepts).all();
  const itemRows = db
    .select({ id: items.id, conceptId: items.conceptId })
    .from(items)
    .all();
  const itemsByTopic = new Map<string, string[]>();
  for (const row of itemRows) {
    const list = itemsByTopic.get(row.conceptId) ?? [];
    list.push(row.id);
    itemsByTopic.set(row.conceptId, list);
  }
  const attemptRows = db
    .select({ itemId: attempts.itemId })
    .from(attempts)
    .all();
  const attemptByItem = new Map<string, number>();
  for (const row of attemptRows) {
    attemptByItem.set(row.itemId, (attemptByItem.get(row.itemId) ?? 0) + 1);
  }

  const topicAttempts = new Map<string, number>();
  for (const [topicId, itemIds] of itemsByTopic) {
    let n = 0;
    for (const id of itemIds) n += attemptByItem.get(id) ?? 0;
    topicAttempts.set(topicId, n);
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

  const nodes: ProgressNode[] = all.map((row) => ({
    id: row.id,
    parentId: row.parentId,
    exam: row.exam,
    level: row.level,
    name: row.name,
    examWeight: row.examWeight,
    mastery: mastery[row.id] ?? 0.3,
    attempts:
      row.level === "topic"
        ? (topicAttempts.get(row.id) ?? 0)
        : (children.get(row.id) ?? []).reduce((s, id) => {
            const child = all.find((n) => n.id === id);
            if (!child) return s;
            if (child.level === "topic") return s + (topicAttempts.get(id) ?? 0);
            return s;
          }, 0),
    unseen: unseen(row.id),
  }));

  // parent attempt counts: sum descendant topic attempts
  const byId = new Map(nodes.map((n) => [n.id, n]));
  function addAttempts(id: string): number {
    const node = byId.get(id);
    if (!node) return 0;
    if (node.level === "topic") return node.attempts;
    const kids = children.get(id) ?? [];
    const n = kids.reduce((s, k) => s + addAttempts(k), 0);
    node.attempts = n;
    return n;
  }
  for (const n of nodes) {
    if (n.parentId === null) addAttempts(n.id);
  }

  const topics = nodes
    .filter((n) => n.level === "topic")
    .sort((a, b) => a.mastery - b.mastery || b.examWeight - a.examWeight);

  const coverage: TrackCoverage[] = COVERAGE_TRACKS.map((family) => {
    const track = topics.filter((t) => sectionFamily(t.id) === family);
    return {
      family,
      topics: track.length,
      withItems: track.filter((t) => (itemsByTopic.get(t.id)?.length ?? 0) > 0).length,
      attempted: track.filter((t) => t.attempts > 0).length,
    };
  });

  return { nodes, topics, coverage };
}
