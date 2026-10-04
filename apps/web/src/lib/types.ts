// Shapes returned by apps/server/src/mastra/routes/*. Keep in sync by hand until the server exports types.
import type { ConfidenceLevel } from "@recall/core";

export type { ConfidenceLevel };

export type DayTopic = {
  topicId: string;
  name: string;
  position: number;
  scoreBefore: number;
  levelBefore: ConfidenceLevel;
  scoreNow: number;
  levelNow: ConfidenceLevel;
  scoreAfter: number | null;
  levelAfter: ConfidenceLevel | null;
  overridden: boolean;
};

export type DayResponse = {
  day: { number: number; status: "open" | "closed"; startedAt: string };
  topics: DayTopic[];
};

// FSRS card state: 0 New, 1 Learning, 2 Review, 3 Relearning
export type Flashcard = { id: string; question: string; answer: string; due: string; state: number; reps: number; lapses: number };

export type Topic = {
  id: string;
  name: string;
  description: string | null;
  archived: boolean;
  lastStudiedAt: string | null;
  flashcardCount: number;
  confidenceScore: number;
  confidenceLevel: ConfidenceLevel;
};

export type HistoryResponse = {
  currentDay: number;
  days: { number: number; status: "open" | "closed"; startedAt: string; closedAt: string | null; topics: DayTopic[] }[];
};

export type ConfidenceGrid = {
  dates: string[];
  topics: { id: string; name: string; current: { score: number; level: ConfidenceLevel }; cells: ({ score: number; level: ConfidenceLevel } | null)[] }[];
};

// 1 Again, 2 Hard, 3 Good, 4 Easy
export type Rating = 1 | 2 | 3 | 4;

// Today's multiple-choice quiz (routes/quiz.ts). `result` is null until the question is answered.
export type QuizQuestion = {
  id: string;
  topic: string;
  prompt: string;
  choices: string[];
  result: { chosen: number; correct: boolean; correctChoice: number; explanation: string } | null;
};

export type Quiz = {
  id: string;
  status: "open" | "done" | "expired";
  topics: string[];
  questions: QuizQuestion[];
  answeredCount: number;
  correctCount: number;
};

export type QuizAnswer = { correct: boolean; correctChoice: number; explanation: string; done: boolean };
