import { eq } from "drizzle-orm";
import type { AppDb } from "@/db/client";
import {
  attempts,
  concepts,
  items,
  masteryPriors,
} from "@/db/schema";
import { toIso } from "./dates";
import { ewmaCorrectness } from "./mastery";
import {
  interleaveItems,
  type AssembleResult,
  type AssemblerItem,
} from "./sessionAssembler";

export type DiagnosticItem = {
  id: string;
  conceptId: string;
  categoryId: string;
};

export type AssembleDiagnosticConfig = {
  perCategory: number;
  cap: number;
};

export const DEFAULT_DIAGNOSTIC_CONFIG: AssembleDiagnosticConfig = {
  perCategory: 3,
  cap: 90,
};

export type TaxonomyNodeLite = {
  id: string;
  parentId: string | null;
  examWeight: number;
};

/**
 * Stratified diagnostic queue: up to `perCategory` items per content category,
 * zero-attempt categories first, hard cap, then interleave.
 */
export function assembleDiagnostic(
  candidates: DiagnosticItem[],
  categoryAttemptCounts: Record<string, number>,
  config: Partial<AssembleDiagnosticConfig> = {},
): AssembleResult {
  const { perCategory, cap } = { ...DEFAULT_DIAGNOSTIC_CONFIG, ...config };
  const byCat = new Map<string, DiagnosticItem[]>();
  for (const item of candidates) {
    const list = byCat.get(item.categoryId) ?? [];
    list.push(item);
    byCat.set(item.categoryId, list);
  }
  const categories = [...byCat.keys()].sort((a, b) => {
    const ca = categoryAttemptCounts[a] ?? 0;
    const cb = categoryAttemptCounts[b] ?? 0;
    if (ca !== cb) return ca - cb;
    return a.localeCompare(b);
  });
  const picked: AssemblerItem[] = [];
  for (const cat of categories) {
    const catItems = [...(byCat.get(cat) ?? [])].sort((x, y) =>
      x.id.localeCompare(y.id),
    );
    for (const item of catItems.slice(0, perCategory)) {
      picked.push({ id: item.id, conceptId: item.conceptId });
      if (picked.length >= cap) return interleaveItems(picked);
    }
  }
  return interleaveItems(picked);
}

/**
 * Priors for every node. Sampled topics keep their diagnostic EWMA.
 * Unsampled siblings inherit `0.5 * parentEst + 0.5 * 0.3`.
 */
export function diagnosticPriors(
  nodes: TaxonomyNodeLite[],
  sampledTopicEwma: Record<string, number>,
): Record<string, number> {
  const UNSEEN = 0.3;
  const children = new Map<string | null, TaxonomyNodeLite[]>();
  const byId = new Map<string, TaxonomyNodeLite>();
  for (const n of nodes) {
    byId.set(n.id, n);
    const list = children.get(n.parentId) ?? [];
    list.push(n);
    children.set(n.parentId, list);
  }
  const priors: Record<string, number> = { ...sampledTopicEwma };

  function weightedMean(ids: string[]): number {
    let acc = 0;
    let wsum = 0;
    for (const id of ids) {
      const w = byId.get(id)?.examWeight ?? 0;
      const v = priors[id];
      if (w > 0) {
        acc += v * w;
        wsum += w;
      }
    }
    if (wsum === 0) {
      return ids.reduce((s, id) => s + priors[id], 0) / ids.length;
    }
    return acc / wsum;
  }

  function fillDown(nodeId: string, parentEst: number): void {
    if (!(nodeId in priors)) {
      priors[nodeId] = 0.5 * parentEst + 0.5 * UNSEEN;
    }
    for (const kid of children.get(nodeId) ?? []) {
      fillDown(kid.id, priors[nodeId]);
    }
  }

  function fill(nodeId: string): void {
    const kids = children.get(nodeId) ?? [];
    for (const kid of kids) fill(kid.id);
    if (kids.length === 0) return;
    const known = kids.filter((k) => k.id in priors).map((k) => k.id);
    if (known.length === 0) return;
    const parentEst = weightedMean(known);
    for (const kid of kids) {
      if (!(kid.id in priors)) fillDown(kid.id, parentEst);
    }
    priors[nodeId] = weightedMean(kids.map((k) => k.id));
  }

  const roots = children.get(null) ?? [];
  for (const root of roots) fill(root.id);
  for (const root of roots) {
    if (!(root.id in priors)) fillDown(root.id, UNSEEN);
  }
  for (const n of nodes) {
    if (!(n.id in priors)) priors[n.id] = UNSEEN;
  }
  return priors;
}

export function writeDiagnosticPriors(
  db: AppDb,
  sessionId: string,
  now: Date,
): void {
  const nodes = db
    .select({
      id: concepts.id,
      parentId: concepts.parentId,
      examWeight: concepts.examWeight,
    })
    .from(concepts)
    .all();

  const sessionAttempts = db
    .select({
      itemId: attempts.itemId,
      correct: attempts.correct,
      createdAt: attempts.createdAt,
      conceptId: items.conceptId,
    })
    .from(attempts)
    .innerJoin(items, eq(items.id, attempts.itemId))
    .where(eq(attempts.sessionId, sessionId))
    .all()
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const byTopic = new Map<string, number[]>();
  for (const row of sessionAttempts) {
    const list = byTopic.get(row.conceptId) ?? [];
    list.push(row.correct ? 1 : 0);
    byTopic.set(row.conceptId, list);
  }
  const sampledTopicEwma: Record<string, number> = {};
  for (const [topicId, values] of byTopic) {
    sampledTopicEwma[topicId] = ewmaCorrectness(values);
  }

  const priors = diagnosticPriors(nodes, sampledTopicEwma);
  db.delete(masteryPriors).run();
  for (const node of nodes) {
    db.insert(masteryPriors)
      .values({
        conceptId: node.id,
        value: priors[node.id] ?? 0.3,
        source: "diagnostic",
        sessionId,
        updatedAt: toIso(now),
      })
      .run();
  }
}

