import { registerApiRoute } from "@mastra/core/server";
import { asc, eq, studyDays } from "@recall/db";
import { getDb } from "../../db";
import { nowFor } from "@recall/core";
import { ensureConfidence } from "../../lib/confidence";
import { dayTopics, resolveStudent } from "../../lib/day";
import { guard } from "../../lib/http";

// Every study day with each topic's confidence before and after. Feeds progress charts.
export const getHistory = registerApiRoute("/students/:studentId/history", {
  method: "GET",
  requiresAuth: false,
  handler: guard(async (c) => {
    const db = getDb();
    const student = await resolveStudent(db, c.req.param("studentId"));
    await ensureConfidence(db, student, nowFor(student.clockOffsetMs));
    const days = await db.select().from(studyDays).where(eq(studyDays.studentId, student.id)).orderBy(asc(studyDays.dayNumber));
    const history = await Promise.all(
      days.map(async (d) => ({
        number: d.dayNumber,
        status: d.status,
        startedAt: d.startedAt,
        closedAt: d.closedAt,
        topics: await dayTopics(db, d.id),
      })),
    );
    return c.json({ currentDay: student.currentDay, days: history });
  }),
});
