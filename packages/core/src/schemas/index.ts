// Zod schemas shared by LLM output, database JSON columns, and API payloads.
import { z } from "zod";
import { CONFIDENCE_LEVELS } from "../confidence";

export const createTopicBody = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
});

export const updateTopicBody = z
  .object({
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().max(500).nullable(),
    archived: z.boolean(),
  })
  .partial()
  .refine((b) => Object.keys(b).length > 0, "Nothing to update");

export const createFlashcardBody = z.object({
  question: z.string().trim().min(1).max(2000),
  answer: z.string().trim().min(1).max(4000),
});

export const updateFlashcardBody = createFlashcardBody
  .partial()
  .refine((b) => Object.keys(b).length > 0, "Nothing to update");

// 1 Again, 2 Hard, 3 Good, 4 Easy
export const reviewFlashcardBody = z.object({
  rating: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
});

export const closeDayBody = z.object({
  // The day the client believes it is closing. A repeated or stale request gets a 409 instead of closing the next day.
  dayNumber: z.number().int().positive().optional(),
  overrides: z
    .array(z.object({ topicId: z.uuid(), level: z.enum(CONFIDENCE_LEVELS) }))
    .max(50)
    .default([]),
});

export type CreateTopicBody = z.infer<typeof createTopicBody>;
export type UpdateTopicBody = z.infer<typeof updateTopicBody>;
export type CreateFlashcardBody = z.infer<typeof createFlashcardBody>;
export type UpdateFlashcardBody = z.infer<typeof updateFlashcardBody>;
export type ReviewFlashcardBody = z.infer<typeof reviewFlashcardBody>;
export type CloseDayBody = z.infer<typeof closeDayBody>;
