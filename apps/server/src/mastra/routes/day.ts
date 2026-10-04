import { registerApiRoute } from "@mastra/core/server";
import {
  applyRating,
  cardFromRow,
  closeDayBody,
  levelForScore,
  nowFor,
  ratingToGrade,
  reviewCard,
  reviewFlashcardBody,
  scoreForLevel,
} from "@recall/core";
import { and, asc, cards, eq, questions, reviews, students, studyDays, studyDayTopics, topics } from "@recall/db";
import { getDb } from "../../db";
import { dayTopics, findCurrentDay, getStudent, openCurrentDay } from "../../lib/day";
import { guard, HttpError, idParam, idQuery, parseBody } from "../../lib/http";

// Today's day for the student; the first call of a day picks and freezes the 5 suggested topics.
export const getDay = registerApiRoute("/students/:studentId/day", {
  method: "GET",
  requiresAuth: false,
  handler: guard(async (c) => {
    const db = getDb();
    const student = await getStudent(db, idParam(c, "studentId"));
    const day = await openCurrentDay(db, student, nowFor(student.clockOffsetMs));
    return c.json({
      day: { number: day.dayNumber, status: day.status, startedAt: day.startedAt },
      topics: await dayTopics(db, day.id),
    });
  }),
});

// Flashcards to work through for one of today's topics, earliest due first.
export const getDayFlashcards = registerApiRoute("/students/:studentId/day/flashcards", {
  method: "GET",
  requiresAuth: false,
  handler: guard(async (c) => {
    const db = getDb();
    const student = await getStudent(db, idParam(c, "studentId"));
    const topicId = idQuery(c, "topicId");
    const day = await findCurrentDay(db, student);
    if (!day) throw new HttpError(409, "No open day. GET /students/:studentId/day to start one.");

    const inDay = await db.query.studyDayTopics.findFirst({
      where: and(eq(studyDayTopics.studyDayId, day.id), eq(studyDayTopics.topicId, topicId)),
    });
    if (!inDay) throw new HttpError(404, "That topic is not part of today's day");

    const rows = await db
      .select({ id: cards.id, question: questions.prompt, answer: questions.answer, due: cards.due, reps: cards.reps, lapses: cards.lapses })
      .from(cards)
      .innerJoin(questions, eq(questions.cardId, cards.id))
      .where(and(eq(cards.topicId, topicId), eq(cards.suspended, false)))
      .orderBy(asc(cards.due), asc(cards.createdAt));
    return c.json({ flashcards: rows.map((r) => ({ ...r, answer: (r.answer as { text: string }).text })) });
  }),
});

// Self-rate one flashcard: updates the card's FSRS schedule and nudges its topic's confidence.
export const reviewFlashcard = registerApiRoute("/flashcards/:cardId/review", {
  method: "POST",
  requiresAuth: false,
  handler: guard(async (c) => {
    const db = getDb();
    const cardId = idParam(c, "cardId");
    const { rating } = await parseBody(c, reviewFlashcardBody);

    const result = await db.transaction(async (tx) => {
      const card = await tx.query.cards.findFirst({ where: eq(cards.id, cardId) });
      if (!card?.topicId) throw new HttpError(404, "Flashcard not found");
      const question = await tx.query.questions.findFirst({ where: eq(questions.cardId, cardId) });
      if (!question) throw new HttpError(404, "Flashcard not found");
      const student = await getStudent(tx, card.studentId);
      const now = nowFor(student.clockOffsetMs);

      const day = await findCurrentDay(tx, student);
      const inDay =
        day?.status === "open" &&
        (await tx.query.studyDayTopics.findFirst({
          where: and(eq(studyDayTopics.studyDayId, day.id), eq(studyDayTopics.topicId, card.topicId)),
        }));
      if (!day || !inDay) throw new HttpError(409, "This flashcard's topic is not part of the open day");

      // Lock the topic so two quick reviews don't overwrite each other's score.
      const [topic] = await tx.select().from(topics).where(eq(topics.id, card.topicId)).for("update");

      const { card: next, log } = reviewCard(cardFromRow(card), rating, now);
      await tx.update(cards).set(next).where(eq(cards.id, cardId));

      const { grade, confidence } = ratingToGrade(rating);
      await tx.insert(reviews).values({
        studentId: student.id,
        cardId,
        questionId: question.id,
        studyDayId: day.id,
        response: "",
        grade,
        confidence,
        rating,
        gradedBy: "code",
        fsrsLog: log,
        reviewedAt: now,
      });

      const score = applyRating(topic.confidenceScore, rating);
      const level = levelForScore(score);
      await tx.update(topics).set({ confidenceScore: score, confidenceLevel: level, lastStudiedAt: now }).where(eq(topics.id, topic.id));

      return {
        card: { id: cardId, due: next.due, state: next.state, reps: next.reps, lapses: next.lapses },
        topic: { id: topic.id, previousLevel: topic.confidenceLevel, score, level },
      };
    });
    return c.json(result);
  }),
});

// End the day: apply any manual confidence overrides, record before/after, start the next day.
export const closeDay = registerApiRoute("/students/:studentId/day/close", {
  method: "POST",
  requiresAuth: false,
  handler: guard(async (c) => {
    const db = getDb();
    const studentId = idParam(c, "studentId");
    const { overrides, dayNumber } = await parseBody(c, closeDayBody);

    const result = await db.transaction(async (tx) => {
      // Locking the student row makes a double close wait, then fail with 409.
      const [locked] = await tx.select().from(students).where(eq(students.id, studentId)).for("update");
      if (!locked) throw new HttpError(404, "Student not found");
      const now = nowFor(locked.clockOffsetMs);

      if (dayNumber !== undefined && dayNumber !== locked.currentDay) {
        throw new HttpError(409, `Day ${dayNumber} is not the current day (current day is ${locked.currentDay})`);
      }
      const day = await findCurrentDay(tx, locked);
      if (!day || day.status !== "open") throw new HttpError(409, "No open day to close");

      const rows = await dayTopics(tx, day.id);
      const wanted = new Map(overrides.map((o) => [o.topicId, o.level]));
      for (const id of wanted.keys()) {
        if (!rows.some((r) => r.topicId === id)) throw new HttpError(400, `Topic ${id} is not part of today's day`);
      }

      for (const row of rows) {
        const level = wanted.get(row.topicId);
        // Choosing the level a topic already has changes nothing, so keep its exact score.
        const overridden = level !== undefined && level !== row.levelNow;
        const score = overridden ? scoreForLevel(level) : row.scoreNow;
        const finalLevel = overridden ? level : row.levelNow;
        if (overridden) {
          await tx.update(topics).set({ confidenceScore: score, confidenceLevel: finalLevel }).where(eq(topics.id, row.topicId));
        }
        await tx
          .update(studyDayTopics)
          .set({ scoreAfter: score, levelAfter: finalLevel, overridden })
          .where(and(eq(studyDayTopics.studyDayId, day.id), eq(studyDayTopics.topicId, row.topicId)));
      }

      await tx.update(studyDays).set({ status: "closed", closedAt: now }).where(eq(studyDays.id, day.id));
      const [advanced] = await tx
        .update(students)
        .set({ currentDay: locked.currentDay + 1 })
        .where(eq(students.id, studentId))
        .returning();

      const nextDay = await openCurrentDay(tx, advanced, now);
      return {
        closed: { number: day.dayNumber, topics: await dayTopics(tx, day.id) },
        next: { number: nextDay.dayNumber, topics: await dayTopics(tx, nextDay.id) },
      };
    });
    return c.json(result);
  }),
});

export const dayRoutes = [getDay, getDayFlashcards, reviewFlashcard, closeDay];
