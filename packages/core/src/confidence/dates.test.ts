import { describe, expect, it } from "vitest";
import { addDays, datesBetween, endOfLocalDay, localDate, startOfLocalDay } from "./dates";

describe("localDate", () => {
  it("uses the student's zone, not UTC", () => {
    const at = new Date("2026-10-03T02:30:00Z"); // still Oct 2 evening in Detroit (EDT, UTC-4)
    expect(localDate(at, "America/Detroit")).toBe("2026-10-02");
    expect(localDate(at, "UTC")).toBe("2026-10-03");
  });
});

describe("addDays and datesBetween", () => {
  it("crosses month and year ends", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(datesBetween("2026-09-29", "2026-10-02")).toEqual(["2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02"]);
  });

  it("is empty when from is after to", () => {
    expect(datesBetween("2026-10-03", "2026-10-02")).toEqual([]);
  });
});

describe("startOfLocalDay and endOfLocalDay", () => {
  it("bound a local day", () => {
    expect(startOfLocalDay("2026-10-02", "America/Detroit").toISOString()).toBe("2026-10-02T04:00:00.000Z");
    expect(endOfLocalDay("2026-10-02", "America/Detroit").toISOString()).toBe("2026-10-03T03:59:59.999Z");
  });

  it("handles the 23-hour spring-forward day", () => {
    const start = startOfLocalDay("2026-03-08", "America/Detroit");
    const end = endOfLocalDay("2026-03-08", "America/Detroit");
    expect(start.toISOString()).toBe("2026-03-08T05:00:00.000Z");
    expect(end.getTime() - start.getTime() + 1).toBe(23 * 60 * 60 * 1000);
  });

  it("handles the 25-hour fall-back day", () => {
    const start = startOfLocalDay("2026-11-01", "America/Detroit");
    const end = endOfLocalDay("2026-11-01", "America/Detroit");
    expect(end.getTime() - start.getTime() + 1).toBe(25 * 60 * 60 * 1000);
  });

  it("round-trips through localDate", () => {
    const tz = "Asia/Tokyo";
    expect(localDate(startOfLocalDay("2026-10-02", tz), tz)).toBe("2026-10-02");
    expect(localDate(endOfLocalDay("2026-10-02", tz), tz)).toBe("2026-10-02");
  });
});
