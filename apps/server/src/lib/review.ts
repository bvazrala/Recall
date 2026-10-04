import { cardFromRow, levelForScore, nowFor, ratingToGrade, reviewCard, type FsrsRating } from "@recall/core";
import { and, cards, eq, reviews, studyDayTopics, topics, type CardRow } from "@recall/db";
import { latestConfidence, recordTopic } from "./confidence";
import { findCurrentDay, getStudent, type DbOrTx } from "./day";

export interface ReviewInput {
  card: CardRow & { topicId: string };
  questionId: string;
  rating: FsrsRating;
  response?: string; // what the student answered; empty for self-rated flashcards
  sessionId?: string; // the quiz this answer belongs to
}

// Records one review: moves the card's FSRS schedule and recomputes its topic's confidence for today.
// Shared by flashcard self-rating and quiz answers. Run it inside a transaction.
export async function applyReview(tx: DbOrTx, { card, questionId, rating, response = "", sessionId }: ReviewInput) {
  const student = await getStudent(tx, card.studentId);
  const now = nowFor(student.clockOffsetMs);

  // Students may study any topic. The review is tied to the open day only when the topic is one of its assigned topics.
  const day = await findCurrentDay(tx, student);
  const inDay =
    day?.status === "open" &&
    (await tx.query.studyDayTopics.findFirst({
      where: and(eq(studyDayTopics.studyDayId, day.id), eq(studyDayTopics.topicId, card.topicId)),
    }));

  // Lock the topic so two quick reviews don't compute its score from a stale set of cards.
  const [topic] = await tx.select().from(topics).where(eq(topics.id, card.topicId)).for("update");
  const before = await latestConfidence(tx, topic.id);

  const { card: next, log } = reviewCard(cardFromRow(card), rating, now);
  await tx.update(cards).set(next).where(eq(cards.id, card.id));

  const { grade, confidence } = ratingToGrade(rating);
  await tx.insert(reviews).values({
    studentId: student.id,
    cardId: card.id,
    questionId,
    sessionId,
    studyDayId: inDay && day ? day.id : null,
    response,
    grade,
    confidence,
    rating,
    gradedBy: "code",
    fsrsLog: log,
    reviewedAt: now,
  });

  await tx.update(topics).set({ lastStudiedAt: now }).where(eq(topics.id, topic.id));
  const score = await recordTopic(tx, student, topic.id, now);

  return {
    card: { id: card.id, due: next.due, state: next.state, reps: next.reps, lapses: next.lapses },
    topic: { id: topic.id, previousLevel: before.confidenceLevel, score, level: levelForScore(score) },
  };
}
