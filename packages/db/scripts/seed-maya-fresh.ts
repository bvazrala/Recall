// Maya on day one, before she has studied anything: every card is new, so her whole confidence grid is red.
import { localDate, newCard, topicScore } from "../../core/src";
import { curriculum, MAYA_ID, mayaRow, MAYA_PHONE, run, TIMEZONE, type Plan } from "./seed/lib";

const now = new Date();
const studentId = MAYA_ID;
const { topicRows, cardRows, questionRows } = curriculum(studentId, now, newCard);

const plan: Plan = {
  student: mayaRow(studentId, now, 1),
  topics: topicRows,
  cards: cardRows,
  questions: questionRows,
  studyDays: [],
  studyDayTopics: [],
  reviews: [],
  // Creating a topic records today's score for it. Nothing is reviewed, so it is 0.
  confidence: topicRows.map((t) => ({ topicId: t.id, date: localDate(now, TIMEZONE), score: topicScore([], now) })),
  messages: [
    {
      studentId, direction: "out", kind: "text", providerMessageId: `seed-${MAYA_PHONE}-1`, createdAt: now,
      body: "Hi Maya! I'm Recall. I've set up 24 MCAT topics for you, 15 flashcards each. Text me when you're ready to start day 1.",
    },
  ],
};

await run(plan, now);
