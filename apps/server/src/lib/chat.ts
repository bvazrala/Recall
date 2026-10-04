import { desc, eq, messages, type Student } from "@recall/db";
import { tutor } from "../mastra/agents/tutor";
import { dayTopics, findCurrentDay, type DbOrTx } from "./day";
import { findTodaysQuiz, quizForTutor, quizView } from "./quiz";

const HISTORY = 20; // texts of back-and-forth the tutor sees
const FALLBACK = "I couldn't answer that just now. Try again in a minute.";

// What the tutor knows about the student today: their study day, its topics, and today's quiz.
async function studyContext(db: DbOrTx, student: Student): Promise<string> {
  const day = await findCurrentDay(db, student);
  if (!day) return "The student hasn't started a study day yet.";
  const topics = await dayTopics(db, day.id);
  const quiz = await findTodaysQuiz(db, student);
  const quizText = quiz ? quizForTutor(await quizView(db, quiz)) : "No quiz written yet today.";
  return [
    `Study day ${day.dayNumber}.`,
    `Today's topics (confidence red < yellow < green < star): ${topics.map((t) => `${t.name} (${t.levelNow})`).join(", ") || "none"}.`,
    `Today's quiz:\n${quizText}`,
  ].join("\n\n");
}

// The recent thread, oldest first, as chat turns. Texts Recall sent become assistant turns.
async function history(db: DbOrTx, studentId: string) {
  const rows = await db
    .select({ direction: messages.direction, body: messages.body })
    .from(messages)
    .where(eq(messages.studentId, studentId))
    .orderBy(desc(messages.createdAt))
    .limit(HISTORY);
  const turns = rows
    .reverse()
    .filter((r) => r.body)
    .map((r) => (r.direction === "in" ? { role: "user" as const, content: r.body! } : { role: "assistant" as const, content: r.body! }));
  // A conversation has to open with the student. Today's quiz is in the context anyway.
  while (turns[0]?.role === "assistant") turns.shift();
  return turns;
}

// Logs the student's text and returns Recall's reply, or null if this text was already handled
// (Photon can deliver the same message twice).
export async function reply(db: DbOrTx, student: Student, text: string, providerMessageId?: string): Promise<string | null> {
  const [inbound] = await db
    .insert(messages)
    .values({ studentId: student.id, direction: "in", kind: "text", body: text, providerMessageId })
    .onConflictDoNothing()
    .returning({ id: messages.id });
  if (!inbound) return null;

  let answer: string;
  try {
    const context = await studyContext(db, student);
    const result = await tutor.generate([{ role: "system", content: context }, ...(await history(db, student.id))]);
    answer = result.text.trim() || FALLBACK;
  } catch (e) {
    console.error("Tutor failed", e);
    answer = FALLBACK;
  }
  await db.insert(messages).values({ studentId: student.id, direction: "out", kind: "text", body: answer });
  return answer;
}
