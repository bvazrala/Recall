import { registerApiRoute } from "@mastra/core/server";
import { answerQuizBody } from "@recall/core";
import { and, cards, eq, questions, quizSessions, reviews } from "@recall/db";
import { getDb } from "../../db";
import { resolveStudent } from "../../lib/day";
import { guard, HttpError, idParam, parseBody } from "../../lib/http";
import { getOrCreateTodaysQuiz, findTodaysQuiz, quizView } from "../../lib/quiz";
import { applyReview } from "../../lib/review";

// Today's quiz, or { quiz: null } if it hasn't been written yet. Never calls the model.
export const getQuiz = registerApiRoute("/students/:studentId/quiz", {
  method: "GET",
  requiresAuth: false,
  handler: guard(async (c) => {
    const db = getDb();
    const quiz = await findTodaysQuiz(db, await resolveStudent(db, c.req.param("studentId")));
    return c.json({ quiz: quiz ? await quizView(db, quiz) : null });
  }),
});

// Today's quiz, written by Claude from today's flashcards on the first call. Later calls return the same quiz.
export const startQuiz = registerApiRoute("/students/:studentId/quiz", {
  method: "POST",
  requiresAuth: false,
  handler: guard(async (c) => {
    const db = getDb();
    const quiz = await getOrCreateTodaysQuiz(db, await resolveStudent(db, c.req.param("studentId")));
    return c.json({ quiz: await quizView(db, quiz) });
  }),
});

// Answer one question. Graded in code against the stored key, then recorded as a review of its flashcard.
export const answerQuiz = registerApiRoute("/quizzes/:quizId/answers", {
  method: "POST",
  requiresAuth: false,
  handler: guard(async (c) => {
    const db = getDb();
    const quizId = idParam(c, "quizId");
    const { questionId, choice } = await parseBody(c, answerQuizBody);

    const result = await db.transaction(async (tx) => {
      // Locking the quiz makes a double submit wait, then fail with 409.
      const [quiz] = await tx.select().from(quizSessions).where(eq(quizSessions.id, quizId)).for("update");
      if (!quiz) throw new HttpError(404, "Quiz not found");
      if (!quiz.queue.includes(questionId)) throw new HttpError(404, "That question is not part of this quiz");
      const already = await tx.query.reviews.findFirst({
        where: and(eq(reviews.sessionId, quizId), eq(reviews.questionId, questionId)),
      });
      if (already) throw new HttpError(409, "That question has already been answered");

      const question = await tx.query.questions.findFirst({ where: eq(questions.id, questionId) });
      const card = question && (await tx.query.cards.findFirst({ where: eq(cards.id, question.cardId) }));
      if (!question || !card?.topicId) throw new HttpError(404, "Question not found");

      const key = (question.answer as { choice: number }).choice;
      const correct = choice === key;
      const review = await applyReview(tx, {
        card: { ...card, topicId: card.topicId },
        questionId,
        rating: correct ? 3 : 1, // Good or Again
        response: question.choices?.[choice] ?? "",
        sessionId: quizId,
      });

      const answered = (await tx.select({ id: reviews.id }).from(reviews).where(eq(reviews.sessionId, quizId))).length;
      const done = answered >= quiz.queue.length;
      if (done) await tx.update(quizSessions).set({ status: "done" }).where(eq(quizSessions.id, quizId));
      return { correct, correctChoice: key, explanation: question.explanation, topic: review.topic, done };
    });
    return c.json(result);
  }),
});

export const quizRoutes = [getQuiz, startQuiz, answerQuiz];
