import { integer, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { students } from "./students";

// One row per photo or PDF a student sends or uploads.
export const files = pgTable("files", {
  id: uuid().primaryKey().defaultRandom(),
  studentId: uuid().notNull().references(() => students.id, { onDelete: "cascade" }),
  source: text({ enum: ["imessage", "web", "notability"] }).notNull(),
  mimeType: text().notNull(), // image/heic, application/pdf, ...
  sizeBytes: integer(),
  sha256: text(), // spots the same file sent twice
  blobUrl: text(), // where the original is stored, if we keep it
  status: text({ enum: ["received", "extracting", "ready", "failed", "too_large"] }).notNull().default("received"),
  error: text(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

// The extracted text, split into numbered pieces. Every question points back to one of these.
export const passages = pgTable(
  "passages",
  {
    id: uuid().primaryKey().defaultRandom(),
    studentId: uuid().notNull().references(() => students.id, { onDelete: "cascade" }),
    fileId: uuid().notNull().references(() => files.id, { onDelete: "cascade" }),
    page: integer().notNull(),
    ordinal: integer().notNull(), // order within the page
    content: text().notNull(),
    method: text({ enum: ["text_layer", "vision"] }).notNull(), // how the text was read
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.fileId, t.page, t.ordinal)],
);

export type FileRow = typeof files.$inferSelect;
export type PassageRow = typeof passages.$inferSelect;
