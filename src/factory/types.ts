import type { IngestChoice } from "@/ingest/validate";

export type FactoryItem = {
  concept_id: string;
  type: "discrete" | "passage_question";
  stem: string;
  choices: IngestChoice[];
  correct_key: "A" | "B" | "C" | "D";
  explanation: string;
  distractor_rationales: Record<string, string>;
  difficulty_est: number;
  skill_tag?: string;
  design: string;
};

export type FactoryPassage = {
  concept_id: string;
  title: string;
  body: string;
  questions: FactoryItem[];
  design: string;
};

export type FactoryBank = {
  items: FactoryItem[];
  passages: FactoryPassage[];
};

export type TopicNode = {
  id: string;
  parentId: string | null;
  name: string;
  description: string;
  examWeight: number;
  siblings: { id: string; name: string; description: string }[];
};

export const HAND_BANK = 847;
export const TARGET_MULTIPLIER = 500;
/** Additional ingest-valid items the factory must emit (500× the hand bank). */
export const FACTORY_TARGET = HAND_BANK * TARGET_MULTIPLIER;
export const FLOOR_PER_TOPIC = 200;
export const KEYS = ["A", "B", "C", "D"] as const;
export type Key = (typeof KEYS)[number];
