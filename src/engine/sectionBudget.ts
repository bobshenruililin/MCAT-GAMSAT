/** Per-question time budgets used for pacing insight. Not official ACER/AAMC scoring. */
export const MCAT_SCIENCE_BUDGET = 95;
export const MCAT_CARS_BUDGET = 102;
export const GAMSAT_S1_BUDGET = 97;
export const GAMSAT_S2_BUDGET = 90;
export const GAMSAT_S3_BUDGET = 120;

export type SectionFamily =
  | "MCAT CARS"
  | "MCAT B/B"
  | "MCAT C/P"
  | "MCAT P/S"
  | "GAMSAT S1"
  | "GAMSAT S2"
  | "GAMSAT S3"
  | "Other";

export const COVERAGE_TRACKS: SectionFamily[] = [
  "MCAT CARS",
  "MCAT B/B",
  "MCAT C/P",
  "MCAT P/S",
  "GAMSAT S1",
  "GAMSAT S2",
  "GAMSAT S3",
];

export function parseTrack(value: unknown): SectionFamily | undefined {
  if (typeof value !== "string" || value === "" || value === "all") return undefined;
  return (COVERAGE_TRACKS as string[]).includes(value)
    ? (value as SectionFamily)
    : undefined;
}

export function matchesTrack(conceptId: string, track?: SectionFamily): boolean {
  if (!track) return true;
  return sectionFamily(conceptId) === track;
}

export function sectionFamily(conceptId: string): SectionFamily {
  if (conceptId.startsWith("MCAT.CARS")) return "MCAT CARS";
  if (
    conceptId.startsWith("MCAT.FC1") ||
    conceptId.startsWith("MCAT.FC2") ||
    conceptId.startsWith("MCAT.FC3")
  ) {
    return "MCAT B/B";
  }
  if (conceptId.startsWith("MCAT.FC4") || conceptId.startsWith("MCAT.FC5")) {
    return "MCAT C/P";
  }
  if (conceptId.startsWith("MCAT.FC")) return "MCAT P/S";
  if (conceptId.startsWith("GAMSAT.S1")) return "GAMSAT S1";
  if (conceptId.startsWith("GAMSAT.S2")) return "GAMSAT S2";
  if (conceptId.startsWith("GAMSAT")) return "GAMSAT S3";
  return "Other";
}

export function sectionBudgetSeconds(conceptId: string): number {
  const family = sectionFamily(conceptId);
  if (family === "MCAT CARS") return MCAT_CARS_BUDGET;
  if (family === "GAMSAT S1") return GAMSAT_S1_BUDGET;
  if (family === "GAMSAT S2") return GAMSAT_S2_BUDGET;
  if (family === "GAMSAT S3") return GAMSAT_S3_BUDGET;
  if (family === "Other") return MCAT_SCIENCE_BUDGET;
  return MCAT_SCIENCE_BUDGET;
}
