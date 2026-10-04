import { describe, expect, it } from "vitest";
import { Rating, newCard, reviewCard } from "../fsrs";
import type { FsrsCardRow } from "../fsrs";
import { backfillRows, missingDates, topicScore, type ScorableCard } from "./score";

const start = new Date("2026-10-01T12:00:00Z");
const daysAfter = (d: number) => new Date(start.getTime() + d * 24 * 60 * 60 * 1000);

function row(card: ReturnType<typeof newCard>, suspended = false): ScorableCard {
  const { due, stability, difficulty, elapsed_days, scheduled_days, learning_steps, reps, lapses, state, last_review } = card;
  const r: FsrsCardRow = { due, stability, difficulty, elapsed_days, scheduled_days, learning_steps, reps, lapses, state, last_review: last_review ?? null };
  return { ...r, suspended };
}

const fresh = () => row(newCard(start));
const reviewed = (rating: 1 | 2 | 3 | 4 = Rating.Good) => row(reviewCard(newCard(start), rating, start).card);

describe("topicScore", () => {
  it("is 0 for a topic with no cards", () => {
    expect(topicScore([], start)).toBe(0);
  });

  it("is 0 when no card has been reviewed", () => {
    expect(topicScore([fresh(), fresh()], start)).toBe(0);
  });

  it("is high right after a review and falls as days pass", () => {
    const cards = [reviewed()];
    const now = topicScore(cards, start);
    const later = topicScore(cards, daysAfter(30));
    expect(now).toBeGreaterThanOrEqual(95);
    expect(later).toBeLessThan(now);
  });

  it("decays more slowly for cards reviewed to a higher stability", () => {
    const easy = [reviewed(Rating.Easy)];
    const hard = [reviewed(Rating.Hard)];
    expect(topicScore(easy, daysAfter(10))).toBeGreaterThan(topicScore(hard, daysAfter(10)));
  });

  it("counts never-reviewed cards as zero, pulling the topic down", () => {
    const alone = topicScore([reviewed()], start);
    const withNew = topicScore([reviewed(), fresh(), fresh()], start);
    expect(withNew).toBeLessThan(alone);
    expect(withNew).toBeGreaterThan(0);
  });

  it("weights stable cards more than fragile ones", () => {
    const stable = reviewed(Rating.Easy);
    const fragile = row({ ...reviewCard(newCard(start), Rating.Again, start).card });
    const at = daysAfter(5);
    const mixed = topicScore([stable, fragile], at);
    const mean = (topicScore([stable], at) + topicScore([fragile], at)) / 2;
    // The stable card has the larger weight, so the mix sits nearer to it than the plain mean does.
    expect(mixed).toBeGreaterThanOrEqual(Math.round(mean));
  });

  it("ignores suspended cards", () => {
    expect(topicScore([reviewed(), row(newCard(start), true)], start)).toBe(topicScore([reviewed()], start));
    expect(topicScore([row(newCard(start), true)], start)).toBe(0);
  });

  it("stays within 0-100 even if the clock reads earlier than the last review", () => {
    const s = topicScore([reviewed()], daysAfter(-3));
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(100);
  });
});

describe("missingDates", () => {
  it("fills the days between the last row and today, excluding both ends", () => {
    expect(missingDates("2026-09-28", "2026-10-02")).toEqual(["2026-09-29", "2026-09-30", "2026-10-01"]);
  });

  it("has nothing to fill when the last row is today or yesterday", () => {
    expect(missingDates("2026-10-02", "2026-10-02")).toEqual([]);
    expect(missingDates("2026-10-01", "2026-10-02")).toEqual([]);
  });

  it("has nothing to fill for a topic with no rows yet", () => {
    expect(missingDates(null, "2026-10-02")).toEqual([]);
  });

  it("keeps only the most recent days when the gap is huge", () => {
    const dates = missingDates("2020-01-01", "2026-10-02", 5);
    expect(dates).toHaveLength(5);
    expect(dates.at(-1)).toBe("2026-10-01");
  });
});

describe("backfillRows", () => {
  it("produces a falling series for an untouched topic", () => {
    const rows = backfillRows([reviewed()], "2026-10-01", "2026-10-10", "UTC");
    expect(rows.map((r) => r.date)).toEqual([
      "2026-10-02", "2026-10-03", "2026-10-04", "2026-10-05",
      "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09",
    ]);
    const scores = rows.map((r) => r.score);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
    expect(scores[0]).toBeGreaterThan(scores.at(-1)!);
  });

  it("is deterministic", () => {
    const cards = [reviewed()];
    expect(backfillRows(cards, "2026-10-01", "2026-10-08", "UTC")).toEqual(backfillRows(cards, "2026-10-01", "2026-10-08", "UTC"));
  });
});
