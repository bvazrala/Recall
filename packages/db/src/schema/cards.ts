import { boolean, doublePrecision, index, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { passages } from "./notes";
import { students } from "./students";
import { topics } from "./topics";

// One FSRS item per thing to remember. Several question variants can share a card.
export const cards = pgTable(
  "cards",
  {
    id: uuid().primaryKey().defaultRandom(),
    studentId: uuid().notNull().references(() => students.id, { onDelete: "cascade" }),
    topicId: uuid().references(() => topics.id, { onDelete: "cascade" }), // null for cards outside the topic flow
    label: text().notNull(), // e.g. "Binary heaps: insert complexity"
    // FSRS state. These names match ts-fsrs's Card exactly, so a card from reviewCard() saves with a spread.
    due: timestamp({ withTimezone: true }).notNull(),
    stability: doublePrecision().notNull(),
    difficulty: doublePrecision().notNull(),
    elapsed_days: integer().notNull(),
    scheduled_days: integer().notNull(),
    learning_steps: integer().notNull(),
    reps: integer().notNull(),
    lapses: integer().notNull(),
    state: integer().notNull(), // 0 new, 1 learning, 2 review, 3 relearning
    last_review: timestamp({ withTimezone: true }),
    suspended: boolean().notNull().default(false),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index().on(t.studentId, t.due), // fast "what is due for this student?"
    index().on(t.topicId),
  ],
);

// A question variant. Note-based ones cite a passage and an exact quote from it; flashcards cite neither.
export const questions = pgTable("questions", {
  id: uuid().primaryKey().defaultRandom(),
  cardId: uuid().notNull().references(() => cards.id, { onDelete: "cascade" }),
  studentId: uuid().notNull().references(() => students.id, { onDelete: "cascade" }),
  passageId: uuid().references(() => passages.id, { onDelete: "cascade" }),
  quote: text(), // exact words from the passage; checked in code before use. Null for flashcards
  format: text({ enum: ["mc", "short", "trace", "math", "flashcard"] }).notNull(),
  prompt: text().notNull(),
  choices: jsonb().$type<string[]>(), // multiple choice only
  answer: jsonb().notNull(), // the correct answer; its shape depends on the format ({ text } for flashcards)
  explanation: text().notNull(),
  wrongReasons: jsonb().$type<Record<string, string>>(), // why each wrong choice is wrong
  status: text({ enum: ["active", "retired", "rejected"] }).notNull().default("active"),
  lastShownAt: timestamp({ withTimezone: true }),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export type CardRow = typeof cards.$inferSelect;
export type QuestionRow = typeof questions.$inferSelect;
