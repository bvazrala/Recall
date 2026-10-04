import { levelForScore, pickSuggested, SUGGESTED_COUNT } from "@recall/core";
import { and, asc, eq, sql, studyDays, studyDayTopics, topicConfidenceDays, topics, type Db, type Student, type StudyDayRow } from "@recall/db";
import { ensureConfidence } from "./confidence";
import { HttpError } from "./http";

// Drizzle's transaction handle has the same query API as the db.
export type DbOrTx = Db | Parameters<Parameters<Db["transaction"]>[0]>[0];

export async function getStudent(db: DbOrTx, studentId: string): Promise<Student> {
  const student = await db.query.students.findFirst({ where: (s, { eq }) => eq(s.id, studentId) });
  if (!student) throw new HttpError(404, "Student not found");
  return student;
}

// The student's current day, created on first call with the lowest-confidence topics frozen into it.
export async function openCurrentDay(db: DbOrTx, student: Student, now: Date): Promise<StudyDayRow> {
  const existing = await findCurrentDay(db, student);
  if (existing) return existing;

  const scores = await ensureConfidence(db, student, now);
  const rows = await db.select().from(topics).where(and(eq(topics.studentId, student.id), eq(topics.archived, false)));
  const candidates = rows.map((t) => ({ ...t, confidenceScore: scores.get(t.id) ?? 0 }));
  const picked = pickSuggested(candidates, SUGGESTED_COUNT);

  // Two requests can race to open the same day; the unique (studentId, dayNumber) keeps just one.
  const [created] = await db
    .insert(studyDays)
    .values({ studentId: student.id, dayNumber: student.currentDay, startedAt: now })
    .onConflictDoNothing()
    .returning();
  if (!created) return (await findCurrentDay(db, student))!;

  if (picked.length > 0) {
    await db.insert(studyDayTopics).values(
      picked.map((t, i) => ({
        studyDayId: created.id,
        topicId: t.id,
        position: i + 1,
        scoreBefore: t.confidenceScore,
        levelBefore: levelForScore(t.confidenceScore),
      })),
    );
  }
  return created;
}

export async function findCurrentDay(db: DbOrTx, student: Student): Promise<StudyDayRow | undefined> {
  return db.query.studyDays.findFirst({
    where: (d, { and, eq }) => and(eq(d.studentId, student.id), eq(d.dayNumber, student.currentDay)),
  });
}

// A day's topics with the confidence they had at the start and have now.
// "Now" is the topic's latest stored score; call ensureConfidence first so that is today's.
export async function dayTopics(db: DbOrTx, studyDayId: string) {
  const rows = await db
    .select({
      topicId: topics.id,
      name: topics.name,
      position: studyDayTopics.position,
      scoreBefore: studyDayTopics.scoreBefore,
      levelBefore: studyDayTopics.levelBefore,
      scoreNow: sql<number>`coalesce((select c.score from ${topicConfidenceDays} c where c.topic_id = ${topics.id} order by c.date desc limit 1), 0)`,
      scoreAfter: studyDayTopics.scoreAfter,
      levelAfter: studyDayTopics.levelAfter,
      overridden: studyDayTopics.overridden,
    })
    .from(studyDayTopics)
    .innerJoin(topics, eq(topics.id, studyDayTopics.topicId))
    .where(eq(studyDayTopics.studyDayId, studyDayId))
    .orderBy(asc(studyDayTopics.position));
  return rows.map((r) => ({ ...r, levelNow: levelForScore(r.scoreNow) }));
}
