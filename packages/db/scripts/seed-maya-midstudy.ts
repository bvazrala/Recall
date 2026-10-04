// Maya two weeks into MCAT prep. Every topic is seeded pseudo-randomly (the same every run) to land on a chosen
// confidence level, and its cards are advanced by the real FSRS scheduler and the real confidence scoring.
import { randomUUID } from "node:crypto";
import {
  addDays, endOfLocalDay, levelForScore, localDate, newCard, pickSuggested, ratingToGrade, reviewCard, startOfLocalDay, topicScore,
  type Card, type ConfidenceLevel, type FsrsRating, type ScorableCard,
} from "../../core/src";
import { curriculum, MAYA_ID, fsrsColumns, mayaRow, MAYA_PHONE, run, TIMEZONE, type Plan } from "./seed/lib";

const HISTORY_DAYS = 14;
const SKIPPED_DAYS = 2; // days Maya didn't study
const PER_DAY = 5; // topics per study day, like the app's suggestions
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const SLOT = 40 * MINUTE; // each topic gets its own slot in the evening

// Small seeded random number generator, so every run produces the same Maya.
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20261004);
const between = (lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1));
function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const now = new Date();
const today = localDate(now, TIMEZONE);
const firstDate = addDays(today, -HISTORY_DAYS);
const createdAt = new Date(startOfLocalDay(firstDate, TIMEZONE).getTime() + 15 * HOUR);

const studentId = MAYA_ID;
const { topicRows, cardRows, questionRows } = curriculum(studentId, createdAt, newCard);
const questionByCard = new Map(questionRows.map((q) => [q.cardId, q.id]));

// How a topic is studied to land on each level: sessions, cards she gets through, and how well she recalls them.
const STUDY: Record<ConfidenceLevel, { sessions: [number, number]; cards: [number, number]; skill: number }> = {
  star: { sessions: [3, 5], cards: [15, 15], skill: 0.95 },
  green: { sessions: [2, 4], cards: [10, 15], skill: 0.88 },
  yellow: { sessions: [1, 3], cards: [6, 12], skill: 0.75 },
  orange: { sessions: [1, 2], cards: [3, 7], skill: 0.62 },
  red: { sessions: [0, 2], cards: [0, 4], skill: 0.5 },
};
// 24 topics: mostly yellow and green, a few orange and red, two stars.
const targets = shuffle<ConfidenceLevel>([
  ...Array<ConfidenceLevel>(2).fill("star"), ...Array<ConfidenceLevel>(10).fill("green"),
  ...Array<ConfidenceLevel>(8).fill("yellow"), ...Array<ConfidenceLevel>(3).fill("orange"), ...Array<ConfidenceLevel>(1).fill("red"),
]);

// Days she studied: every past day except a couple of skipped ones (never the first).
const pastDates = Array.from({ length: HISTORY_DAYS }, (_, i) => addDays(firstDate, i)); // firstDate .. yesterday
const skipped = new Set(shuffle(pastDates.slice(1)).slice(0, SKIPPED_DAYS));
const studyDates = pastDates.filter((d) => !skipped.has(d));
const slotsUsed = new Map<string, number>(); // study date -> topics already placed on it

function drawRating(skill: number): FsrsRating {
  const miss = 1 - skill;
  const r = rand();
  if (r < miss * 0.6) return 1;
  if (r < miss) return 2;
  return r < miss + skill * 0.75 ? 3 : 4;
}

type Review = { cardId: string; rating: FsrsRating; log: object; at: Date };
type Session = { date: string; start: Date; end: Date; scoreBefore: number; scoreAfter: number; reviews: Review[]; cards: Card[] };

// One topic studied over some days. Returns null if the topic didn't end on the target level.
function simulate(topicIndex: number, level: ConfidenceLevel, dates: string[], slotOf: (date: string) => number) {
  const { cards: cardRange, skill } = STUDY[level];
  const topicId = topicRows[topicIndex].id;
  const rows = cardRows.filter((c) => c.topicId === topicId);
  const cardCount = between(...cardRange);
  const live = rows.map((row) => ({ row, card: newCard(createdAt), introduced: false }));
  const scorable = (): ScorableCard[] => live.map((c) => ({ ...fsrsColumns(c.card), suspended: false }));
  const sessions: Session[] = [];

  for (const date of dates) {
    const start = new Date(startOfLocalDay(date, TIMEZONE).getTime() + 16 * HOUR + slotOf(date) * SLOT);
    const dayEnd = endOfLocalDay(date, TIMEZONE);
    const scoreBefore = topicScore(scorable(), start);
    const introducedSoFar = live.filter((c) => c.introduced).length;
    const introduce = Math.min(Math.ceil(cardCount / dates.length), cardCount - introducedSoFar);
    let clock = new Date(start.getTime() + 2 * MINUTE);
    let fresh = 0;
    const reviews: Review[] = [];
    for (const c of live) {
      const isDue = c.introduced && c.card.due.getTime() <= dayEnd.getTime();
      const isNew = !c.introduced && fresh < introduce;
      if (!isDue && !isNew) continue;
      if (isNew) fresh++;
      const rating = drawRating(skill);
      const result = reviewCard(c.card, rating, clock);
      reviews.push({ cardId: c.row.id, rating, log: result.log, at: clock });
      c.card = result.card;
      c.introduced = true;
      clock = new Date(clock.getTime() + between(30, 90) * 1000);
    }
    const end = new Date(clock.getTime() + MINUTE);
    sessions.push({ date, start, end, scoreBefore, scoreAfter: topicScore(scorable(), end), reviews, cards: live.map((c) => c.card) });
  }

  if (levelForScore(topicScore(scorable(), now)) !== level) return null;
  return { sessions, finalCards: live.map((c) => c.card), rows };
}

// Give every topic study dates (with room left in each day) until it lands on its level.
const results = topicRows.map((_, i) => {
  const level = targets[i];
  for (let attempt = 0; attempt < 2000; attempt++) {
    const n = between(...STUDY[level].sessions);
    const dates = shuffle(studyDates).slice(0, n).sort();
    if (dates.some((d) => (slotsUsed.get(d) ?? 0) >= PER_DAY)) continue;
    const slots = new Map(dates.map((d) => [d, slotsUsed.get(d) ?? 0]));
    const result = simulate(i, level, dates, (d) => slots.get(d)!);
    if (!result) continue;
    for (const d of dates) slotsUsed.set(d, slots.get(d)! + 1);
    return result;
  }
  throw new Error(`Could not seed "${topicRows[i].name}" at ${level}; loosen STUDY.`);
});

const plan: Plan = {
  student: mayaRow(studentId, createdAt, 1),
  topics: topicRows,
  cards: cardRows,
  questions: questionRows,
  studyDays: [],
  studyDayTopics: [],
  reviews: [],
  confidence: [],
  messages: [],
};

let messageNumber = 0;
const say = (direction: "in" | "out", at: Date, body: string) =>
  plan.messages.push({
    studentId, direction, kind: "text", body, createdAt: at,
    providerMessageId: `seed-${MAYA_PHONE}-${++messageNumber}`,
  });
say("out", createdAt, "Hi Maya! I'm Recall. I've set up 24 MCAT topics for you, 15 flashcards each. Text me when you're ready to start day 1.");

// Cards end where their simulation left them.
results.forEach((r, i) => {
  r.rows.forEach((row, k) => Object.assign(row, fsrsColumns(r.finalCards[k])));
  const last = r.sessions.at(-1);
  if (last) topicRows[i].lastStudiedAt = last.end;
});

// One study day per date she studied, with the topics she worked on that day.
let dayNumber = 0;
for (const date of studyDates.filter((d) => slotsUsed.has(d))) {
  dayNumber++;
  const worked = results.flatMap((r, i) => {
    const session = r.sessions.find((s) => s.date === date);
    return session ? [{ topicIndex: i, session }] : [];
  }).sort((a, b) => a.session.scoreBefore - b.session.scoreBefore);
  const dayStart = new Date(Math.min(...worked.map((w) => w.session.start.getTime())) - 10 * MINUTE);
  const closedAt = new Date(Math.max(...worked.map((w) => w.session.end.getTime())) + MINUTE);
  const studyDayId = randomUUID();
  plan.studyDays.push({ id: studyDayId, studentId, dayNumber, status: "closed", startedAt: dayStart, closedAt });
  let reviewed = 0;
  worked.forEach(({ topicIndex, session }, k) => {
    const topicId = topicRows[topicIndex].id;
    plan.studyDayTopics.push({
      studyDayId, topicId, position: k + 1,
      scoreBefore: session.scoreBefore, levelBefore: levelForScore(session.scoreBefore),
      scoreAfter: session.scoreAfter, levelAfter: levelForScore(session.scoreAfter),
    });
    for (const r of session.reviews) {
      const { grade, confidence } = ratingToGrade(r.rating);
      plan.reviews.push({
        studentId, cardId: r.cardId, questionId: questionByCard.get(r.cardId)!, studyDayId,
        response: ["again", "hard", "good", "easy"][r.rating - 1], grade, confidence, rating: r.rating,
        gradedBy: "code", fsrsLog: r.log, reviewedAt: r.at, createdAt: r.at,
      });
      reviewed++;
    }
  });
  say("out", dayStart, `Day ${dayNumber}: today's topics are ${worked.map((w) => topicRows[w.topicIndex].name).join(", ")}. Reply "go" when you're ready.`);
  say("in", new Date(dayStart.getTime() + 2 * MINUTE), "go");
  say("out", closedAt, `Nice work on day ${dayNumber}! You reviewed ${reviewed} cards across ${worked.length} topics.`);
}

// The app stores a topic's score each time its cards change, and fills quiet days with the end-of-day score.
results.forEach((r, i) => {
  const topicId = topicRows[i].id;
  for (const date of [...pastDates]) {
    const upTo = r.sessions.filter((s) => s.date <= date);
    const latest = upTo.at(-1);
    const state = (latest?.cards ?? cardRows.filter((c) => c.topicId === topicId).map(() => newCard(createdAt))).map<ScorableCard>(
      (card) => ({ ...fsrsColumns(card), suspended: false }),
    );
    const at = latest?.date === date ? latest.end : endOfLocalDay(date, TIMEZONE);
    plan.confidence.push({ topicId, date, score: date === firstDate && !latest ? 0 : topicScore(state, at) });
  }
  plan.confidence.push({ topicId, date: today, score: topicScore(r.finalCards.map<ScorableCard>((card) => ({ ...fsrsColumns(card), suspended: false })), now) });
});

// Today: the day is open with the five lowest-confidence topics suggested, and nothing reviewed yet.
const todayScore = new Map(plan.confidence.filter((c) => c.date === today).map((c) => [c.topicId, c.score]));
const suggested = pickSuggested(
  topicRows.map((t) => ({ ...t, confidenceScore: todayScore.get(t.id)!, lastStudiedAt: t.lastStudiedAt ?? null, createdAt: t.createdAt! })),
);
const todayId = randomUUID();
const todayStart = new Date(Math.max(now.getTime() - 5 * MINUTE, endOfLocalDay(addDays(today, -1), TIMEZONE).getTime() + 1));
plan.studyDays.push({ id: todayId, studentId, dayNumber: dayNumber + 1, status: "open", startedAt: todayStart });
suggested.forEach((t, k) =>
  plan.studyDayTopics.push({
    studyDayId: todayId, topicId: t.id, position: k + 1, scoreBefore: t.confidenceScore, levelBefore: levelForScore(t.confidenceScore),
  }),
);
say("out", todayStart, `Day ${dayNumber + 1}: today's topics are ${suggested.map((t) => t.name).join(", ")}. Reply "go" when you're ready.`);

plan.student.currentDay = dayNumber + 1;
plan.student.lastInboundAt = plan.messages.findLast((m) => m.direction === "in")?.createdAt as Date;

await run(plan, now);
