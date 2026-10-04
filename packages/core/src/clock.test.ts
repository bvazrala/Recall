import { describe, expect, it } from "vitest";
import { nowFor } from "./clock";

describe("nowFor", () => {
  const real = new Date("2026-10-03T22:00:00Z");

  it("returns real time when there is no offset", () => {
    expect(nowFor(0, real)).toEqual(real);
  });

  it("moves time forward for the demo fast-forward", () => {
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    expect(nowFor(threeDays, real).toISOString()).toBe("2026-10-06T22:00:00.000Z");
  });
});
