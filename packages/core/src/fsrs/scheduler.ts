import { createEmptyCard, fsrs, generatorParameters, type Card, type ReviewLog } from "ts-fsrs";
import type { FsrsRating } from "./rating";

export type { Card, ReviewLog };

export interface ScheduleSettings {
  retention: number;       // desired retention, e.g. 0.9 = aim to remember 90%
  maxIntervalDays: number; // longest allowed gap; the exam ramp lowers this
}

export const DEFAULT_SETTINGS: ScheduleSettings = { retention: 0.9, maxIntervalDays: 36500 };

const DAY_MS = 24 * 60 * 60 * 1000;

function scheduler(settings: ScheduleSettings) {
  return fsrs(
    generatorParameters({
      request_retention: settings.retention,
      maximum_interval: settings.maxIntervalDays,
      enable_short_term: false, // one text a day, so no same-day relearning steps
      enable_fuzz: false,       // same answer, same date: predictable for tests and demos
    }),
  );
}

export function newCard(now: Date): Card {
  return createEmptyCard(now);
}

// Returns the updated card plus a log entry. Keep the log: disputes undo reviews with it.
export function reviewCard(
  card: Card,
  rating: FsrsRating,
  now: Date,
  settings: ScheduleSettings = DEFAULT_SETTINGS,
): { card: Card; log: ReviewLog } {
  const result = scheduler(settings).next(card, now, rating);
  const latest = new Date(now.getTime() + settings.maxIntervalDays * DAY_MS);

  // ts-fsrs keeps Hard < Good < Easy even when that passes the cap, so enforce the cap here.
  if (result.card.due.getTime() > latest.getTime()) {
    return { log: result.log, card: { ...result.card, due: latest, scheduled_days: settings.maxIntervalDays } };
  }
  return result;
}

// Estimated chance the student remembers this card right now (0 to 1). Powers the dashboard.
export function retrievability(card: Card, now: Date): number {
  return scheduler(DEFAULT_SETTINGS).get_retrievability(card, now, false);
}
