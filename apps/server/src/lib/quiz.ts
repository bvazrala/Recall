import { and, asc, cards, eq, inArray, questions, quizSessions, reviews, topics, type QuizSessionRow, type Student } from "@recall/db";
import { quizWriter, writtenQuiz, type WrittenQuestion } from "../mastra/agents/quiz-writer";
import { dayTopics, findCurrentDay, type DbOrTx } from "./day";
import { HttpError } from "./http";

export const QUIZ_LENGTH = 10;

type McAnswer = { choice: number };

// Today's quiz for the student, or undefined if none has been written yet.
export async function findTodaysQuiz(db: DbOrTx, student: Student): Promise<QuizSessionRow | undefined> {
  const day = await findCurrentDay(db, student);
  if (!day) return undefined;
  return db.query.quizSessions.findFirst({
    where: and(eq(quizSessions.studyDayId, day.id), eq(quizSessions.kind, "daily")),
  });
}

// Writing takes several seconds. If the page asks twice (a refresh, a double click),
// the second request waits for the first instead of paying for a second quiz.
const inFlight = new Map<string, Promise<QuizSessionRow>>();

export async function getOrCreateTodaysQuiz(db: DbOrTx, student: Student): Promise<QuizSessionRow> {
  const existing = await findTodaysQuiz(db, student);
  if (existing) return existing;
  const day = await findCurrentDay(db, student);
  if (!day || day.status !== "open") throw new HttpError(409, "No open day. GET /students/:studentId/day to start one.");

  const pending = inFlight.get(day.id) ?? writeQuiz(db, student, day.id).finally(() => inFlight.delete(day.id));
  inFlight.set(day.id, pending);
  return pending;
}

// Up to QUIZ_LENGTH cards from today's topics, taken in turn so every topic is covered, earliest due first.
async function pickCards(db: DbOrTx, studyDayId: string) {
  const topicRows = await dayTopics(db, studyDayId);
  if (topicRows.length === 0) throw new HttpError(409, "Today has no topics to quiz on");
  const perTopic = await Promise.all(
    topicRows.map((t) =>
      db
        .select({ card: cards, question: questions })
        .from(cards)
        .innerJoin(questions, and(eq(questions.cardId, cards.id), eq(questions.format, "flashcard")))
        .where(and(eq(cards.topicId, t.topicId), eq(cards.suspended, false)))
        .orderBy(asc(cards.due), asc(cards.createdAt))
        .then((rows) => rows.map((r) => ({ ...r, topic: t.name }))),
    ),
  );
  const picked: (typeof perTopic)[number] = [];
  for (let round = 0; picked.length < QUIZ_LENGTH && perTopic.some((l) => l.length > round); round++) {
    for (const list of perTopic) if (list[round] && picked.length < QUIZ_LENGTH) picked.push(list[round]);
  }
  return picked;
}

// A wrong answer the model wrote is usable only if it isn't blank and doesn't repeat another option.
function usable(q: WrittenQuestion): boolean {
  const options = [q.correct, ...q.distractors].map((o) => o.trim().toLowerCase());
  return q.prompt.trim() !== "" && q.distractors.length === 3 && options.every((o) => o !== "") && new Set(options).size === 4;
}

// Spreads the correct answer across A-D. Derived from the card id, so it's stable and not chosen by the model.
function correctSlot(cardId: string): number {
  let h = 0;
  for (const ch of cardId) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % 4;
}

async function writeQuiz(db: DbOrTx, student: Student, studyDayId: string): Promise<QuizSessionRow> {
  const picked = await pickCards(db, studyDayId);
  const list = picked
    .map((p, i) => `${i + 1}. Topic: ${p.topic}\nQuestion: ${p.question.prompt}\nAnswer: ${(p.question.answer as { text: string }).text}`)
    .join("\n\n");

  let written: WrittenQuestion[];
  try {
    const result = await quizWriter.generate(`Write a multiple-choice question for each of these ${picked.length} flashcards.\n\n${list}`, {
      structuredOutput: { schema: writtenQuiz },
    });
    written = writtenQuiz.parse(result.object).questions;
    console.log(`Quiz written for student ${student.id}: ${result.usage?.inputTokens ?? "?"} in / ${result.usage?.outputTokens ?? "?"} out tokens`);
  } catch (e) {
    console.error("Quiz writer failed", e);
    throw new HttpError(502, "Couldn't write today's quiz. Check ANTHROPIC_API_KEY and try again.");
  }

  // Keep the first usable question for each card, in the order the cards were picked.
  const byCard = new Map<number, WrittenQuestion>();
  for (const q of written) if (!byCard.has(q.card) && usable(q)) byCard.set(q.card, q);
  const rows = picked.flatMap((p, i) => {
    const q = byCard.get(i + 1);
    if (!q) return [];
    const slot = correctSlot(p.card.id);
    const choices = [...q.distractors.map((d) => d.trim())];
    choices.splice(slot, 0, q.correct.trim());
    return [{
      cardId: p.card.id,
      studentId: student.id,
      format: "mc" as const,
      prompt: q.prompt.trim(),
      choices,
      answer: { choice: slot } satisfies McAnswer,
      explanation: q.explanation.trim(),
    }];
  });
  if (rows.length === 0) throw new HttpError(502, "Couldn't write today's quiz. Try again.");

  return db.transaction(async (tx) => {
    const inserted = await tx.insert(questions).values(rows).returning({ id: questions.id });
    const [quiz] = await tx
      .insert(quizSessions)
      .values({ studentId: student.id, kind: "daily", studyDayId, queue: inserted.map((q) => q.id) })
      .returning();
    return quiz;
  });
}

// The quiz as the web app sees it. Answered questions carry the result; unanswered ones hide the key.
export async function quizView(db: DbOrTx, quiz: QuizSessionRow) {
  const ids = quiz.queue;
  const qs = ids.length
    ? await db
        .select({ question: questions, topic: topics.name })
        .from(questions)
        .innerJoin(cards, eq(cards.id, questions.cardId))
        .innerJoin(topics, eq(topics.id, cards.topicId))
        .where(inArray(questions.id, ids))
    : [];
  const answered = await db.select().from(reviews).where(eq(reviews.sessionId, quiz.id));
  const reviewOf = new Map(answered.map((r) => [r.questionId, r]));
  const byId = new Map(qs.map((r) => [r.question.id, r]));

  const items = ids.flatMap((id) => {
    const row = byId.get(id);
    if (!row) return [];
    const q = row.question;
    const choices = q.choices ?? [];
    const review = reviewOf.get(id);
    const key = (q.answer as McAnswer).choice;
    return [{
      id,
      topic: row.topic,
      prompt: q.prompt,
      choices,
      result: review
        ? { chosen: choices.indexOf(review.response), correct: review.grade === "correct", correctChoice: key, explanation: q.explanation }
        : null,
    }];
  });
  return {
    id: quiz.id,
    status: quiz.status,
    topics: [...new Set(items.map((i) => i.topic))],
    questions: items,
    answeredCount: items.filter((i) => i.result).length,
    correctCount: items.filter((i) => i.result?.correct).length,
  };
}

export type QuizView = Awaited<ReturnType<typeof quizView>>;

const option = (q: QuizView["questions"][number], i: number) => `${"ABCD"[i]}) ${q.choices[i]}`;

// The text sent when a quiz is finished: the score, then each miss with both answers.
export function formatReview(view: QuizView): string {
  const total = view.questions.length;
  const missed = view.questions.map((q, i) => ({ q, n: i + 1 })).filter(({ q }) => q.result && !q.result.correct);
  if (missed.length === 0) return `Quiz done: ${view.correctCount}/${total}. Every question right!`;
  const lines = missed.map(({ q, n }) => {
    const r = q.result!;
    const yours = r.chosen >= 0 ? option(q, r.chosen) : "no answer";
    return `${n}. ${q.prompt}\n   You: ${yours}\n   Answer: ${option(q, r.correctChoice)}`;
  });
  return `Quiz done: ${view.correctCount}/${total}\nMissed:\n${lines.join("\n")}\n\nAsk me about any of them, like "why is ${missed[0].n} ${"ABCD"[missed[0].q.result!.correctChoice]}?"`;
}

// Today's quiz written out for the tutor: every question, and for answered ones the pick, the key and why.
export function quizForTutor(view: QuizView): string {
  return view.questions
    .map((q, i) => {
      const options = q.choices.map((_, c) => option(q, c)).join("\n");
      const r = q.result;
      const outcome = r
        ? `Student picked: ${r.chosen >= 0 ? "ABCD"[r.chosen] : "nothing"} (${r.correct ? "correct" : "wrong"}). Correct answer: ${"ABCD"[r.correctChoice]}. Explanation: ${r.explanation}`
        : "Not answered yet (don't reveal the answer).";
      return `Question ${i + 1} [${q.topic}]: ${q.prompt}\n${options}\n${outcome}`;
    })
    .join("\n\n");
}
