import type { ErrorClass } from "@/db/schema";

export function canSubmit(
  answeredKey: string | null,
  confidence: number | null,
): boolean {
  return (
    answeredKey !== null &&
    answeredKey.length > 0 &&
    confidence !== null &&
    Number.isInteger(confidence) &&
    confidence >= 1 &&
    confidence <= 5
  );
}

export function overconfidenceNote(
  correct: boolean,
  confidence: number,
): string | null {
  if (correct || confidence < 4) return null;
  return `You marked ${confidence}/5 and missed. Confidence and accuracy need to be the same number.`;
}

export function canProceedAfterReveal(opts: {
  revealed: boolean;
  correct: boolean | null;
  errorClass: ErrorClass | null;
}): boolean {
  if (!opts.revealed || opts.correct === null) return false;
  if (!opts.correct && opts.errorClass === null) return false;
  return true;
}
