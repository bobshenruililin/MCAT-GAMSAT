import { createHash } from "node:crypto";

/** Stable id so a rebuilt bank.json keeps FSRS cards on the same stems. */
export function webItemId(conceptId: string, stem: string): string {
  return createHash("sha256").update(`${conceptId}\n${stem}`).digest("hex").slice(0, 16);
}
