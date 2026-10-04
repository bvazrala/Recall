import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { eq, inArray, or } from "drizzle-orm";
import { levelForScore } from "../../../core/src";
import type { Card } from "../../../core/src";
import {
  cards, createDb, messages, questions, reviews, studyDays, studyDayTopics, students, topicConfidenceDays, topics,
} from "../../src";
import { bioDecks } from "./content-bio";
import { chemDecks } from "./content-chem";
import { psychDecks } from "./content-psych";
import type { Deck } from "./types";

// Maya is a demo student. A fixed id and phone let the scripts replace her, and let the web app point at her
// once: set NEXT_PUBLIC_STUDENT_ID to MAYA_ID in apps/web/.env.local. The phone matches the web app's mock user.
export const MAYA_ID = "6d0a9c52-1f3e-4b7a-8c2d-5e4f3a2b1c01";
// Set SEED_PHONE (e.g. +12484955983) to seed Maya's data onto your own number for the iMessage demo.
export const MAYA_PHONE = process.env.SEED_PHONE ?? "+15550100142";
export const TIMEZONE = "America/Detroit";

export const decks: Deck[] = [...bioDecks, ...chemDecks, ...psychDecks];

export type Plan = {
  student: typeof students.$inferInsert & { id: string };
  topics: (typeof topics.$inferInsert & { id: string })[];
  cards: (typeof cards.$inferInsert & { id: string })[];
  questions: (typeof questions.$inferInsert & { id: string })[];
  studyDays: (typeof studyDays.$inferInsert & { id: string })[];
  studyDayTopics: (typeof studyDayTopics.$inferInsert)[];
  reviews: (typeof reviews.$inferInsert)[];
  confidence: (typeof topicConfidenceDays.$inferInsert)[];
  messages: (typeof messages.$inferInsert)[];
};

// The FSRS columns of a cards row, from a ts-fsrs Card.
export function fsrsColumns(c: Card) {
  return {
    due: c.due,
    stability: c.stability,
    difficulty: c.difficulty,
    elapsed_days: c.elapsed_days,
    scheduled_days: c.scheduled_days,
    learning_steps: c.learning_steps,
    reps: c.reps,
    lapses: c.lapses,
    state: c.state,
    last_review: c.last_review ?? null,
  };
}

// Maya, all 24 topics, and their 360 flashcards (each card with its one flashcard question).
// Every card starts brand new (FSRS state 0); the mid-study script advances them afterwards.
export function curriculum(studentId: string, createdAt: Date, newCard: (now: Date) => Card) {
  const topicRows: Plan["topics"] = [];
  const cardRows: Plan["cards"] = [];
  const questionRows: Plan["questions"] = [];
  for (const deck of decks) {
    const topicId = randomUUID();
    topicRows.push({ id: topicId, studentId, name: deck.name, description: deck.description, createdAt });
    for (const [label, prompt, answer] of deck.cards) {
      const cardId = randomUUID();
      cardRows.push({ id: cardId, studentId, topicId, label: `${deck.name}: ${label}`, ...fsrsColumns(newCard(createdAt)), createdAt });
      questionRows.push({
        id: randomUUID(), cardId, studentId, format: "flashcard", prompt, answer: { text: answer },
        explanation: `${deck.name}: ${answer}`, createdAt,
      });
    }
  }
  return { topicRows, cardRows, questionRows };
}

export function mayaRow(id: string, createdAt: Date, currentDay: number): Plan["student"] {
  return { id, phone: MAYA_PHONE, timezone: TIMEZONE, isDemo: true, currentDay, ageConfirmedAt: createdAt, createdAt };
}

export function describePlan(plan: Plan, now: Date) {
  const latest = new Map<string, number>();
  for (const row of [...plan.confidence].sort((a, b) => a.date.localeCompare(b.date))) latest.set(row.topicId, row.score);
  const levels: Record<string, number> = { red: 0, yellow: 0, green: 0, star: 0 };
  const lines = plan.topics.map((t) => {
    const score = latest.get(t.id) ?? 0;
    levels[levelForScore(score)]++;
    return `  ${String(score).padStart(3)}  ${levelForScore(score).padEnd(6)} ${t.name}`;
  });
  console.log(lines.join("\n"));
  console.log(
    `\nMaya at ${now.toISOString()}\n` +
      `  topics ${plan.topics.length}, cards ${plan.cards.length}, questions ${plan.questions.length}, ` +
      `study days ${plan.studyDays.length}, reviews ${plan.reviews.length}, messages ${plan.messages.length}, ` +
      `confidence rows ${plan.confidence.length}\n` +
      `  grid: ${Object.entries(levels).map(([k, v]) => `${v} ${k}`).join(", ")}`,
  );
}

async function insertChunks<T>(rows: T[], insert: (chunk: T[]) => Promise<unknown>, size = 500) {
  for (let i = 0; i < rows.length; i += size) await insert(rows.slice(i, i + size));
}

// Replaces Maya with the plan. Deleting her student row cascades to everything she owns.
async function persist(plan: Plan) {
  for (const f of [".env", "../../.env"]) if (existsSync(f)) process.loadEnvFile(f);
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is missing. Copy .env.example to .env and paste your Neon URL.");
  const { db, pool } = createDb(url);
  try {
    await db.transaction(async (tx) => {
      // Also clears an older row saved without the "+".
      const phones = [MAYA_PHONE, MAYA_PHONE.replace(/\D/g, "")];
      await tx.delete(students).where(or(eq(students.id, MAYA_ID), inArray(students.phone, phones)));
      await tx.insert(students).values(plan.student);
      await insertChunks(plan.topics, (c) => tx.insert(topics).values(c));
      await insertChunks(plan.cards, (c) => tx.insert(cards).values(c));
      await insertChunks(plan.questions, (c) => tx.insert(questions).values(c));
      await insertChunks(plan.studyDays, (c) => tx.insert(studyDays).values(c));
      await insertChunks(plan.studyDayTopics, (c) => tx.insert(studyDayTopics).values(c));
      await insertChunks(plan.reviews, (c) => tx.insert(reviews).values(c));
      await insertChunks(plan.confidence, (c) => tx.insert(topicConfidenceDays).values(c));
      await insertChunks(plan.messages, (c) => tx.insert(messages).values(c));
    });
  } finally {
    await pool.end();
  }
}

// Prints Maya's grid. With --dry-run nothing touches the database.
export async function run(plan: Plan, now: Date) {
  describePlan(plan, now);
  if (process.argv.includes("--dry-run")) return console.log("\nDry run: database untouched.");
  await persist(plan);
  console.log(`\nSeeded Maya. Set NEXT_PUBLIC_STUDENT_ID=${MAYA_ID} in apps/web/.env.local.`);
}
