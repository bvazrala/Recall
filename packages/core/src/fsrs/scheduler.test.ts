import { describe, expect, it } from "vitest";
import { Rating } from "./rating";
import { newCard, retrievability, reviewCard } from "./scheduler";

const DAY = 24 * 60 * 60 * 1000;
const now = new Date("2026-10-03T22:00:00Z");
const daysAfter = (start: Date, due: Date) => (due.getTime() - start.getTime()) / DAY;

describe("reviewCard", () => {
  it("brings a missed card back the next day, not minutes later", () => {
    const { card } = reviewCard(newCard(now), Rating.Again, now);
    expect(daysAfter(now, card.due)).toBeGreaterThanOrEqual(1);
  });

  it("waits longer after better ratings", () => {
    const again = reviewCard(newCard(now), Rating.Again, now).card.due;
    const good = reviewCard(newCard(now), Rating.Good, now).card.due;
    const easy = reviewCard(newCard(now), Rating.Easy, now).card.due;
    expect(daysAfter(now, again)).toBeLessThanOrEqual(daysAfter(now, good));
    expect(daysAfter(now, good)).toBeLessThan(daysAfter(now, easy));
  });

  it("never schedules past the max interval (the exam cap)", () => {
    const capped = { retention: 0.9, maxIntervalDays: 3 };
    let card = newCard(now);
    let when = now;
    for (let i = 0; i < 5; i++) {
      card = reviewCard(card, Rating.Easy, when, capped).card;
      expect(daysAfter(when, card.due)).toBeLessThanOrEqual(3);
      when = card.due;
    }
  });

  it("records the rating in the review log", () => {
    const { log } = reviewCard(newCard(now), Rating.Good, now);
    expect(log.rating).toBe(Rating.Good);
  });
});

describe("retrievability", () => {
  it("drops as time passes after a review", () => {
    const { card } = reviewCard(newCard(now), Rating.Good, now);
    const dayAfter = retrievability(card, new Date(now.getTime() + DAY));
    const tenDaysAfter = retrievability(card, new Date(now.getTime() + 10 * DAY));
    expect(dayAfter).toBeLessThanOrEqual(1);
    expect(dayAfter).toBeGreaterThan(tenDaysAfter);
    expect(tenDaysAfter).toBeGreaterThan(0);
  });
});
