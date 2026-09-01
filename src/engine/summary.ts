import { eq } from "drizzle-orm";
import type { AppDb } from "@/db/client";
import {
  attempts,
  concepts,
  items,
  sessions,
  ERROR_CLASSES,
  type ErrorClass,
} from "@/db/schema";
import { masteryByNode } from "./mastery";

export const MCAT_BUDGET_SECONDS = 95;

export type CalibrationRow = {
  confidence: number;
  correct: number;
  incorrect: number;
};

export type TopicBreakdown = {
  conceptId: string;
  name: string;
  correct: number;
  total: number;
};

export type WeakNode = {
  conceptId: string;
  name: string;
  mastery: number;
  examWeight: number;
  product: number;
};

export type SessionSummaryData = {
  sessionId: string;
  kind: string;
  total: number;
  correctCount: number;
  accuracy: number;
  meanSeconds: number;
  mcatBudgetSeconds: number;
  calibration: CalibrationRow[];
  missesByErrorClass: Record<ErrorClass, number>;
  perTopic: TopicBreakdown[];
  weakest: WeakNode[] | null;
};

export function getSessionSummary(
  db: AppDb,
  sessionId: string,
  now: Date,
): SessionSummaryData {
  const session = db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
  if (!session) throw new Error(`unknown session ${sessionId}`);

  const rows = db
    .select({
      correct: attempts.correct,
      confidence: attempts.confidence,
      seconds: attempts.seconds,
      errorClass: attempts.errorClass,
      conceptId: items.conceptId,
      conceptName: concepts.name,
    })
    .from(attempts)
    .innerJoin(items, eq(items.id, attempts.itemId))
    .innerJoin(concepts, eq(concepts.id, items.conceptId))
    .where(eq(attempts.sessionId, sessionId))
    .all();

  const total = rows.length;
  const correctCount = rows.filter((r) => r.correct).length;
  const meanSeconds =
    total === 0
      ? 0
      : rows.reduce((s, r) => s + r.seconds, 0) / total;

  const calibration: CalibrationRow[] = [1, 2, 3, 4, 5].map((confidence) => ({
    confidence,
    correct: rows.filter((r) => r.confidence === confidence && r.correct).length,
    incorrect: rows.filter((r) => r.confidence === confidence && !r.correct)
      .length,
  }));

  const missesByErrorClass = Object.fromEntries(
    ERROR_CLASSES.map((c) => [c, 0]),
  ) as Record<ErrorClass, number>;
  for (const row of rows) {
    if (!row.correct && row.errorClass) {
      missesByErrorClass[row.errorClass] += 1;
    }
  }

  const topicMap = new Map<string, TopicBreakdown>();
  for (const row of rows) {
    const existing = topicMap.get(row.conceptId) ?? {
      conceptId: row.conceptId,
      name: row.conceptName,
      correct: 0,
      total: 0,
    };
    existing.total += 1;
    if (row.correct) existing.correct += 1;
    topicMap.set(row.conceptId, existing);
  }
  const perTopic = [...topicMap.values()].sort((a, b) =>
    a.conceptId.localeCompare(b.conceptId),
  );

  let weakest: WeakNode[] | null = null;
  if (session.kind === "diagnostic") {
    const mastery = masteryByNode(db, now);
    const all = db.select().from(concepts).all();
    weakest = all
      .filter((n) => n.examWeight > 0)
      .map((n) => {
        const m = mastery[n.id] ?? 0.3;
        return {
          conceptId: n.id,
          name: n.name,
          mastery: m,
          examWeight: n.examWeight,
          product: m * n.examWeight,
        };
      })
      .sort((a, b) => {
        if (a.product !== b.product) return a.product - b.product;
        return a.conceptId.localeCompare(b.conceptId);
      })
      .slice(0, 10);
  }

  return {
    sessionId,
    kind: session.kind,
    total,
    correctCount,
    accuracy: total === 0 ? 0 : correctCount / total,
    meanSeconds,
    mcatBudgetSeconds: MCAT_BUDGET_SECONDS,
    calibration,
    missesByErrorClass,
    perTopic,
    weakest,
  };
}
