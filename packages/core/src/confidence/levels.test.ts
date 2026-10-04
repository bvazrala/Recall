import { describe, expect, it } from "vitest";
import { levelForScore, scoreForLevel, type ConfidenceLevel } from "./levels";

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
