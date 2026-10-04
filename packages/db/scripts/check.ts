import { existsSync } from "node:fs";
import { eq } from "drizzle-orm";
import { cards, createDb, files, messages, passages, questions, quizSessions, reviews, students } from "../src";

if (existsSync(".env")) process.loadEnvFile(".env");
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is missing. Copy .env.example to .env and paste your Neon URL.");

const { db, pool } = createDb(url);
const phone = "+15550000000";
await db.delete(students).where(eq(students.phone, phone)); // clean up after any crashed run

// 1. One row in every table, linked the way the real app links them.
const now = new Date();
const [student] = await db.insert(students).values({ phone }).returning();
const studentId = student.id;
const [file] = await db.insert(files).values({ studentId, source: "imessage", mimeType: "image/heic" }).returning();
const [passage] = await db
  .insert(passages)
  .values({ studentId, fileId: file.id, page: 1, ordinal: 1, content: "Inserting into a binary heap takes O(log n) time.", method: "vision" })
  .returning();
const [card] = await db
  .insert(cards)
  .values({ studentId, label: "Binary heaps: insert", due: now, stability: 0, difficulty: 0, elapsed_days: 0, scheduled_days: 0, learning_steps: 0, reps: 0, lapses: 0, state: 0 })
  .returning();
const [question] = await db
  .insert(questions)
  .values({
    studentId, cardId: card.id, passageId: passage.id, quote: "takes O(log n) time", format: "mc",
    prompt: "How long does inserting into a binary heap take?", choices: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
    answer: { choice: "B" }, explanation: "Insert bubbles up at most the height of the tree.",
  })
  .returning();
const [session] = await db.insert(quizSessions).values({ studentId, kind: "first", pendingQuestionId: question.id }).returning();
await db.insert(reviews).values({
  studentId, cardId: card.id, questionId: question.id, sessionId: session.id, response: "B2",
  grade: "correct", confidence: 2, rating: 3, gradedBy: "code", fsrsLog: {}, reviewedAt: now,
});
await db.insert(messages).values({ studentId, direction: "in", providerMessageId: "check-msg-1", kind: "text", body: "B2" });
console.log("1. Every table accepts linked rows");

// 2. Photon can deliver the same text twice. The second insert must do nothing.
const repeat = await db
  .insert(messages)
  .values({ studentId, direction: "in", providerMessageId: "check-msg-1", kind: "text", body: "B2" })
  .onConflictDoNothing()
  .returning();
console.log(repeat.length === 0 ? "2. Duplicate delivery skipped" : "2. PROBLEM: duplicate was saved");

// 3. "DELETE MY DATA": deleting the student must delete everything that belongs to them.
await db.delete(students).where(eq(students.id, studentId));
const left =
  (await db.$count(files, eq(files.studentId, studentId))) +
  (await db.$count(passages, eq(passages.studentId, studentId))) +
  (await db.$count(cards, eq(cards.studentId, studentId))) +
  (await db.$count(questions, eq(questions.studentId, studentId))) +
  (await db.$count(quizSessions, eq(quizSessions.studentId, studentId))) +
  (await db.$count(reviews, eq(reviews.studentId, studentId))) +
  (await db.$count(messages, eq(messages.studentId, studentId)));
console.log(left === 0 ? "3. Deleting the student removed all their rows" : `3. PROBLEM: ${left} rows left behind`);

await pool.end();
