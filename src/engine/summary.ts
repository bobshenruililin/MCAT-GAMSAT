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
import {
  leveledUp,
  masteryLevel,
  LEVEL_LABELS,
  type MasteryLevel,
} from "./masteryLevel";
import {
  MCAT_SCIENCE_BUDGET,
  sectionBudgetSeconds,
  sectionFamily,
} from "./sectionBudget";

export const MCAT_BUDGET_SECONDS = MCAT_SCIENCE_BUDGET;

export function meanSessionBudgetSeconds(conceptIds: string[]): number {
  if (conceptIds.length === 0) return MCAT_SCIENCE_BUDGET;
  const sum = conceptIds.reduce((s, id) => s + sectionBudgetSeconds(id), 0);
  return sum / conceptIds.length;
}

export function sessionBudgetLabel(conceptIds: string[]): string {
  if (conceptIds.length === 0) return `${MCAT_SCIENCE_BUDGET}s MCAT science budget`;
  const families = new Set(conceptIds.map(sectionFamily));
  const seconds = Math.round(meanSessionBudgetSeconds(conceptIds));
  if (families.size === 1) {
    const family = [...families][0];
    return `${seconds}s ${family} budget`;
  }
  return `${seconds}s mixed-section budget`;
}

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
  mastery: number;
  attempts: number;
  level: MasteryLevel;
  previousLevel: MasteryLevel;
  levelLabel: string;
  previousLevelLabel: string;
  leveledUp: boolean;
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
  mode: string;
  total: number;
  correctCount: number;
  accuracy: number;
  meanSeconds: number;
  mcatBudgetSeconds: number;
  budgetLabel: string;
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

  const topicMap = new Map<string, TopicBreakdown & { sessionAttempts: number }>();
  for (const row of rows) {
    const existing = topicMap.get(row.conceptId) ?? {
      conceptId: row.conceptId,
      name: row.conceptName,
      correct: 0,
      total: 0,
      mastery: 0,
      attempts: 0,
      level: "unseen" as MasteryLevel,
      previousLevel: "unseen" as MasteryLevel,
      levelLabel: LEVEL_LABELS.unseen,
      previousLevelLabel: LEVEL_LABELS.unseen,
      leveledUp: false,
      sessionAttempts: 0,
    };
    existing.total += 1;
    existing.sessionAttempts += 1;
    if (row.correct) existing.correct += 1;
    topicMap.set(row.conceptId, existing);
  }

  const allAttemptRows = db
    .select({
      conceptId: items.conceptId,
      sessionId: attempts.sessionId,
    })
    .from(attempts)
    .innerJoin(items, eq(items.id, attempts.itemId))
    .all();
  const attemptsByTopic = new Map<string, number>();
  for (const row of allAttemptRows) {
    attemptsByTopic.set(row.conceptId, (attemptsByTopic.get(row.conceptId) ?? 0) + 1);
  }

  const mastery = masteryByNode(db, now);
  const perTopic = [...topicMap.values()]
    .map((row) => {
      const attemptsTotal = attemptsByTopic.get(row.conceptId) ?? row.sessionAttempts;
      const m = mastery[row.conceptId] ?? 0.3;
      const level = masteryLevel({ mastery: m, attempts: attemptsTotal });
      const attemptsBefore = Math.max(0, attemptsTotal - row.sessionAttempts);
      const previousLevel =
        attemptsBefore === 0
          ? ("unseen" as MasteryLevel)
          : masteryLevel({ mastery: m, attempts: attemptsBefore });
      return {
        conceptId: row.conceptId,
        name: row.name,
        correct: row.correct,
        total: row.total,
        mastery: m,
        attempts: attemptsTotal,
        level,
        previousLevel,
        levelLabel: LEVEL_LABELS[level],
        previousLevelLabel: LEVEL_LABELS[previousLevel],
        leveledUp: leveledUp(previousLevel, level),
      };
    })
    .sort((a, b) => a.conceptId.localeCompare(b.conceptId));

  let weakest: WeakNode[] | null = null;
  if (session.kind === "diagnostic") {
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

  const conceptIds = rows.map((r) => r.conceptId);
  const modeRaw = session.config.mode;
  const mode = typeof modeRaw === "string" ? modeRaw : session.kind;

  return {
    sessionId,
    kind: session.kind,
    mode,
    total,
    correctCount,
    accuracy: total === 0 ? 0 : correctCount / total,
    meanSeconds,
    mcatBudgetSeconds: meanSessionBudgetSeconds(conceptIds),
    budgetLabel: sessionBudgetLabel(conceptIds),
    calibration,
    missesByErrorClass,
    perTopic,
    weakest,
  };
}
