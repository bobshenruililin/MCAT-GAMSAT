import { eq, isNull, like } from "drizzle-orm";
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
import { huntTopicIds, priorMissCount } from "./hunt";
import { isDemoConfig } from "./demoSeed";
import { maybeSyncScoreboard } from "./scoreboard";
import {
  assembleMasteryCheckSession,
  assemblePatternEntry,
  assemblePatternLadder,
  assembleSession,
  assembleSkillFocusSession,
  assembleStructureSession,
  pickContrastTopicId,
  DEFAULT_ASSEMBLE_CONFIG,
  STRUCTURE_CAP,
  type AssembleConfig,
  type AssemblerItem,
  type NewCandidate,
  type TaggedCandidate,
} from "./sessionAssembler";
import { matchesTrack, parseTrack, type SectionFamily } from "./sectionBudget";
import { isPatternTag, PATTERNS, patternById } from "@/patterns/catalog";
import {
  contrastPatternId,
  decorateExplanation,
  type PatternCard,
} from "@/patterns/explain";

export type SessionMode =
  | "daily"
  | "skill"
  | "mastery_check"
  | "pattern_entry"
  | "pattern_ladder"
  | "structure";

const SESSION_MODES: SessionMode[] = [
  "daily",
  "skill",
  "mastery_check",
  "pattern_entry",
  "pattern_ladder",
  "structure",
];

function parseSessionMode(mode: unknown): SessionMode {
  if (typeof mode === "string" && (SESSION_MODES as string[]).includes(mode)) {
    return mode as SessionMode;
  }
  return "daily";
}

function resolvePatternId(raw: unknown): string {
  if (typeof raw === "string" && patternById(raw)) return raw;
  return PATTERNS[0].id;
}

export type DailySessionConfig = SessionConfig & {
  reviewCap: number;
  newCap: number;
  maxNewPerTopic: number;
  itemIds: string[];
  interleave_exceptions: number;
  huntTopicIds: string[];
  track?: SectionFamily;
  mode?: SessionMode;
  skillTopicId?: string;
  contrastTopicId?: string;
  patternId?: string;
  contrastPatternId?: string;
};

export type DiagnosticSessionConfig = SessionConfig & {
  perCategory: number;
  cap: number;
  itemIds: string[];
  interleave_exceptions: number;
  track?: SectionFamily;
};

export type DailyCaps = Partial<AssembleConfig> & {
  track?: SectionFamily | string;
  mode?: SessionMode;
  skillTopicId?: string;
  patternId?: string;
};
export type DiagnosticCaps = Partial<{
  perCategory: number;
  cap: number;
  track: SectionFamily | string;
}>;

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

function demoSessionIds(db: AppDb): Set<string> {
  return new Set(
    db
      .select({ id: sessions.id, config: sessions.config })
      .from(sessions)
      .all()
      .filter((s) => isDemoConfig(s.config))
      .map((s) => s.id),
  );
}

export function priorMissesFromDb(
  db: AppDb,
  itemId: string,
  currentSessionId: string,
): number {
  const demoIds = demoSessionIds(db);
  const rows = db
    .select({
      itemId: attempts.itemId,
      sessionId: attempts.sessionId,
      correct: attempts.correct,
    })
    .from(attempts)
    .where(eq(attempts.itemId, itemId))
    .all();
  return priorMissCount(
    rows.map((r) => ({
      itemId: r.itemId,
      sessionId: r.sessionId,
      correct: r.correct,
      demo: demoIds.has(r.sessionId),
    })),
    itemId,
    currentSessionId,
  );
}

function recentlyAttemptedTopicIds(
  db: AppDb,
  track: SectionFamily | undefined,
  limit: number,
): string[] {
  const rows = db
    .select({
      conceptId: items.conceptId,
      createdAt: attempts.createdAt,
      examWeight: concepts.examWeight,
    })
    .from(attempts)
    .innerJoin(items, eq(items.id, attempts.itemId))
    .innerJoin(concepts, eq(concepts.id, items.conceptId))
    .all()
    .filter((r) => r.examWeight > 0 && matchesTrack(r.conceptId, track))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const out: string[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    if (seen.has(row.conceptId)) continue;
    seen.add(row.conceptId);
    out.push(row.conceptId);
    if (out.length >= limit) break;
  }
  return out;
}

function highestWeightTopicIds(
  candidates: NewCandidate[],
  due: AssemblerItem[],
  limit: number,
): string[] {
  const weights = new Map<string, number>();
  for (const d of due) {
    if (!weights.has(d.conceptId)) weights.set(d.conceptId, 0);
  }
  for (const c of candidates) {
    if (c.examWeight <= 0) continue;
    weights.set(c.conceptId, Math.max(weights.get(c.conceptId) ?? 0, c.examWeight));
  }
  return [...weights.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([id]) => id);
}

function extraScheduledItems(
  db: AppDb,
  seen: Set<string>,
  track: SectionFamily | undefined,
  applyTrack: boolean,
): AssemblerItem[] {
  return db
    .select({
      id: items.id,
      conceptId: items.conceptId,
      examWeight: concepts.examWeight,
      dueAt: fsrsState.dueAt,
    })
    .from(items)
    .innerJoin(concepts, eq(concepts.id, items.conceptId))
    .innerJoin(fsrsState, eq(fsrsState.itemId, items.id))
    .all()
    .filter(
      (row) =>
        !seen.has(row.id) &&
        row.examWeight > 0 &&
        (!applyTrack || matchesTrack(row.conceptId, track)),
    )
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt) || a.id.localeCompare(b.id))
    .map((row) => ({ id: row.id, conceptId: row.conceptId }));
}

function loadPatternPool(
  db: AppDb,
  track: SectionFamily | undefined,
  applyTrack: boolean,
): TaggedCandidate[] {
  return db
    .select({
      id: items.id,
      conceptId: items.conceptId,
      skillTag: items.skillTag,
      difficultyEst: items.difficultyEst,
      examWeight: concepts.examWeight,
    })
    .from(items)
    .innerJoin(concepts, eq(concepts.id, items.conceptId))
    .where(like(items.skillTag, "PAT.%"))
    .all()
    .filter(
      (row) =>
        row.examWeight > 0 && (!applyTrack || matchesTrack(row.conceptId, track)),
    )
    .map((row) => ({
      id: row.id,
      conceptId: row.conceptId,
      skillTag: row.skillTag,
      difficultyEst: row.difficultyEst,
      examWeight: row.examWeight,
    }));
}

function attachExplanation(
  db: AppDb,
  item: { explanation: string; skillTag: string | null; conceptId: string },
): { explanation: string; pattern: PatternCard | null } {
  const concept = db
    .select({ name: concepts.name })
    .from(concepts)
    .where(eq(concepts.id, item.conceptId))
    .get();
  return decorateExplanation({
    explanation: item.explanation,
    skillTag: item.skillTag,
    conceptId: item.conceptId,
    conceptName: concept?.name,
  });
}

export function createDailySession(
  db: AppDb,
  now: Date,
  caps: DailyCaps = {},
): { sessionId: string; config: DailySessionConfig } {
  const {
    track: trackRaw,
    mode,
    skillTopicId,
    patternId: patternIdRaw,
    ...assembleCaps
  } = caps;
  const track = parseTrack(trackRaw);
  const sessionMode = parseSessionMode(mode);
  if (sessionMode === "skill" && !skillTopicId) {
    throw new Error("skill session requires skillTopicId");
  }
  const ladderPatternId =
    sessionMode === "pattern_ladder" ? resolvePatternId(patternIdRaw) : undefined;
  const ladderContrastId = ladderPatternId
    ? contrastPatternId(ladderPatternId)
    : undefined;
  const applyTrack =
    sessionMode !== "skill" && sessionMode !== "pattern_ladder";
  const assembleConfig = { ...DEFAULT_ASSEMBLE_CONFIG, ...assembleCaps };
  const due = getDueItems(db, now, assembleConfig.reviewCap)
    .map((d) => ({
      id: d.itemId,
      conceptId: d.conceptId,
    }))
    .filter((d) => !applyTrack || matchesTrack(d.conceptId, track));

  const seen = new Set(due.map((d) => d.id));
  const newRows = db
    .select({
      id: items.id,
      conceptId: items.conceptId,
      examWeight: concepts.examWeight,
      difficultyEst: items.difficultyEst,
      fsrsItemId: fsrsState.itemId,
    })
    .from(items)
    .innerJoin(concepts, eq(concepts.id, items.conceptId))
    .leftJoin(fsrsState, eq(fsrsState.itemId, items.id))
    .where(isNull(fsrsState.itemId))
    .all()
    .filter(
      (row) =>
        !seen.has(row.id) && (!applyTrack || matchesTrack(row.conceptId, track)),
    );

  const mastery = masteryByNode(db, now);
  const huntIds = huntTopicsFromDb(db, now).filter(
    (id) => !applyTrack || matchesTrack(id, track),
  );
  const candidates: NewCandidate[] = newRows.map((row) => ({
    id: row.id,
    conceptId: row.conceptId,
    examWeight: row.examWeight,
    mastery: mastery[row.conceptId] ?? 0.3,
    difficultyEst: row.difficultyEst,
  }));
  const extraItems =
    sessionMode === "daily" ||
    sessionMode === "pattern_entry" ||
    sessionMode === "pattern_ladder"
      ? []
      : extraScheduledItems(db, seen, track, applyTrack);

  let assembled;
  let contrastTopicId: string | undefined;
  if (sessionMode === "pattern_entry") {
    assembled = assemblePatternEntry(loadPatternPool(db, track, applyTrack));
  } else if (sessionMode === "pattern_ladder" && ladderPatternId && ladderContrastId) {
    assembled = assemblePatternLadder(
      loadPatternPool(db, undefined, false),
      ladderPatternId,
      ladderContrastId,
    );
  } else if (sessionMode === "structure") {
    assembled = assembleStructureSession(
      due,
      candidates,
      extraItems,
      STRUCTURE_CAP,
    );
  } else if (sessionMode === "skill" && skillTopicId) {
    contrastTopicId = pickContrastTopicId(due, candidates, extraItems, skillTopicId);
    assembled = assembleSkillFocusSession(due, candidates, {
      skillTopicId,
      contrastTopicId,
      extraItems,
    });
  } else if (sessionMode === "mastery_check") {
    let topicIds = recentlyAttemptedTopicIds(db, track, 4);
    if (topicIds.length < 2) {
      topicIds = highestWeightTopicIds(candidates, due, 4);
    }
    assembled = assembleMasteryCheckSession(due, candidates, {
      topicIds,
      itemsPerTopic: 2,
      extraItems,
    });
  } else {
    assembled = assembleSession(due, candidates, {
      ...assembleConfig,
      huntTopicIds: huntIds,
    });
  }
  if (assembled.items.length === 0 && sessionMode !== "daily") {
    throw new Error(
      sessionMode === "skill"
        ? "no items available for that skill"
        : "no items available for this session",
    );
  }
  const config: DailySessionConfig = {
    reviewCap: assembleConfig.reviewCap,
    newCap: assembleConfig.newCap,
    maxNewPerTopic: assembleConfig.maxNewPerTopic,
    itemIds: assembled.items.map((i) => i.id),
    interleave_exceptions: assembled.interleaveExceptions,
    huntTopicIds: huntIds,
    mode: sessionMode,
    ...(track && applyTrack ? { track } : {}),
    ...(skillTopicId && sessionMode === "skill" ? { skillTopicId } : {}),
    ...(contrastTopicId ? { contrastTopicId } : {}),
    ...(ladderPatternId ? { patternId: ladderPatternId } : {}),
    ...(ladderContrastId ? { contrastPatternId: ladderContrastId } : {}),
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
  caps: DiagnosticCaps = {},
): { sessionId: string; config: DiagnosticSessionConfig } {
  const { track: trackRaw, ...diagCaps } = caps;
  const track = parseTrack(trackRaw);
  const assembleConfig = { ...DEFAULT_DIAGNOSTIC_CONFIG, ...diagCaps };
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
    if (!matchesTrack(row.conceptId, track)) continue;
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
    ...(track ? { track } : {}),
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
  priorMisses: number;
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
      skillTag: isPatternTag(item.skillTag) ? null : item.skillTag,
      passage,
      hunting: huntSet.has(item.conceptId),
      priorMisses: priorMissesFromDb(db, item.id, sessionId),
    },
  };
}

export type GradeResult = {
  correct: boolean;
  correctKey: string;
  explanation: string;
  distractorRationales: Record<string, string>;
  pattern: PatternCard | null;
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
  const decorated = attachExplanation(db, item);
  return {
    correct: item.correctKey === input.answeredKey,
    correctKey: item.correctKey,
    explanation: decorated.explanation,
    distractorRationales: item.distractorRationales,
    pattern: decorated.pattern,
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
  pattern: PatternCard | null;
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

  const decorated = attachExplanation(db, item);
  return {
    attemptId,
    correct,
    correctKey: item.correctKey,
    explanation: decorated.explanation,
    distractorRationales: item.distractorRationales,
    dueAt,
    fsrsState: fsrsName,
    pattern: decorated.pattern,
  };
}
