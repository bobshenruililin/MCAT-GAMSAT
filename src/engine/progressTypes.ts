import type { Exam, Level } from "@/db/schema";

export type ProgressNode = {
  id: string;
  parentId: string | null;
  exam: Exam;
  level: Level;
  name: string;
  examWeight: number;
  mastery: number;
  attempts: number;
  unseen: boolean;
};
