import { registerApiRoute } from "@mastra/core/server";
import { createFlashcardBody, newCard, nowFor, updateFlashcardBody } from "@recall/core";
import { and, asc, cards, eq, isNotNull, questions, topics } from "@recall/db";
import { getDb } from "../../db";
import { recordTopic } from "../../lib/confidence";
import { getStudent } from "../../lib/day";
import { guard, HttpError, idParam, parseBody } from "../../lib/http";

const LABEL_MAX = 80;
const label = (question: string) => (question.length > LABEL_MAX ? `${question.slice(0, LABEL_MAX - 1)}…` : question);

// A flashcard is a card (schedule) plus one question (front and back).
const flashcardColumns = {
  id: cards.id,
  topicId: cards.topicId,
  questionId: questions.id,
  question: questions.prompt,
  answer: questions.answer,
  due: cards.due,
  state: cards.state,
  reps: cards.reps,
  lapses: cards.lapses,
  createdAt: cards.createdAt,
};

type StoredAnswer = { text: string };
const shape = <T extends { answer: unknown }>(row: T) => ({ ...row, answer: (row.answer as StoredAnswer).text });

export const listFlashcards = registerApiRoute("/topics/:topicId/flashcards", {
  method: "GET",
  requiresAuth: false,
  handler: guard(async (c) => {
    const db = getDb();
    const topicId = idParam(c, "topicId");
    const topic = await db.query.topics.findFirst({ where: eq(topics.id, topicId) });
    if (!topic) throw new HttpError(404, "Topic not found");

    const rows = await db
      .select(flashcardColumns)
      .from(cards)
      .innerJoin(questions, eq(questions.cardId, cards.id))
      .where(eq(cards.topicId, topicId))
      .orderBy(asc(cards.createdAt));
    return c.json({ flashcards: rows.map(shape) });
  }),
});

export const createFlashcard = registerApiRoute("/topics/:topicId/flashcards", {
  method: "POST",
  requiresAuth: false,
  handler: guard(async (c) => {
    const db = getDb();
    const topicId = idParam(c, "topicId");
    const body = await parseBody(c, createFlashcardBody);
    const topic = await db.query.topics.findFirst({ where: eq(topics.id, topicId) });
    if (!topic) throw new HttpError(404, "Topic not found");
    const student = await getStudent(db, topic.studentId);

    const created = await db.transaction(async (tx) => {
      const [card] = await tx
        .insert(cards)
        .values({ ...newCard(nowFor(student.clockOffsetMs)), studentId: topic.studentId, topicId, label: label(body.question) })
        .returning();
      const [question] = await tx
        .insert(questions)
        .values({
          cardId: card.id,
          studentId: topic.studentId,
          format: "flashcard",
          prompt: body.question,
          answer: { text: body.answer } satisfies StoredAnswer,
          explanation: "",
        })
        .returning();
      await recordTopic(tx, student, topicId, nowFor(student.clockOffsetMs)); // a new card has recall 0, so the topic's score drops
      return { card, question };
    });
    return c.json(
      {
        flashcard: shape({
          id: created.card.id,
          topicId,
          questionId: created.question.id,
          question: created.question.prompt,
          answer: created.question.answer,
          due: created.card.due,
          state: created.card.state,
          reps: created.card.reps,
          lapses: created.card.lapses,
          createdAt: created.card.createdAt,
        }),
      },
      201,
    );
  }),
});

export const updateFlashcard = registerApiRoute("/flashcards/:cardId", {
  method: "PATCH",
  requiresAuth: false,
  handler: guard(async (c) => {
    const db = getDb();
    const cardId = idParam(c, "cardId");
    const body = await parseBody(c, updateFlashcardBody);

    await db.transaction(async (tx) => {
      const card = await tx.query.cards.findFirst({ where: eq(cards.id, cardId) });
      if (!card?.topicId) throw new HttpError(404, "Flashcard not found");
      if (body.question) {
        await tx.update(cards).set({ label: label(body.question) }).where(eq(cards.id, cardId));
        await tx.update(questions).set({ prompt: body.question }).where(eq(questions.cardId, cardId));
      }
      if (body.answer) {
        await tx.update(questions).set({ answer: { text: body.answer } satisfies StoredAnswer }).where(eq(questions.cardId, cardId));
      }
    });

    const [row] = await db
      .select(flashcardColumns)
      .from(cards)
      .innerJoin(questions, eq(questions.cardId, cards.id))
      .where(eq(cards.id, cardId));
    return c.json({ flashcard: shape(row) });
  }),
});

export const deleteFlashcard = registerApiRoute("/flashcards/:cardId", {
  method: "DELETE",
  requiresAuth: false,
  handler: guard(async (c) => {
    const cardId = idParam(c, "cardId");
    await getDb().transaction(async (tx) => {
      const [gone] = await tx
        .delete(cards)
        .where(and(eq(cards.id, cardId), isNotNull(cards.topicId)))
        .returning({ topicId: cards.topicId, studentId: cards.studentId });
      if (!gone) throw new HttpError(404, "Flashcard not found");
      const student = await getStudent(tx, gone.studentId);
      await recordTopic(tx, student, gone.topicId!, nowFor(student.clockOffsetMs));
    });
    return c.body(null, 204);
  }),
});

export const flashcardRoutes = [listFlashcards, createFlashcard, updateFlashcard, deleteFlashcard];
