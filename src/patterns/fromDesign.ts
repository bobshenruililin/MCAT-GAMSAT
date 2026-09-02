import type { SectionFamily } from "@/engine/sectionBudget";
import { sectionFamily } from "@/engine/sectionBudget";
import { PATTERNS } from "./catalog";

/** Default pattern tag for factory/hand items that have no explicit skill_tag. */
export function defaultPatternId(conceptId: string): string {
  if (conceptId.startsWith("MCAT.CARS.RBT")) return "PAT.CARS.weaken";
  if (conceptId.startsWith("MCAT.CARS.RWT")) return "PAT.CARS.analogy";
  if (conceptId.startsWith("MCAT.CARS")) return "PAT.CARS.main_point";
  if (conceptId.startsWith("MCAT.FC4.") || conceptId === "MCAT.FC4" || conceptId.startsWith("MCAT.FC5.") || conceptId === "MCAT.FC5") {
    return conceptId.includes(".4A") ? "PAT.CP.units" : "PAT.CP.setup_equation";
  }
  const fam: SectionFamily = sectionFamily(conceptId);
  if (fam === "MCAT B/B") return "PAT.BB.if_then";
  if (fam === "MCAT P/S") return "PAT.PS.confound";
  if (conceptId.startsWith("GAMSAT.S1.argument") || conceptId.startsWith("GAMSAT.S1.compare")) {
    return "PAT.S1.competing";
  }
  if (conceptId.startsWith("GAMSAT.S1.tone")) return "PAT.S1.tone";
  if (conceptId.startsWith("GAMSAT.S1")) return "PAT.S1.competing";
  if (conceptId.startsWith("GAMSAT.S2")) return "PAT.S2.throughline";
  if (conceptId.startsWith("GAMSAT.S3")) return "PAT.S3.table";
  const hit = PATTERNS.find((p) => p.family === fam);
  return hit?.id ?? "PAT.CP.setup_equation";
}
