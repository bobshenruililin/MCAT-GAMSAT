import { Rating } from "ts-fsrs";
import { describe, expect, it } from "vitest";
import { ratingFromAttempt } from "./rating";

describe("ratingFromAttempt", () => {
  it("maps incorrect to Again regardless of confidence", () => {
    expect(ratingFromAttempt(false, 1)).toBe(Rating.Again);
    expect(ratingFromAttempt(false, 3)).toBe(Rating.Again);
    expect(ratingFromAttempt(false, 5)).toBe(Rating.Again);
  });

  it("maps correct confidence 1-2 to Hard, 3-4 to Good, 5 to Easy", () => {
    expect(ratingFromAttempt(true, 1)).toBe(Rating.Hard);
    expect(ratingFromAttempt(true, 2)).toBe(Rating.Hard);
    expect(ratingFromAttempt(true, 3)).toBe(Rating.Good);
    expect(ratingFromAttempt(true, 4)).toBe(Rating.Good);
    expect(ratingFromAttempt(true, 5)).toBe(Rating.Easy);
  });
});
