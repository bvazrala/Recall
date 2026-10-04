import { describe, expect, it } from "vitest";
import { cardFromRow, ratingToGrade } from "./card";
import { toRating } from "./rating";
import { newCard } from "./scheduler";

describe("cardFromRow", () => {
  it("round-trips a new card, turning null last_review into undefined", () => {
    const card = newCard(new Date("2026-10-03T22:00:00Z"));
    const row = { ...card, last_review: null };
    expect(cardFromRow(row)).toEqual({ ...card, last_review: undefined });
  });
});

describe("ratingToGrade", () => {
  it.each([1, 2, 3, 4] as const)("rating %i maps back to itself through toRating", (rating) => {
    const { grade, confidence } = ratingToGrade(rating);
    expect(toRating(grade, confidence)).toBe(rating);
  });
});
