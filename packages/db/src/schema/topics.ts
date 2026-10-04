import { boolean, date, integer, pgTable, primaryKey, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { students } from "./students";

export const CONFIDENCE_LEVELS = ["red", "orange", "yellow", "green", "star"] as const;
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];

// Something the student is studying. Holds many flashcards (cards with a topicId).
export const topics = pgTable(
  "topics",
  {
    id: uuid().primaryKey().defaultRandom(),
    studentId: uuid().notNull().references(() => students.id, { onDelete: "cascade" }),
    name: text().notNull(),
    description: text(),
    lastStudiedAt: timestamp({ withTimezone: true }), // student clock
    archived: boolean().notNull().default(false),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.studentId, t.name)],
);

// A topic's confidence on one student-local calendar date: the stability-weighted recall chance of its cards.
// The only place confidence is stored. A topic's level is derived from the score in code (levelForScore).
// Written whenever the topic's cards change, and filled in lazily for days nothing happened (see lib/confidence.ts).
export const topicConfidenceDays = pgTable(
  "topic_confidence_days",
  {
    topicId: uuid().notNull().references(() => topics.id, { onDelete: "cascade" }),
    date: date({ mode: "string" }).notNull(), // YYYY-MM-DD in the student's time zone
    score: integer().notNull(), // 0-100
    overridden: boolean().notNull().default(false), // student set this by hand; kept until the topic's cards next change
  },
  (t) => [primaryKey({ columns: [t.topicId, t.date] })],
);

export type TopicRow = typeof topics.$inferSelect;
export type TopicConfidenceDayRow = typeof topicConfidenceDays.$inferSelect;
