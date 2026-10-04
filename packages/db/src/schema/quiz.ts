import { index, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { cards, questions } from "./cards";
import { students } from "./students";

// A run of questions in the thread. Only one question is waiting for an answer at a time.
export const quizSessions = pgTable(
  "quiz_sessions",
  {
    id: uuid().primaryKey().defaultRandom(),
    studentId: uuid().notNull().references(() => students.id, { onDelete: "cascade" }),
    kind: text({ enum: ["first", "daily", "on_demand"] }).notNull(),
    queue: jsonb().$type<string[]>().notNull().default([]), // question ids still to ask
    pendingQuestionId: uuid().references(() => questions.id, { onDelete: "set null" }),
    pendingSentAt: timestamp({ withTimezone: true }),
    status: text({ enum: ["open", "done", "expired"] }).notNull().default("open"),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index().on(t.studentId, t.status)],
);

// One answered question. Powers the review log, the dashboard, and disputes.
export const reviews = pgTable(
  "reviews",
  {
    id: uuid().primaryKey().defaultRandom(),
    studentId: uuid().notNull().references(() => students.id, { onDelete: "cascade" }),
    cardId: uuid().notNull().references(() => cards.id, { onDelete: "cascade" }),
    questionId: uuid().notNull().references(() => questions.id, { onDelete: "cascade" }),
    sessionId: uuid().references(() => quizSessions.id, { onDelete: "set null" }),
    response: text().notNull(), // exactly what the student texted
    grade: text({ enum: ["correct", "partial", "wrong"] }).notNull(),
    confidence: integer().$type<1 | 2 | 3>().notNull(),
    rating: integer().$type<1 | 2 | 3 | 4>().notNull(), // FSRS: 1 Again, 2 Hard, 3 Good, 4 Easy
    gradedBy: text({ enum: ["code", "llm"] }).notNull(),
    fsrsLog: jsonb().notNull(), // ts-fsrs review log; disputes undo the review with it
    reviewedAt: timestamp({ withTimezone: true }).notNull(), // student clock (moves with fast-forward)
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(), // real clock
  },
  (t) => [index().on(t.studentId, t.reviewedAt)],
);

export type QuizSessionRow = typeof quizSessions.$inferSelect;
export type ReviewRow = typeof reviews.$inferSelect;
