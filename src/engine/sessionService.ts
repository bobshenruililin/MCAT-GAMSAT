import { eq, isNull } from "drizzle-orm";
import type { AppDb } from "@/db/client";
import {
  attempts,
  concepts,
  items,
  fsrsState,
  sessions,
  type ErrorClass,
  type SessionConfig,
} from "@/db/schema";
import { toIso } from "./dates";
import { masteryByNode } from "./mastery";
import { ratingFromAttempt } from "./rating";
import { getDueItems, schedule } from "./reviewEngine";
import {
  assembleSession,
  DEFAULT_ASSEMBLE_CONFIG,
  type AssembleConfig,
} from "./sessionAssembler";

export type DailySessionConfig = SessionConfig & {
  reviewCap: number;
  newCap: number;
  maxNewPerTopic: number;
  itemIds: string[];
  interleave_exceptions: number;
};

export function createDailySession(
  db: AppDb,
  now: Date,
  caps: Partial<AssembleConfig> = {},
): { sessionId: string; config: DailySessionConfig } {
  const assembleConfig = { ...DEFAULT_ASSEMBLE_CONFIG, ...caps };
  const due = getDueItems(db, now, assembleConfig.reviewCap).map((d) => ({
    id: d.itemId,
    conceptId: d.conceptId,
  }));

  const seen = new Set(due.map((d) => d.id));
  const newRows = db
    .select({
      id: items.id,
      conceptId: items.conceptId,
      examWeight: concepts.examWeight,
      fsrsItemId: fsrsState.itemId,
    })
    .from(items)
    .innerJoin(concepts, eq(concepts.id, items.conceptId))
    .leftJoin(fsrsState, eq(fsrsState.itemId, items.id))
    .where(isNull(fsrsState.itemId))
    .all()
    .filter((row) => !seen.has(row.id));

  const mastery = masteryByNode(db, now);
  const candidates = newRows.map((row) => ({
    id: row.id,
    conceptId: row.conceptId,
    examWeight: row.examWeight,
    mastery: mastery[row.conceptId] ?? 0.3,
  }));

  const assembled = assembleSession(due, candidates, assembleConfig);
  const config: DailySessionConfig = {
    reviewCap: assembleConfig.reviewCap,
    newCap: assembleConfig.newCap,
    maxNewPerTopic: assembleConfig.maxNewPerTopic,
    itemIds: assembled.items.map((i) => i.id),
    interleave_exceptions: assembled.interleaveExceptions,
  };
  const sessionId = crypto.randomUUID();
  db.insert(sessions)
    .values({
      id: sessionId,
      kind: "daily",
      startedAt: toIso(now),
      endedAt: null,
      config,
    })
    .run();
  return { sessionId, config };
}

export type NextItemPublic = {
  id: string;
  type: string;
  stem: string;
  choices: { key: string; text: string }[];
  conceptId: string;
  skillTag: string | null;
};

export function nextUnanswered(
  db: AppDb,
  sessionId: string,
  now: Date,
): {
  done: boolean;
  position: number;
  remaining: number;
  item: NextItemPublic | null;
} {
  const session = db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
  if (!session) throw new Error(`unknown session ${sessionId}`);
  const config = session.config as DailySessionConfig;
  const itemIds = config.itemIds ?? [];
  const answered = new Set(
    db
      .select({ itemId: attempts.itemId })
      .from(attempts)
      .where(eq(attempts.sessionId, sessionId))
      .all()
      .map((a) => a.itemId),
  );
  const position = itemIds.findIndex((id) => !answered.has(id));
  if (position < 0) {
    if (!session.endedAt) {
      db.update(sessions)
        .set({ endedAt: toIso(now) })
        .where(eq(sessions.id, sessionId))
        .run();
    }
    return { done: true, position: itemIds.length, remaining: 0, item: null };
  }
  const itemId = itemIds[position];
  const item = db.select().from(items).where(eq(items.id, itemId)).get();
  if (!item) throw new Error(`queued item missing ${itemId}`);
  return {
    done: false,
    position,
    remaining: itemIds.length - position,
    item: {
      id: item.id,
      type: item.type,
      stem: item.stem,
      choices: item.choices,
      conceptId: item.conceptId,
      skillTag: item.skillTag,
    },
  };
}

export function recordAttempt(
  db: AppDb,
  input: {
    sessionId: string;
    itemId: string;
    answeredKey: string;
    confidence: number;
    seconds: number;
    errorClass: ErrorClass | null;
    now: Date;
  },
): {
  attemptId: string;
  correct: boolean;
  correctKey: string;
  explanation: string;
  distractorRationales: Record<string, string>;
  dueAt: string;
  fsrsState: string;
} {
  const session = db.select().from(sessions).where(eq(sessions.id, input.sessionId)).get();
  if (!session) throw new Error(`unknown session ${input.sessionId}`);
  const config = session.config as DailySessionConfig;
  const itemIds: string[] = config.itemIds ?? [];
  if (!itemIds.includes(input.itemId)) {
    throw new Error("item is not in this session");
  }

  const next = nextUnanswered(db, input.sessionId, input.now);
  if (next.done || next.item?.id !== input.itemId) {
    throw new Error("item is not the next unanswered item in this session");
  }

  const item = db.select().from(items).where(eq(items.id, input.itemId)).get();
  if (!item) throw new Error(`unknown item ${input.itemId}`);
  const correct = item.correctKey === input.answeredKey;

  if (input.confidence < 1 || input.confidence > 5) {
    throw new Error("confidence must be 1-5");
  }
  if (correct && input.errorClass !== null) {
    throw new Error("error_class must be null on a hit");
  }
  if (!correct && input.errorClass === null) {
    throw new Error("error_class required on a miss");
  }

  const attemptId = crypto.randomUUID();
  db.insert(attempts)
    .values({
      id: attemptId,
      itemId: input.itemId,
      sessionId: input.sessionId,
      answeredKey: input.answeredKey,
      correct,
      confidence: input.confidence,
      seconds: input.seconds,
      errorClass: input.errorClass,
      createdAt: toIso(input.now),
    })
    .run();

  const card = schedule(
    db,
    input.itemId,
    ratingFromAttempt(correct, input.confidence),
    input.now,
  );

  return {
    attemptId,
    correct,
    correctKey: item.correctKey,
    explanation: item.explanation,
    distractorRationales: item.distractorRationales,
    dueAt: toIso(card.due),
    fsrsState: ["new", "learning", "review", "relearning"][card.state] ?? "learning",
  };
}
