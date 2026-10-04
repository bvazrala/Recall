export const SUGGESTED_COUNT = 5;

export interface SuggestableTopic {
  confidenceScore: number;
  lastStudiedAt: Date | null;
  createdAt: Date;
}

// Lowest confidence first. Ties go to the topic studied longest ago (never studied first), then the oldest.
export function pickSuggested<T extends SuggestableTopic>(topics: T[], n: number = SUGGESTED_COUNT): T[] {
  return [...topics]
    .sort(
      (a, b) =>
        a.confidenceScore - b.confidenceScore ||
        (a.lastStudiedAt?.getTime() ?? -Infinity) - (b.lastStudiedAt?.getTime() ?? -Infinity) ||
        a.createdAt.getTime() - b.createdAt.getTime(),
    )
    .slice(0, n);
}
