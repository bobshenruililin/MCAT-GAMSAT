import { Rating, type Grade } from "ts-fsrs";

/** Map an attempt to an FSRS grade. Do not invent other mappings. */
export function ratingFromAttempt(correct: boolean, confidence: number): Grade {
  if (!correct) return Rating.Again;
  if (confidence <= 2) return Rating.Hard;
  if (confidence <= 4) return Rating.Good;
  return Rating.Easy;
}
