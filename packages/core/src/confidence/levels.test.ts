import { describe, expect, it } from "vitest";
import { levelForScore, scoreForLevel, type ConfidenceLevel } from "./levels";

describe("levelForScore", () => {
  it.each([
    [0, "red"],
    [19, "red"],
    [20, "orange"],
    [39, "orange"],
    [40, "yellow"],
    [59, "yellow"],
    [60, "green"],
    [79, "green"],
    [80, "star"],
    [100, "star"],
    [-10, "red"],
    [250, "star"],
  ] as [number, ConfidenceLevel][])("score %i is %s", (score, level) => {
    expect(levelForScore(score)).toBe(level);
  });
});

describe("scoreForLevel", () => {
  it.each([
    ["red", 9],
    ["orange", 29],
    ["yellow", 49],
    ["green", 69],
    ["star", 90],
  ] as [ConfidenceLevel, number][])("%s maps to %i and back", (level, score) => {
    expect(scoreForLevel(level)).toBe(score);
    expect(levelForScore(score)).toBe(level);
  });
});
