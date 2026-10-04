import { boolean, doublePrecision, index, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { passages } from "./notes";
import { students } from "./students";

// One FSRS item per thing to remember. Several question variants can share a card.
export const cards = pgTable(
  "cards",
  {
    id: uuid().primaryKey().defaultRandom(),
    studentId: uuid().notNull().references(() => students.id, { onDelete: "cascade" }),
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
  (t) => [index().on(t.studentId, t.due)], // fast "what is due for this student?"
);

// A question variant. Every one cites a passage and an exact quote from it.
export const questions = pgTable("questions", {
  id: uuid().primaryKey().defaultRandom(),
  cardId: uuid().notNull().references(() => cards.id, { onDelete: "cascade" }),
  studentId: uuid().notNull().references(() => students.id, { onDelete: "cascade" }),
  passageId: uuid().notNull().references(() => passages.id, { onDelete: "cascade" }),
  quote: text().notNull(), // exact words from the passage; checked in code before use
  format: text({ enum: ["mc", "short", "trace", "math"] }).notNull(),
  prompt: text().notNull(),
  choices: jsonb().$type<string[]>(), // multiple choice only
  answer: jsonb().notNull(), // the correct answer; its shape depends on the format
  explanation: text().notNull(),
  wrongReasons: jsonb().$type<Record<string, string>>(), // why each wrong choice is wrong
  status: text({ enum: ["active", "retired", "rejected"] }).notNull().default("active"),
  lastShownAt: timestamp({ withTimezone: true }),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export type CardRow = typeof cards.$inferSelect;
export type QuestionRow = typeof questions.$inferSelect;
