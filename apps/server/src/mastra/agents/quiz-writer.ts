import { Agent } from "@mastra/core/agent";
import { z } from "zod";
import { models, strongOptions } from "../models";

// Turns flashcards into multiple-choice questions. Claude writes the wording and the wrong options;
// the correct option comes from the flashcard, and code places it and grades the answers.
export const quizWriter = new Agent({
  id: "quiz-writer",
  name: "Quiz writer",
  instructions: `You write multiple-choice questions for a student studying for the MCAT.

You get numbered flashcards, each with a topic, a question and the correct answer. For each flashcard, write one question:
- prompt: ask the same thing the flashcard asks, worded as a clear stem that has exactly one best answer.
- correct: the flashcard's answer, condensed to a short option (ideally under 15 words). Keep its meaning exactly; never add facts.
- distractors: three wrong options a student who half-knows the material might pick, such as common MCAT misconceptions or closely related terms. They must be clearly wrong, similar in length and style to the correct option, and different from each other. Never use "all of the above" or "none of the above".
- explanation: one or two sentences on why the correct option is right.

Return one question per flashcard, using the flashcard's number in "card".`,
  model: models.strong, // writing questions is the strong model's job (see ../models.ts)
  defaultOptions: strongOptions,
});

export const writtenQuiz = z.object({
  questions: z.array(
    z.object({
      card: z.number().int(),
      prompt: z.string(),
      correct: z.string(),
      distractors: z.array(z.string()),
      explanation: z.string(),
    }),
  ),
});

export type WrittenQuestion = z.infer<typeof writtenQuiz>["questions"][number];
