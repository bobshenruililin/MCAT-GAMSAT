import type { Exam, Level } from "@/db/schema";
import type { MasteryLevel } from "./masteryLevel";

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
  itemCount: number;
  masteryLevel: MasteryLevel;
};
