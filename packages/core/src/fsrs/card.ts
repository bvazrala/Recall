import type { State } from "ts-fsrs";
import type { AnswerGrade, Confidence, FsrsRating } from "./rating";
import type { Card } from "./scheduler";

// The FSRS columns of a cards row. Names match ts-fsrs's Card, so the only differences are null and the state type.
export interface FsrsCardRow {
  due: Date;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  learning_steps: number;
  reps: number;
  lapses: number;
  state: number;
  last_review: Date | null;
}

export function cardFromRow(row: FsrsCardRow): Card {
  return {
    due: row.due,
    stability: row.stability,
    difficulty: row.difficulty,
    elapsed_days: row.elapsed_days,
    scheduled_days: row.scheduled_days,
    learning_steps: row.learning_steps,
    reps: row.reps,
    lapses: row.lapses,
    state: row.state as State,
    last_review: row.last_review ?? undefined,
  };
}

// A self-rated flashcard has no graded answer, so derive the grade and confidence the reviews table wants from the rating.
export function ratingToGrade(rating: FsrsRating): { grade: AnswerGrade; confidence: Confidence } {
  if (rating === 1) return { grade: "wrong", confidence: 1 };
  if (rating === 2) return { grade: "partial", confidence: 1 };
  if (rating === 3) return { grade: "correct", confidence: 2 };
  return { grade: "correct", confidence: 3 };
}
