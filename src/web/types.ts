import type { ErrorClass, ItemType } from "@/db/schema";
import type { SectionFamily } from "@/engine/sectionBudget";

export type WebChoice = { key: string; text: string };

export type WebItem = {
  id: string;
  conceptId: string;
  family: SectionFamily;
  type: ItemType;
  stem: string;
  choices: WebChoice[];
  correctKey: string;
  explanation: string;
  distractorRationales: Record<string, string>;
  difficultyEst: number;
  examWeight: number;
  passage: { title: string; body: string } | null;
  verified: false;
};

export type WebBank = {
  version: 1;
  generatedAt: string;
  itemCount: number;
  items: WebItem[];
};

export type CardRow = {
  dueAt: string;
  stability: number;
  difficulty: number;
  scheduledDays: number;
  learningSteps: number;
  reps: number;
  lapses: number;
  state: "new" | "learning" | "review" | "relearning";
  lastReviewAt: string | null;
};

export type AttemptRow = {
  itemId: string;
  conceptId: string;
  correct: boolean;
  confidence: number;
  errorClass: ErrorClass | null;
  seconds: number;
  at: string;
};

export type OpenSitting = {
  id: string;
  track: SectionFamily | "mixed";
  itemIds: string[];
  cursor: number;
  startedAt: string;
};

export type Ledger = {
  version: 1;
  attempts: AttemptRow[];
  cards: Record<string, CardRow>;
  mastery: Record<string, number>;
  session: OpenSitting | null;
  lastSummary: {
    sittingId: string;
    correct: number;
    total: number;
    track: SectionFamily | "mixed";
    finishedAt: string;
  } | null;
};

export const LEDGER_KEY = "exam-morning-ledger-v1";
export const WEB_SIT = {
  reviewCap: 12,
  newCap: 12,
  maxNewPerTopic: 2,
} as const;
