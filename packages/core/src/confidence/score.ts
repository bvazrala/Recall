import { cardFromRow, retrievability, type FsrsCardRow } from "../fsrs";
import { addDays, datesBetween, endOfLocalDay } from "./dates";

export type ScorableCard = FsrsCardRow & { suspended: boolean };

// Weight of a card in its topic's score. Floored so a never-reviewed card (stability 0) still counts, as a zero.
export const MIN_WEIGHT = 1;

// How far back the lazy backfill goes. A student away longer than this gets a gap, not a year of identical rows.
export const MAX_BACKFILL_DAYS = 365;

// Topic confidence (0-100) at one moment: the stability-weighted mean of its cards' recall chance.
// Cards that have never been reviewed count as 0, and a topic with no cards scores 0.
export function topicScore(cards: ScorableCard[], at: Date): number {
  let weighted = 0;
  let total = 0;
  for (const row of cards) {
    if (row.suspended) continue;
    const weight = Math.max(row.stability, MIN_WEIGHT);
    const recall = row.state === 0 ? 0 : Math.min(1, Math.max(0, retrievability(cardFromRow(row), at)));
    weighted += weight * recall;
    total += weight;
  }
  return total === 0 ? 0 : Math.round((weighted / total) * 100);
}

// Dates strictly between a topic's last stored date and today that still need a row.
// A topic with no rows yet has no history to fill: it starts today.
export function missingDates(lastDate: string | null, today: string, maxDays = MAX_BACKFILL_DAYS): string[] {
  if (!lastDate) return [];
  const yesterday = addDays(today, -1);
  const dates = datesBetween(addDays(lastDate, 1), yesterday);
  return dates.slice(-maxDays);
}

// Scores for the missing past dates. Nothing changed on those days (every change writes a row),
// so each day uses the cards as they are now, judged at the end of that local day.
export function backfillRows(
  cards: ScorableCard[],
  lastDate: string | null,
  today: string,
  timeZone: string,
): { date: string; score: number }[] {
  return missingDates(lastDate, today).map((date) => ({ date, score: topicScore(cards, endOfLocalDay(date, timeZone)) }));
}
