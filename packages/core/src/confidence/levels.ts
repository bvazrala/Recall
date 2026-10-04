export const CONFIDENCE_LEVELS = ["red", "orange", "yellow", "green", "star"] as const;
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];

export const MIN_SCORE = 0;
export const MAX_SCORE = 100;

// Five even bands, weakest to strongest. Lowest score that counts as each level. Red starts at 0.
const LEVEL_FLOOR: Record<ConfidenceLevel, number> = { red: 0, orange: 20, yellow: 40, green: 60, star: 80 };

function clamp(score: number): number {
  return Math.min(MAX_SCORE, Math.max(MIN_SCORE, Math.round(score)));
}

export function levelForScore(score: number): ConfidenceLevel {
  const s = clamp(score);
  if (s >= LEVEL_FLOOR.star) return "star";
  if (s >= LEVEL_FLOOR.green) return "green";
  if (s >= LEVEL_FLOOR.yellow) return "yellow";
  if (s >= LEVEL_FLOOR.orange) return "orange";
  return "red";
}

// Midpoint of the level's band. Used when the student overrides a level by hand.
export function scoreForLevel(level: ConfidenceLevel): number {
  const i = CONFIDENCE_LEVELS.indexOf(level);
  const floor = LEVEL_FLOOR[level];
  const next = i + 1 < CONFIDENCE_LEVELS.length ? LEVEL_FLOOR[CONFIDENCE_LEVELS[i + 1]] : MAX_SCORE + 1;
  return Math.floor((floor + next - 1) / 2);
}
