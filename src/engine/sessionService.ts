import { eq, isNull } from "drizzle-orm";
import type { AppDb } from "@/db/client";
import {
  attempts,
  concepts,
  items,
  passages,
  fsrsState,
  sessions,
  type ErrorClass,
  type SessionConfig,
} from "@/db/schema";
import {
  assembleDiagnostic,
  DEFAULT_DIAGNOSTIC_CONFIG,
  writeDiagnosticPriors,
} from "./diagnostic";
import { toIso } from "./dates";
import { masteryByNode } from "./mastery";
import { ratingFromAttempt } from "./rating";
import { getDueItems, schedule } from "./reviewEngine";
import { huntTopicIds } from "./hunt";
import { isDemoConfig } from "./demoSeed";
import { maybeSyncScoreboard } from "./scoreboard";
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
  huntTopicIds: string[];
};

export type DiagnosticSessionConfig = SessionConfig & {
  perCategory: number;
  cap: number;
  itemIds: string[];
  interleave_exceptions: number;
};

function queuedItemIds(config: SessionConfig): string[] {
  const ids = config.itemIds;
  return Array.isArray(ids)
    ? ids.filter((id): id is string => typeof id === "string")
    : [];
}

export function huntTopicsFromDb(db: AppDb, now: Date): string[] {
  const rows = db
    .select({
      itemId: attempts.itemId,
      conceptId: items.conceptId,
      correct: attempts.correct,
      errorClass: attempts.errorClass,
      createdAt: attempts.createdAt,
      sessionId: attempts.sessionId,
    })
    .from(attempts)
    .innerJoin(items, eq(items.id, attempts.itemId))
    .all();
  const sessionRows = db.select({ id: sessions.id, config: sessions.config }).from(sessions).all();
  const demoIds = new Set(
    sessionRows.filter((s) => isDemoConfig(s.config)).map((s) => s.id),
  );
  return huntTopicIds(
    rows.map((r) => ({
      itemId: r.itemId,
      conceptId: r.conceptId,
      correct: r.correct,
      errorClass: r.errorClass,
      createdAt: r.createdAt,
      demo: demoIds.has(r.sessionId),
    })),
    now,
  );
}

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
  const huntIds = huntTopicsFromDb(db, now);
  const candidates = newRows.map((row) => ({
    id: row.id,
    conceptId: row.conceptId,
    examWeight: row.examWeight,
    mastery: mastery[row.conceptId] ?? 0.3,
  }));

  const assembled = assembleSession(due, candidates, {
    ...assembleConfig,
    huntTopicIds: huntIds,
  });
  const config: DailySessionConfig = {
    reviewCap: assembleConfig.reviewCap,
    newCap: assembleConfig.newCap,
    maxNewPerTopic: assembleConfig.maxNewPerTopic,
    itemIds: assembled.items.map((i) => i.id),
    interleave_exceptions: assembled.interleaveExceptions,
    huntTopicIds: huntIds,
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

export function createDiagnosticSession(
  db: AppDb,
  now: Date,
  caps: Partial<{ perCategory: number; cap: number }> = {},
): { sessionId: string; config: DiagnosticSessionConfig } {
  const assembleConfig = { ...DEFAULT_DIAGNOSTIC_CONFIG, ...caps };
  const topicRows = db
    .select({
      id: items.id,
      conceptId: items.conceptId,
      parentId: concepts.parentId,
    })
    .from(items)
    .innerJoin(concepts, eq(concepts.id, items.conceptId))
    .all();
  const categories = db.select().from(concepts).all();
  const catById = new Map(categories.map((c) => [c.id, c]));

  const diagnosticItems = [];
  for (const row of topicRows) {
    const cat = row.parentId ? catById.get(row.parentId) : undefined;
    if (!cat || cat.level !== "category" || cat.examWeight <= 0) continue;
    diagnosticItems.push({
      id: row.id,
      conceptId: row.conceptId,
      categoryId: cat.id,
    });
  }

  const attemptRows = db
    .select({ conceptId: items.conceptId })
    .from(attempts)
    .innerJoin(items, eq(items.id, attempts.itemId))
    .all();
  const recount: Record<string, number> = {};
  for (const row of attemptRows) {
    const topic = catById.get(row.conceptId);
    const catId = topic?.parentId;
    if (!catId) continue;
    recount[catId] = (recount[catId] ?? 0) + 1;
  }

  const assembled = assembleDiagnostic(
    diagnosticItems,
    recount,
    assembleConfig,
  );
  const config: DiagnosticSessionConfig = {
    perCategory: assembleConfig.perCategory,
    cap: assembleConfig.cap,
    itemIds: assembled.items.map((i) => i.id),
    interleave_exceptions: assembled.interleaveExceptions,
  };
  const sessionId = crypto.randomUUID();
  db.insert(sessions)
    .values({
      id: sessionId,
      kind: "diagnostic",
      startedAt: toIso(now),
      endedAt: null,
      config,
    })
    .run();
  return { sessionId, config };
}

export type PassagePublic = {
  title: string;
  body: string;
};

export type NextItemPublic = {
  id: string;
  type: string;
  stem: string;
  choices: { key: string; text: string }[];
  conceptId: string;
  skillTag: string | null;
  passage: PassagePublic | null;
  hunting: boolean;
};

export function nextUnanswered(
  db: AppDb,
  sessionId: string,
  now: Date,
): {
  done: boolean;
  position: number;
  remaining: number;
  total: number;
  kind: string;
  item: NextItemPublic | null;
} {
  const session = db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
  if (!session) throw new Error(`unknown session ${sessionId}`);
  const itemIds = queuedItemIds(session.config);
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
      if (session.kind === "diagnostic") {
        writeDiagnosticPriors(db, sessionId, now);
      }
      if (session.kind === "daily" || session.kind === "diagnostic") {
        maybeSyncScoreboard(db, now);
      }
    }
    return {
      done: true,
      position: itemIds.length,
      remaining: 0,
      total: itemIds.length,
      kind: session.kind,
      item: null,
    };
  }
  const itemId = itemIds[position];
  const item = db.select().from(items).where(eq(items.id, itemId)).get();
  if (!item) throw new Error(`queued item missing ${itemId}`);
  let passage: PassagePublic | null = null;
  if (item.passageId) {
    const p = db.select().from(passages).where(eq(passages.id, item.passageId)).get();
    if (p) passage = { title: p.title, body: p.body };
  }
  const huntRaw = session.config.huntTopicIds;
  const huntSet = new Set(
    Array.isArray(huntRaw)
      ? huntRaw.filter((id): id is string => typeof id === "string")
      : [],
  );
  return {
    done: false,
    position,
    remaining: itemIds.length - position,
    total: itemIds.length,
    kind: session.kind,
    item: {
      id: item.id,
      type: item.type,
      stem: item.stem,
      choices: item.choices,
      conceptId: item.conceptId,
      skillTag: item.skillTag,
      passage,
      hunting: huntSet.has(item.conceptId),
    },
  };
}

export type GradeResult = {
  correct: boolean;
  correctKey: string;
  explanation: string;
  distractorRationales: Record<string, string>;
};

export function gradeItem(
  db: AppDb,
  input: {
    sessionId: string;
    itemId: string;
    answeredKey: string;
    confidence: number;
    now: Date;
  },
): GradeResult {
  if (input.confidence < 1 || input.confidence > 5) {
    throw new Error("confidence must be 1-5");
  }
  const next = nextUnanswered(db, input.sessionId, input.now);
  if (next.done || next.item?.id !== input.itemId) {
    throw new Error("item is not the next unanswered item in this session");
  }
  const item = db.select().from(items).where(eq(items.id, input.itemId)).get();
  if (!item) throw new Error(`unknown item ${input.itemId}`);
  const keys = item.choices.map((c) => c.key);
  if (!keys.includes(input.answeredKey)) {
    throw new Error("answeredKey is not a choice on this item");
  }
  return {
    correct: item.correctKey === input.answeredKey,
    correctKey: item.correctKey,
    explanation: item.explanation,
    distractorRationales: item.distractorRationales,
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
  dueAt: string | null;
  fsrsState: string | null;
} {
  const session = db.select().from(sessions).where(eq(sessions.id, input.sessionId)).get();
  if (!session) throw new Error(`unknown session ${input.sessionId}`);
  const itemIds = queuedItemIds(session.config);
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

  let dueAt: string | null = null;
  let fsrsName: string | null = null;
  if (session.kind !== "diagnostic") {
    const card = schedule(
      db,
      input.itemId,
      ratingFromAttempt(correct, input.confidence),
      input.now,
    );
    dueAt = toIso(card.due);
    fsrsName =
      ["new", "learning", "review", "relearning"][card.state] ?? "learning";
  }

  return {
    attemptId,
    correct,
    correctKey: item.correctKey,
    explanation: item.explanation,
    distractorRationales: item.distractorRationales,
    dueAt,
    fsrsState: fsrsName,
  };
}
