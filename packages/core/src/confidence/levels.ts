import type { FsrsRating } from "../fsrs";

export const CONFIDENCE_LEVELS = ["red", "yellow", "green", "star"] as const;
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];

export const MIN_SCORE = 0;
export const MAX_SCORE = 100;

// Lowest score that counts as each level. Red starts at 0.
const LEVEL_FLOOR: Record<ConfidenceLevel, number> = { red: 0, yellow: 25, green: 50, star: 75 };

// How far one self-rated flashcard moves a topic's score. Tune these in one place.
const RATING_DELTA: Record<FsrsRating, number> = { 1: -5, 2: 5, 3: 12, 4: 20 };

function clamp(score: number): number {
  return Math.min(MAX_SCORE, Math.max(MIN_SCORE, Math.round(score)));
}

export function levelForScore(score: number): ConfidenceLevel {
  const s = clamp(score);
  if (s >= LEVEL_FLOOR.star) return "star";
  if (s >= LEVEL_FLOOR.green) return "green";
  if (s >= LEVEL_FLOOR.yellow) return "yellow";
  return "red";
}

// Midpoint of the level's band. Used when the student overrides a level by hand.
export function scoreForLevel(level: ConfidenceLevel): number {
  const i = CONFIDENCE_LEVELS.indexOf(level);
  const floor = LEVEL_FLOOR[level];
  const next = i + 1 < CONFIDENCE_LEVELS.length ? LEVEL_FLOOR[CONFIDENCE_LEVELS[i + 1]] : MAX_SCORE + 1;
  return Math.floor((floor + next - 1) / 2);
}

export function applyRating(score: number, rating: FsrsRating): number {
  return clamp(score + RATING_DELTA[rating]);
}
