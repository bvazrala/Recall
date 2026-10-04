import { bigint, boolean, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const students = pgTable("students", {
  id: uuid().primaryKey().defaultRandom(),
  authUserId: text().unique(), // Better Auth user id; null means guest
  phone: text().unique(), // E.164 format, e.g. +15551234567
  photonUserId: text(), // Photon's id for this phone
  photonNumber: text(), // the number this student texts
  status: text({ enum: ["active", "paused", "stopped"] }).notNull().default("active"),
  timezone: text().notNull().default("America/Detroit"),
  guestExpiresAt: timestamp({ withTimezone: true }),
  ageConfirmedAt: timestamp({ withTimezone: true }),
  isDemo: boolean().notNull().default(false),
  clockOffsetMs: bigint({ mode: "number" }).notNull().default(0), // demo fast-forward
  currentDay: integer().notNull().default(1), // study day number; moves only when a day is closed
  lastInboundAt: timestamp({ withTimezone: true }),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;
