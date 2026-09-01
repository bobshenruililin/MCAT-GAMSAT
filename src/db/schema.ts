import { sql } from "drizzle-orm";
import {
  type AnySQLiteColumn,
  check,
  index,
  integer,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const EXAMS = ["mcat", "gamsat"] as const;
export const LEVELS = ["section", "category", "topic"] as const;
export const ITEM_TYPES = ["discrete", "passage_question"] as const;
export const ITEM_SOURCES = ["ai_generated", "official_entry"] as const;
export const ERROR_CLASSES = [
  "content_gap",
  "reasoning",
  "misread",
  "timing",
  "trap",
  "other",
] as const;
export const FSRS_STATES = ["new", "learning", "review", "relearning"] as const;
export const SESSION_KINDS = ["daily", "diagnostic", "simulation"] as const;

export type Exam = (typeof EXAMS)[number];
export type Level = (typeof LEVELS)[number];
export type ItemType = (typeof ITEM_TYPES)[number];
export type ItemSource = (typeof ITEM_SOURCES)[number];
export type ErrorClass = (typeof ERROR_CLASSES)[number];
export type FsrsCardState = (typeof FSRS_STATES)[number];
export type SessionKind = (typeof SESSION_KINDS)[number];

export type Choice = { key: string; text: string };
export type DistractorRationales = Record<string, string>;
export type SessionConfig = Record<string, unknown>;

export const concepts = sqliteTable(
  "concepts",
  {
    id: text("id").primaryKey(),
    parentId: text("parent_id").references((): AnySQLiteColumn => concepts.id),
    exam: text("exam").notNull().$type<Exam>(),
    level: text("level").notNull().$type<Level>(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    examWeight: real("exam_weight").notNull(),
  },
  (t) => [
    index("concepts_parent_id_idx").on(t.parentId),
    index("concepts_exam_idx").on(t.exam),
    index("concepts_level_idx").on(t.level),
    check("concepts_exam_check", sql`${t.exam} IN ('mcat', 'gamsat')`),
    check(
      "concepts_level_check",
      sql`${t.level} IN ('section', 'category', 'topic')`,
    ),
    check(
      "concepts_weight_check",
      sql`${t.examWeight} >= 0 AND ${t.examWeight} <= 1`,
    ),
  ],
);

export const passages = sqliteTable(
  "passages",
  {
    id: text("id").primaryKey(),
    conceptId: text("concept_id")
      .notNull()
      .references(() => concepts.id),
    title: text("title").notNull(),
    body: text("body").notNull(),
    itemCount: integer("item_count").notNull(),
  },
  (t) => [index("passages_concept_id_idx").on(t.conceptId)],
);

export const items = sqliteTable(
  "items",
  {
    id: text("id").primaryKey(),
    type: text("type").notNull().$type<ItemType>(),
    passageId: text("passage_id").references(() => passages.id),
    conceptId: text("concept_id")
      .notNull()
      .references(() => concepts.id),
    skillTag: text("skill_tag"),
    stem: text("stem").notNull(),
    choices: text("choices", { mode: "json" }).notNull().$type<Choice[]>(),
    correctKey: text("correct_key").notNull(),
    explanation: text("explanation").notNull(),
    distractorRationales: text("distractor_rationales", { mode: "json" })
      .notNull()
      .$type<DistractorRationales>(),
    difficultyEst: real("difficulty_est").notNull(),
    source: text("source").notNull().$type<ItemSource>(),
    verified: integer("verified", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull(),
  },
  (t) => [
    index("items_concept_id_idx").on(t.conceptId),
    index("items_passage_id_idx").on(t.passageId),
    index("items_verified_idx").on(t.verified),
    check(
      "items_type_check",
      sql`${t.type} IN ('discrete', 'passage_question')`,
    ),
    check(
      "items_source_check",
      sql`${t.source} IN ('ai_generated', 'official_entry')`,
    ),
    check(
      "items_difficulty_check",
      sql`${t.difficultyEst} >= 0 AND ${t.difficultyEst} <= 1`,
    ),
    check(
      "items_passage_required_check",
      sql`${t.type} != 'passage_question' OR ${t.passageId} IS NOT NULL`,
    ),
  ],
);

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    kind: text("kind").notNull().$type<SessionKind>(),
    startedAt: text("started_at").notNull(),
    endedAt: text("ended_at"),
    config: text("config", { mode: "json" })
      .notNull()
      .$type<SessionConfig>()
      .default({}),
  },
  (t) => [
    index("sessions_started_at_idx").on(t.startedAt),
    check(
      "sessions_kind_check",
      sql`${t.kind} IN ('daily', 'diagnostic', 'simulation')`,
    ),
  ],
);

export const attempts = sqliteTable(
  "attempts",
  {
    id: text("id").primaryKey(),
    itemId: text("item_id")
      .notNull()
      .references(() => items.id),
    sessionId: text("session_id")
      .notNull()
      .references(() => sessions.id),
    answeredKey: text("answered_key").notNull(),
    correct: integer("correct", { mode: "boolean" }).notNull(),
    confidence: integer("confidence").notNull(),
    seconds: real("seconds").notNull(),
    errorClass: text("error_class").$type<ErrorClass>(),
    createdAt: text("created_at").notNull(),
  },
  (t) => [
    index("attempts_item_id_idx").on(t.itemId),
    index("attempts_session_id_idx").on(t.sessionId),
    index("attempts_created_at_idx").on(t.createdAt),
    check(
      "attempts_confidence_check",
      sql`${t.confidence} >= 1 AND ${t.confidence} <= 5`,
    ),
    check("attempts_seconds_check", sql`${t.seconds} >= 0`),
    check(
      "attempts_error_class_check",
      sql`${t.errorClass} IS NULL OR ${t.errorClass} IN ('content_gap', 'reasoning', 'misread', 'timing', 'trap', 'other')`,
    ),
    check(
      "attempts_error_class_required_check",
      sql`(${t.correct} = 1 AND ${t.errorClass} IS NULL) OR (${t.correct} = 0 AND ${t.errorClass} IS NOT NULL)`,
    ),
  ],
);

export const fsrsState = sqliteTable(
  "fsrs_state",
  {
    itemId: text("item_id")
      .primaryKey()
      .references(() => items.id),
    stability: real("stability").notNull(),
    difficulty: real("difficulty").notNull(),
    dueAt: text("due_at").notNull(),
    lastReviewAt: text("last_review_at"),
    reps: integer("reps").notNull(),
    lapses: integer("lapses").notNull(),
    state: text("state").notNull().$type<FsrsCardState>(),
  },
  (t) => [
    index("fsrs_state_due_at_idx").on(t.dueAt),
    check(
      "fsrs_state_state_check",
      sql`${t.state} IN ('new', 'learning', 'review', 'relearning')`,
    ),
    check("fsrs_state_reps_check", sql`${t.reps} >= 0`),
    check("fsrs_state_lapses_check", sql`${t.lapses} >= 0`),
  ],
);

export const externalScores = sqliteTable(
  "external_scores",
  {
    id: text("id").primaryKey(),
    exam: text("exam").notNull().$type<Exam>(),
    sourceName: text("source_name").notNull(),
    section: text("section").notNull(),
    score: real("score").notNull(),
    percentile: real("percentile"),
    takenAt: text("taken_at").notNull(),
    notes: text("notes"),
  },
  (t) => [
    index("external_scores_taken_at_idx").on(t.takenAt),
    index("external_scores_exam_idx").on(t.exam),
    check("external_scores_exam_check", sql`${t.exam} IN ('mcat', 'gamsat')`),
    check(
      "external_scores_percentile_check",
      sql`${t.percentile} IS NULL OR (${t.percentile} >= 0 AND ${t.percentile} <= 100)`,
    ),
  ],
);

export const schema = {
  concepts,
  passages,
  items,
  sessions,
  attempts,
  fsrsState,
  externalScores,
};
