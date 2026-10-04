import { describe, expect, it } from "vitest";
import { Rating } from "../fsrs";
import { applyRating, levelForScore, scoreForLevel, type ConfidenceLevel } from "./levels";

describe("levelForScore", () => {
  it.each([
    [0, "red"],
    [24, "red"],
    [25, "yellow"],
    [49, "yellow"],
    [50, "green"],
    [74, "green"],
    [75, "star"],
    [100, "star"],
    [-10, "red"],
    [250, "star"],
  ] as [number, ConfidenceLevel][])("score %i is %s", (score, level) => {
    expect(levelForScore(score)).toBe(level);
  });
});

describe("scoreForLevel", () => {
  it.each([
    ["red", 12],
    ["yellow", 37],
    ["green", 62],
    ["star", 87],
  ] as [ConfidenceLevel, number][])("%s maps to %i and back", (level, score) => {
    expect(scoreForLevel(level)).toBe(score);
    expect(levelForScore(score)).toBe(level);
  });
});

describe("applyRating", () => {
  it("raises the score more for easier ratings", () => {
    expect(applyRating(40, Rating.Hard)).toBeLessThan(applyRating(40, Rating.Good));
    expect(applyRating(40, Rating.Good)).toBeLessThan(applyRating(40, Rating.Easy));
  });

  it("lowers the score on Again", () => {
    expect(applyRating(40, Rating.Again)).toBe(35);
  });

  it("clamps to 0-100", () => {
    expect(applyRating(2, Rating.Again)).toBe(0);
    expect(applyRating(95, Rating.Easy)).toBe(100);
  });
});
