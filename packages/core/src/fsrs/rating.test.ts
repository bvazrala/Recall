import { describe, expect, it } from "vitest";
import { Rating, toRating, type AnswerGrade, type Confidence } from "./rating";

const cases: Array<[AnswerGrade, Confidence, Rating]> = [
  ["wrong", 1, Rating.Again],
  ["wrong", 3, Rating.Again],
  ["partial", 2, Rating.Hard],
  ["correct", 1, Rating.Hard],
  ["correct", 2, Rating.Good],
  ["correct", 3, Rating.Easy],
];

describe("toRating", () => {
  it.each(cases)("%s with confidence %i gives rating %i", (grade, confidence, expected) => {
    expect(toRating(grade, confidence)).toBe(expected);
  });
});
