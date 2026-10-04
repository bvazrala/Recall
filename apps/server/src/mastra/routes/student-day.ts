import { registerApiRoute } from "@mastra/core/server";
import { DAY_MS, dayNumber, nowFor, pickDailyTopics } from "@recall/core";
import { and, cards, createDb, eq, students, type Student } from "@recall/db";

// Connects to the existing Neon database; nothing is created.
const { db } = createDb(process.env.DATABASE_URL!);

// :studentId is the student's phone number, digits only (e.g. 15551234567).
function findStudent(phone: string) {
  return db.query.students.findFirst({ where: eq(students.phone, phone) });
}

// Today's plan: the 5 weakest topics and the quiz link. "Today" follows the demo day counter.
async function dayPlan(student: Student) {
  const now = nowFor(student.clockOffsetMs);
  const rows = await db
    .select()
    .from(cards)
    .where(and(eq(cards.studentId, student.id), eq(cards.suspended, false)));
  return {
    studentId: student.phone,
    day: dayNumber(student.clockOffsetMs),
    date: now.toISOString(),
    topics: pickDailyTopics(rows, now),
    quizUrl: process.env.QUIZ_URL ?? null,
  };
}

export const studentDay = registerApiRoute("/students/:studentId/day", {
  method: "GET",
  requiresAuth: false,
  handler: async (c) => {
    const student = await findStudent(c.req.param("studentId"));
    if (!student) return c.json({ error: "student not found" }, 404);
    return c.json(await dayPlan(student));
  },
});

// Demo day counter: moves the student's clock forward one day and returns the new day's plan.
export const nextDay = registerApiRoute("/students/:studentId/day/next", {
  method: "POST",
  requiresAuth: false,
  handler: async (c) => {
    const student = await findStudent(c.req.param("studentId"));
    if (!student) return c.json({ error: "student not found" }, 404);
    const [updated] = await db
      .update(students)
      .set({ clockOffsetMs: student.clockOffsetMs + DAY_MS })
      .where(eq(students.id, student.id))
      .returning();
    return c.json(await dayPlan(updated!));
  },
});
