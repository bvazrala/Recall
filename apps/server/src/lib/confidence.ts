import { backfillRows, levelForScore, localDate, topicScore, type ConfidenceLevel, type ScorableCard } from "@recall/core";
import { and, cards, desc, eq, inArray, isNotNull, max, sql, topicConfidenceDays, topics, type Student } from "@recall/db";
import type { DbOrTx } from "./day";

// topic_confidence_days is the only place confidence lives. Two rules keep it correct:
//  1. Anything that changes a topic's cards (a review, adding or deleting a flashcard, creating the topic)
//     calls recordTopic, which writes that day's row.
//  2. Every read that shows confidence calls ensureConfidence first, which fills the days nothing happened.
// Together they mean a gap in a topic's rows always has the topic's cards exactly as they are now.

const CHUNK = 5000; // 3 columns per row keeps each insert far below Postgres's parameter limit

const cardColumns = {
  topicId: cards.topicId,
  due: cards.due,
  stability: cards.stability,
  difficulty: cards.difficulty,
  elapsed_days: cards.elapsed_days,
  scheduled_days: cards.scheduled_days,
  learning_steps: cards.learning_steps,
  reps: cards.reps,
  lapses: cards.lapses,
  state: cards.state,
  last_review: cards.last_review,
  suspended: cards.suspended,
};

type Row = { topicId: string; date: string; score: number };

// How a write treats a row that already exists for that topic and date.
//  recompute: the cards say so. Replaces the score and clears any manual override.
//  refresh:   a routine read. Replaces the score unless the student set it by hand.
//  override:  the student set it by hand.
type Write = "recompute" | "refresh" | "override";

async function upsert(db: DbOrTx, rows: Row[], write: Write) {
  const overridden = write === "override";
  for (let i = 0; i < rows.length; i += CHUNK) {
    await db
      .insert(topicConfidenceDays)
      .values(rows.slice(i, i + CHUNK).map((r) => ({ ...r, overridden })))
      .onConflictDoUpdate({
        target: [topicConfidenceDays.topicId, topicConfidenceDays.date],
        set: { score: sql`excluded.score`, overridden: sql`excluded.overridden` },
        setWhere: write === "refresh" ? eq(topicConfidenceDays.overridden, false) : undefined,
      });
  }
}

async function insertMissing(db: DbOrTx, rows: Row[]) {
  for (let i = 0; i < rows.length; i += CHUNK) {
    await db.insert(topicConfidenceDays).values(rows.slice(i, i + CHUNK)).onConflictDoNothing();
  }
}

// Recompute one topic's score for today from its cards, and store it. Returns the new score.
export async function recordTopic(db: DbOrTx, student: Student, topicId: string, now: Date): Promise<number> {
  const rows = await db.select(cardColumns).from(cards).where(eq(cards.topicId, topicId));
  const score = topicScore(rows as ScorableCard[], now);
  await upsert(db, [{ topicId, date: localDate(now, student.timezone), score }], "recompute");
  return score;
}

// A student's confidence is up to date through today. Fills any missing past days, refreshes today
// (leaving hand-set scores alone), and returns each topic's score for today.
export async function ensureConfidence(db: DbOrTx, student: Student, now: Date): Promise<Map<string, number>> {
  const today = localDate(now, student.timezone);
  const studentTopics = await db.select({ id: topics.id }).from(topics).where(eq(topics.studentId, student.id));
  if (studentTopics.length === 0) return new Map();
  const ids = studentTopics.map((t) => t.id);

  const lastRows = await db
    .select({ topicId: topicConfidenceDays.topicId, last: max(topicConfidenceDays.date) })
    .from(topicConfidenceDays)
    .where(inArray(topicConfidenceDays.topicId, ids))
    .groupBy(topicConfidenceDays.topicId);
  const last = new Map(lastRows.map((r) => [r.topicId, r.last]));

  const cardRows = await db.select(cardColumns).from(cards).where(and(eq(cards.studentId, student.id), isNotNull(cards.topicId)));
  const byTopic = new Map<string, ScorableCard[]>();
  for (const row of cardRows) {
    const list = byTopic.get(row.topicId!) ?? [];
    list.push(row as ScorableCard);
    byTopic.set(row.topicId!, list);
  }

  const missing: Row[] = [];
  const todayRows: Row[] = [];
  for (const id of ids) {
    const topicCards = byTopic.get(id) ?? [];
    for (const r of backfillRows(topicCards, last.get(id) ?? null, today, student.timezone)) missing.push({ topicId: id, ...r });
    todayRows.push({ topicId: id, date: today, score: topicScore(topicCards, now) });
  }

  await insertMissing(db, missing);
  await upsert(db, todayRows, "refresh");
  return await todayScores(db, today, ids);
}

async function todayScores(db: DbOrTx, today: string, topicIds: string[]): Promise<Map<string, number>> {
  const rows = await db
    .select({ topicId: topicConfidenceDays.topicId, score: topicConfidenceDays.score })
    .from(topicConfidenceDays)
    .where(and(inArray(topicConfidenceDays.topicId, topicIds), eq(topicConfidenceDays.date, today)));
  return new Map(rows.map((r) => [r.topicId, r.score]));
}

// A topic's most recent stored score and its level. 0 and red when it has no rows.
export async function latestConfidence(db: DbOrTx, topicId: string): Promise<{ confidenceScore: number; confidenceLevel: ConfidenceLevel }> {
  const [row] = await db
    .select({ score: topicConfidenceDays.score })
    .from(topicConfidenceDays)
    .where(eq(topicConfidenceDays.topicId, topicId))
    .orderBy(desc(topicConfidenceDays.date))
    .limit(1);
  const score = row?.score ?? 0;
  return { confidenceScore: score, confidenceLevel: levelForScore(score) };
}

// Set a topic's score for today by hand (a student override at the end of a day).
export async function setTodayScore(db: DbOrTx, student: Student, topicId: string, score: number, now: Date) {
  await upsert(db, [{ topicId, date: localDate(now, student.timezone), score }], "override");
}
