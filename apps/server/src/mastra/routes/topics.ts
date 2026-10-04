import { registerApiRoute } from "@mastra/core/server";
import { createTopicBody, updateTopicBody } from "@recall/core";
import { and, cards, count, desc, eq, getTableColumns, topics } from "@recall/db";
import { getDb } from "../../db";
import { getStudent } from "../../lib/day";
import { guard, HttpError, idParam, isUniqueViolation, parseBody } from "../../lib/http";

const conflict = () => new HttpError(409, "A topic with that name already exists");

export const listTopics = registerApiRoute("/students/:studentId/topics", {
  method: "GET",
  requiresAuth: false,
  handler: guard(async (c) => {
    const db = getDb();
    const studentId = idParam(c, "studentId");
    await getStudent(db, studentId);
    const includeArchived = c.req.query("includeArchived") === "true";

    const rows = await db
      .select({ ...getTableColumns(topics), flashcardCount: count(cards.id) })
      .from(topics)
      .leftJoin(cards, eq(cards.topicId, topics.id))
      .where(and(eq(topics.studentId, studentId), includeArchived ? undefined : eq(topics.archived, false)))
      .groupBy(topics.id)
      .orderBy(topics.confidenceScore, desc(topics.createdAt));
    return c.json({ topics: rows });
  }),
});

export const createTopic = registerApiRoute("/students/:studentId/topics", {
  method: "POST",
  requiresAuth: false,
  handler: guard(async (c) => {
    const db = getDb();
    const studentId = idParam(c, "studentId");
    const body = await parseBody(c, createTopicBody);
    await getStudent(db, studentId);

    const [topic] = await db.insert(topics).values({ studentId, ...body }).onConflictDoNothing().returning();
    if (!topic) throw conflict();
    return c.json({ topic }, 201);
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
      return c.json({ topic });
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
