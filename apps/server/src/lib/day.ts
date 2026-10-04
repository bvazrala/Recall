import { pickSuggested, SUGGESTED_COUNT } from "@recall/core";
import { and, asc, eq, studyDays, studyDayTopics, topics, type Db, type Student, type StudyDayRow } from "@recall/db";
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

  const candidates = await db.select().from(topics).where(and(eq(topics.studentId, student.id), eq(topics.archived, false)));
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
        levelBefore: t.confidenceLevel,
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
export async function dayTopics(db: DbOrTx, studyDayId: string) {
  return db
    .select({
      topicId: topics.id,
      name: topics.name,
      position: studyDayTopics.position,
      scoreBefore: studyDayTopics.scoreBefore,
      levelBefore: studyDayTopics.levelBefore,
      scoreNow: topics.confidenceScore,
      levelNow: topics.confidenceLevel,
      scoreAfter: studyDayTopics.scoreAfter,
      levelAfter: studyDayTopics.levelAfter,
      overridden: studyDayTopics.overridden,
    })
    .from(studyDayTopics)
    .innerJoin(topics, eq(topics.id, studyDayTopics.topicId))
    .where(eq(studyDayTopics.studyDayId, studyDayId))
    .orderBy(asc(studyDayTopics.position));
}
