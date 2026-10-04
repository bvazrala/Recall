import { boolean, index, integer, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { students } from "./students";
import { CONFIDENCE_LEVELS, topics } from "./topics";

// One study day per student. The 5 suggested topics are frozen in studyDayTopics when it opens.
export const studyDays = pgTable(
  "study_days",
  {
    id: uuid().primaryKey().defaultRandom(),
    studentId: uuid().notNull().references(() => students.id, { onDelete: "cascade" }),
    dayNumber: integer().notNull(),
    status: text({ enum: ["open", "closed"] }).notNull().default("open"),
    startedAt: timestamp({ withTimezone: true }).notNull(), // student clock
    closedAt: timestamp({ withTimezone: true }), // student clock
  },
  (t) => [unique().on(t.studentId, t.dayNumber)],
);

// A topic suggested for a day, with its confidence before and after.
export const studyDayTopics = pgTable(
  "study_day_topics",
  {
    id: uuid().primaryKey().defaultRandom(),
    studyDayId: uuid().notNull().references(() => studyDays.id, { onDelete: "cascade" }),
    topicId: uuid().notNull().references(() => topics.id, { onDelete: "cascade" }),
    position: integer().notNull(), // 1 = lowest confidence
    scoreBefore: integer().notNull(),
    levelBefore: text({ enum: CONFIDENCE_LEVELS }).notNull(),
    scoreAfter: integer(), // set when the day closes
    levelAfter: text({ enum: CONFIDENCE_LEVELS }),
    overridden: boolean().notNull().default(false), // student set the level by hand at end of day
  },
  (t) => [unique().on(t.studyDayId, t.topicId), index().on(t.topicId)],
);

export type StudyDayRow = typeof studyDays.$inferSelect;
export type StudyDayTopicRow = typeof studyDayTopics.$inferSelect;
