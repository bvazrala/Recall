import { registerApiRoute } from "@mastra/core/server";
import { addDays, datesBetween, levelForScore, localDate, MAX_BACKFILL_DAYS, nowFor } from "@recall/core";
import { and, eq, gte, lte, topicConfidenceDays, topics } from "@recall/db";
import { z } from "zod";
import { getDb } from "../../db";
import { ensureConfidence } from "../../lib/confidence";
import { getStudent } from "../../lib/day";
import { guard, HttpError, idParam } from "../../lib/http";

const DEFAULT_DAYS = 30;

const gridQuery = z.object({
  days: z.coerce.number().int().min(1).max(MAX_BACKFILL_DAYS).default(DEFAULT_DAYS),
  includeArchived: z.enum(["true", "false"]).default("false"),
});

// A topic-by-date grid of confidence. One column per calendar date (the student's own), oldest first.
// A cell is null before its topic existed. Days nothing was studied show the decay, not a gap.
export const getConfidenceGrid = registerApiRoute("/students/:studentId/confidence-grid", {
  method: "GET",
  requiresAuth: false,
  handler: guard(async (c) => {
    const db = getDb();
    const student = await getStudent(db, idParam(c, "studentId"));
    const parsed = gridQuery.safeParse(Object.fromEntries(new URL(c.req.url).searchParams));
    if (!parsed.success) throw new HttpError(400, "days must be 1-365 and includeArchived true or false");
    const { days, includeArchived } = parsed.data;

    const now = nowFor(student.clockOffsetMs);
    const scores = await ensureConfidence(db, student, now);
    const today = localDate(now, student.timezone);
    const dates = datesBetween(addDays(today, -(days - 1)), today);

    const rows = await db
      .select({
        topicId: topicConfidenceDays.topicId,
        date: topicConfidenceDays.date,
        score: topicConfidenceDays.score,
        overridden: topicConfidenceDays.overridden,
      })
      .from(topicConfidenceDays)
      .innerJoin(topics, eq(topics.id, topicConfidenceDays.topicId))
      .where(and(eq(topics.studentId, student.id), gte(topicConfidenceDays.date, dates[0]), lte(topicConfidenceDays.date, today)));
    const cellsByTopic = new Map<string, Map<string, { score: number; overridden: boolean }>>();
    for (const r of rows) {
      const cells = cellsByTopic.get(r.topicId) ?? new Map();
      cells.set(r.date, { score: r.score, overridden: r.overridden });
      cellsByTopic.set(r.topicId, cells);
    }

    const studentTopics = await db
      .select({ id: topics.id, name: topics.name, archived: topics.archived, createdAt: topics.createdAt })
      .from(topics)
      .where(and(eq(topics.studentId, student.id), includeArchived === "true" ? undefined : eq(topics.archived, false)));

    const grid = studentTopics
      .map((t) => {
        const byDate = cellsByTopic.get(t.id);
        const current = scores.get(t.id) ?? 0;
        return {
          id: t.id,
          name: t.name,
          archived: t.archived,
          current: { score: current, level: levelForScore(current) },
          cells: dates.map((d) => {
            const cell = byDate?.get(d);
            return cell ? { score: cell.score, level: levelForScore(cell.score), overridden: cell.overridden } : null;
          }),
          createdAt: t.createdAt,
        };
      })
      // Lowest confidence first, the same order as the topic list.
      .sort((a, b) => a.current.score - b.current.score || b.createdAt.getTime() - a.createdAt.getTime())
      .map(({ createdAt: _createdAt, ...topic }) => topic);

    return c.json({ dates, topics: grid });
  }),
});
