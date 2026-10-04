import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { questions } from "./cards";
import { students } from "./students";

// Every text in and out. Doubles as the activity log and the duplicate-delivery guard.
export const messages = pgTable(
  "messages",
  {
    id: uuid().primaryKey().defaultRandom(),
    studentId: uuid().notNull().references(() => students.id, { onDelete: "cascade" }),
    direction: text({ enum: ["in", "out"] }).notNull(),
    providerMessageId: text().unique(), // Photon's id; a repeat delivery can't be inserted twice
    kind: text({ enum: ["text", "attachment", "reaction", "system"] }).notNull(),
    body: text(),
    questionId: uuid().references(() => questions.id, { onDelete: "set null" }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index().on(t.studentId, t.createdAt)],
);

export type MessageRow = typeof messages.$inferSelect;
