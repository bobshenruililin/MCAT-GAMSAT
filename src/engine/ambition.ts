import { FACTORY_TARGET, FLOOR_PER_TOPIC, HAND_BANK, TARGET_MULTIPLIER } from "@/factory/types";
import { PATTERNS } from "@/patterns/catalog";
import { PATTERN_TARGET } from "@/patterns/generate";
import { COVERAGE_TRACKS } from "./sectionBudget";

/**
 * Designed capacity of the retrieval instrument. Live SQLite may be smaller
 * when FACTORY_TARGET / PATTERN_TARGET cap bootstrap. Screens and Health show
 * both numbers. Software still never sets verified=true.
 */
export const AMBITION = {
  factoryItems: FACTORY_TARGET,
  patternDrills: PATTERN_TARGET,
  handItems: HAND_BANK,
  totalDesignedItems: HAND_BANK + FACTORY_TARGET + PATTERN_TARGET,
  floorPerWeightedTopic: FLOOR_PER_TOPIC,
  factoryMultiplier: TARGET_MULTIPLIER,
  examFamilies: COVERAGE_TRACKS.length,
  patternMoves: PATTERNS.length,
  outlineLayers: ["family", "section", "category", "topic"] as const,
};

export function formatCount(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}
