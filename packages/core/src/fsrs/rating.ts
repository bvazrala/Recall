import { Rating, type Grade } from "ts-fsrs";

export { Rating };
export type FsrsRating = Grade;

export type AnswerGrade = "correct" | "partial" | "wrong";
export type Confidence = 1 | 2 | 3;

// The mapping from the brief. FSRS only ever sees the rating, never the raw answer.
export function toRating(grade: AnswerGrade, confidence: Confidence): FsrsRating {
  if (grade === "wrong") return Rating.Again;
  if (grade === "partial") return Rating.Hard;
  if (confidence === 1) return Rating.Hard;
  if (confidence === 2) return Rating.Good;
  return Rating.Easy;
}
