import type { ErrorClass, ItemType } from "@/db/schema";
import type { SectionFamily } from "@/engine/sectionBudget";

export type WebChoice = { key: string; text: string };

export type WebOrigin = "hand" | "peer" | "depth";

export type UiMode = "orbs" | "catalog" | "formats" | "ladders";

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
  skillTag: string | null;
  origin: WebOrigin;
};

export type WebCoverage = {
  weightedTopicCount: number;
  depthFloor: number;
  topicsAtOrAboveFloor: number;
  itemCount: number;
  byFamily: { family: string; items: number; topics: number }[];
  origin: Record<WebOrigin, number>;
  depthBuckets: { label: string; topics: number }[];
  landscape: { name: string; items: number }[];
};

export type WebBank = {
  version: 1;
  generatedAt: string;
  itemCount: number;
  items: WebItem[];
  coverage: WebCoverage;
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
export const MODE_KEY = "exam-morning-mode-v1";
export const WEB_SIT = {
  reviewCap: 12,
  newCap: 12,
  maxNewPerTopic: 2,
} as const;

export const UI_MODES: { id: UiMode; title: string; blurb: string }[] = [
  { id: "orbs", title: "Orbs", blurb: "Family path. Continue starts mixed retrieval." },
  { id: "catalog", title: "Catalog", blurb: "Counts per family. Pick a row to sit that exam slice." },
  { id: "formats", title: "Formats", blurb: "Discrete, passage, or S2 craft — still interleaved by topic." },
  { id: "ladders", title: "Ladders", blurb: "Prefer SIRS and teach-on-miss tags. Interleave still holds." },
];
