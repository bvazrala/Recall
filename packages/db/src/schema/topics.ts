import { boolean, index, integer, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { students } from "./students";

export const CONFIDENCE_LEVELS = ["red", "yellow", "green", "star"] as const;
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];

// Something the student is studying. Holds many flashcards (cards with a topicId).
export const topics = pgTable(
  "topics",
  {
    id: uuid().primaryKey().defaultRandom(),
    studentId: uuid().notNull().references(() => students.id, { onDelete: "cascade" }),
    name: text().notNull(),
    description: text(),
    confidenceScore: integer().notNull().default(0), // 0-100; flashcard ratings nudge it
    confidenceLevel: text({ enum: CONFIDENCE_LEVELS }).notNull().default("red"), // derived from the score, stored for cheap reads
    lastStudiedAt: timestamp({ withTimezone: true }), // student clock
    archived: boolean().notNull().default(false),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index().on(t.studentId, t.confidenceScore), // fast "lowest confidence first"
    unique().on(t.studentId, t.name),
  ],
);

export type TopicRow = typeof topics.$inferSelect;
