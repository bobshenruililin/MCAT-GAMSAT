import { and, asc, eq, lte, ne } from "drizzle-orm";
import {
  createEmptyCard,
  fsrs,
  State,
  type Card,
  type Grade,
} from "ts-fsrs";
import type { AppDb } from "@/db/client";
import { fsrsState, items } from "@/db/schema";
import type { FsrsCardState } from "@/db/schema";
import { fromIso, toIso } from "./dates";

const scheduler = fsrs({ enable_fuzz: false });

const STATE_TO_ROW: Record<State, FsrsCardState> = {
  [State.New]: "new",
  [State.Learning]: "learning",
  [State.Review]: "review",
  [State.Relearning]: "relearning",
};

const ROW_TO_STATE: Record<FsrsCardState, State> = {
  new: State.New,
  learning: State.Learning,
  review: State.Review,
  relearning: State.Relearning,
};

export type DueItem = {
  itemId: string;
  conceptId: string;
  dueAt: string;
};

function rowToCard(row: {
  stability: number;
  difficulty: number;
  dueAt: string;
  lastReviewAt: string | null;
  reps: number;
  lapses: number;
  state: FsrsCardState;
  scheduledDays: number;
  learningSteps: number;
}): Card {
  return {
    due: fromIso(row.dueAt),
    stability: row.stability,
    difficulty: row.difficulty,
    elapsed_days: 0,
    scheduled_days: row.scheduledDays,
    learning_steps: row.learningSteps,
    reps: row.reps,
    lapses: row.lapses,
    state: ROW_TO_STATE[row.state],
    last_review: row.lastReviewAt ? fromIso(row.lastReviewAt) : undefined,
  };
}

function persistCard(db: AppDb, itemId: string, card: Card): void {
  const values = {
    itemId,
    stability: card.stability,
    difficulty: card.difficulty,
    dueAt: toIso(card.due),
    lastReviewAt: card.last_review ? toIso(card.last_review) : null,
    reps: card.reps,
    lapses: card.lapses,
    state: STATE_TO_ROW[card.state],
    scheduledDays: card.scheduled_days,
    learningSteps: card.learning_steps,
  };
  const existing = db
    .select({ itemId: fsrsState.itemId })
    .from(fsrsState)
    .where(eq(fsrsState.itemId, itemId))
    .get();
  if (existing) {
    db.update(fsrsState).set(values).where(eq(fsrsState.itemId, itemId)).run();
  } else {
    db.insert(fsrsState).values(values).run();
  }
}

function loadCard(db: AppDb, itemId: string, now: Date): Card {
  const row = db.select().from(fsrsState).where(eq(fsrsState.itemId, itemId)).get();
  if (!row) return createEmptyCard(now);
  return rowToCard(row);
}

export function schedule(
  db: AppDb,
  itemId: string,
  rating: Grade,
  now: Date,
): Card {
  const item = db.select({ id: items.id }).from(items).where(eq(items.id, itemId)).get();
  if (!item) {
    throw new Error(`schedule: unknown item ${itemId}`);
  }
  const card = loadCard(db, itemId, now);
  const next = scheduler.next(card, now, rating);
  persistCard(db, itemId, next.card);
  return next.card;
}

export function getDueItems(db: AppDb, now: Date, limit: number): DueItem[] {
  return db
    .select({
      itemId: fsrsState.itemId,
      conceptId: items.conceptId,
      dueAt: fsrsState.dueAt,
    })
    .from(fsrsState)
    .innerJoin(items, eq(items.id, fsrsState.itemId))
    .where(
      and(lte(fsrsState.dueAt, toIso(now)), ne(fsrsState.state, "new")),
    )
    .orderBy(asc(fsrsState.dueAt))
    .limit(limit)
    .all();
}

export type FsrsRetrievabilityRow = {
  stability: number;
  difficulty: number;
  dueAt: string;
  lastReviewAt: string | null;
  reps: number;
  lapses: number;
  state: FsrsCardState;
  scheduledDays: number;
  learningSteps: number;
};

export function retrievabilityFromRow(
  row: FsrsRetrievabilityRow,
  now: Date,
): number {
  return scheduler.get_retrievability(rowToCard(row), now, false);
}

/** Retrievability from ts-fsrs. null if the item has no fsrs_state row. */
export function getRetrievability(
  db: AppDb,
  itemId: string,
  now: Date,
): number | null {
  const row = db.select().from(fsrsState).where(eq(fsrsState.itemId, itemId)).get();
  if (!row) return null;
  return retrievabilityFromRow(row, now);
}
