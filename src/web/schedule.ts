import {
  createEmptyCard,
  fsrs,
  State,
  type Card,
} from "ts-fsrs";
import { ratingFromAttempt } from "@/engine/rating";
import type { CardRow, Ledger } from "./types";

const scheduler = fsrs({ enable_fuzz: false });

const STATE_TO_ROW: Record<State, CardRow["state"]> = {
  [State.New]: "new",
  [State.Learning]: "learning",
  [State.Review]: "review",
  [State.Relearning]: "relearning",
};

const ROW_TO_STATE: Record<CardRow["state"], State> = {
  new: State.New,
  learning: State.Learning,
  review: State.Review,
  relearning: State.Relearning,
};

function rowToCard(row: CardRow): Card {
  return {
    due: new Date(row.dueAt),
    stability: row.stability,
    difficulty: row.difficulty,
    elapsed_days: 0,
    scheduled_days: row.scheduledDays,
    learning_steps: row.learningSteps,
    reps: row.reps,
    lapses: row.lapses,
    state: ROW_TO_STATE[row.state],
    last_review: row.lastReviewAt ? new Date(row.lastReviewAt) : undefined,
  };
}

function cardToRow(card: Card): CardRow {
  return {
    dueAt: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    scheduledDays: card.scheduled_days,
    learningSteps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: STATE_TO_ROW[card.state],
    lastReviewAt: card.last_review ? card.last_review.toISOString() : null,
  };
}

export function isDue(row: CardRow, now: Date): boolean {
  return row.state !== "new" && new Date(row.dueAt).getTime() <= now.getTime();
}

export function scheduleAttempt(
  ledger: Ledger,
  itemId: string,
  conceptId: string,
  correct: boolean,
  confidence: number,
  now: Date,
): void {
  const existing = ledger.cards[itemId];
  const card = existing ? rowToCard(existing) : createEmptyCard(now);
  const rating = ratingFromAttempt(correct, confidence);
  const next = scheduler.next(card, now, rating);
  ledger.cards[itemId] = cardToRow(next.card);
  const prev = ledger.mastery[conceptId] ?? 0.3;
  ledger.mastery[conceptId] = 0.3 * (correct ? 1 : 0) + 0.7 * prev;
}
