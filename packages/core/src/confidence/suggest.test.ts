import { describe, expect, it } from "vitest";
import { pickSuggested } from "./suggest";

const day = (d: number) => new Date(Date.UTC(2026, 9, d));
const topic = (name: string, confidenceScore: number, lastStudiedAt: Date | null = null, createdAt = day(1)) => ({
  name,
  confidenceScore,
  lastStudiedAt,
  createdAt,
});

describe("pickSuggested", () => {
  it("returns the lowest-confidence topics first, capped at 5", () => {
    const topics = [10, 90, 30, 60, 20, 80, 5].map((s) => topic(`t${s}`, s));
    expect(pickSuggested(topics).map((t) => t.name)).toEqual(["t5", "t10", "t20", "t30", "t60"]);
  });

  it("returns everything when there are fewer than 5", () => {
    expect(pickSuggested([topic("a", 50), topic("b", 10)]).map((t) => t.name)).toEqual(["b", "a"]);
  });

  it("breaks ties by least recently studied, never-studied first", () => {
    const topics = [topic("recent", 10, day(5)), topic("old", 10, day(2)), topic("never", 10, null)];
    expect(pickSuggested(topics).map((t) => t.name)).toEqual(["never", "old", "recent"]);
  });

  it("breaks remaining ties by creation date", () => {
    const topics = [topic("new", 10, null, day(9)), topic("first", 10, null, day(1))];
    expect(pickSuggested(topics).map((t) => t.name)).toEqual(["first", "new"]);
  });

  it("does not mutate the input", () => {
    const topics = [topic("b", 20), topic("a", 10)];
    pickSuggested(topics);
    expect(topics.map((t) => t.name)).toEqual(["b", "a"]);
  });
});
