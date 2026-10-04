import { registerApiRoute } from "@mastra/core/server";
import { createTopicBody, levelForScore, nowFor, updateTopicBody } from "@recall/core";
import { and, cards, count, eq, getTableColumns, topics } from "@recall/db";
import { getDb } from "../../db";
import { ensureConfidence, latestConfidence, recordTopic } from "../../lib/confidence";
import { getStudent } from "../../lib/day";
import { guard, HttpError, idParam, isUniqueViolation, parseBody } from "../../lib/http";

const conflict = () => new HttpError(409, "A topic with that name already exists");

export const listTopics = registerApiRoute("/students/:studentId/topics", {
  method: "GET",
  requiresAuth: false,
  handler: guard(async (c) => {
    const db = getDb();
    const studentId = idParam(c, "studentId");
    const student = await getStudent(db, studentId);
    const scores = await ensureConfidence(db, student, nowFor(student.clockOffsetMs));
    const includeArchived = c.req.query("includeArchived") === "true";

    const rows = await db
      .select({ ...getTableColumns(topics), flashcardCount: count(cards.id) })
      .from(topics)
      .leftJoin(cards, eq(cards.topicId, topics.id))
      .where(and(eq(topics.studentId, studentId), includeArchived ? undefined : eq(topics.archived, false)))
      .groupBy(topics.id);
    // Lowest confidence first, newest first among equals.
    const withConfidence = rows
      .map((t) => {
        const confidenceScore = scores.get(t.id) ?? 0;
        return { ...t, confidenceScore, confidenceLevel: levelForScore(confidenceScore) };
      })
      .sort((a, b) => a.confidenceScore - b.confidenceScore || b.createdAt.getTime() - a.createdAt.getTime());
    return c.json({ topics: withConfidence });
  }),
});

export const createTopic = registerApiRoute("/students/:studentId/topics", {
  method: "POST",
  requiresAuth: false,
  handler: guard(async (c) => {
    const db = getDb();
    const studentId = idParam(c, "studentId");
    const body = await parseBody(c, createTopicBody);
    const student = await getStudent(db, studentId);

    const created = await db.transaction(async (tx) => {
      const [topic] = await tx.insert(topics).values({ studentId, ...body }).onConflictDoNothing().returning();
      if (!topic) throw conflict();
      await recordTopic(tx, student, topic.id, nowFor(student.clockOffsetMs)); // its first cell: score 0
      return topic;
    });
    return c.json({ topic: { ...created, ...(await latestConfidence(db, created.id)) } }, 201);
  }),
});

export const updateTopic = registerApiRoute("/topics/:topicId", {
  method: "PATCH",
  requiresAuth: false,
  handler: guard(async (c) => {
    const db = getDb();
    const topicId = idParam(c, "topicId");
    const body = await parseBody(c, updateTopicBody);

    try {
      const [topic] = await db.update(topics).set(body).where(eq(topics.id, topicId)).returning();
      if (!topic) throw new HttpError(404, "Topic not found");
      return c.json({ topic: { ...topic, ...(await latestConfidence(db, topic.id)) } });
    } catch (e) {
      if (isUniqueViolation(e)) throw conflict();
      throw e;
    }
  }),
});

// Also removes the topic's flashcards and its history in past study days.
export const deleteTopic = registerApiRoute("/topics/:topicId", {
  method: "DELETE",
  requiresAuth: false,
  handler: guard(async (c) => {
    const [gone] = await getDb().delete(topics).where(eq(topics.id, idParam(c, "topicId"))).returning({ id: topics.id });
    if (!gone) throw new HttpError(404, "Topic not found");
    return c.body(null, 204);
  }),
});

export const topicRoutes = [listTopics, createTopic, updateTopic, deleteTopic];
