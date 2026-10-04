import type { ConfidenceGrid, HistoryResponse } from "./types";
import type { DayState } from "./nav";

// Study days are numbered, not calendar days. The streak is the run of closed days ending at the latest
// closed day; today's open day neither extends nor breaks it until it is closed.
export function streakOf(h: HistoryResponse): { current: number; longest: number } {
  let longest = 0;
  let run = 0;
  for (const d of h.days) {
    if (d.status === "open") continue;
    run += 1;
    longest = Math.max(longest, run);
  }
  return { current: run, longest };
}

// The last 7 study days as a week strip, ending with the open day (today).
export function weekStrip(h: HistoryResponse): DayState[] {
  const last = h.days.slice(-7).map((d): DayState => (d.status === "closed" ? "done" : "today"));
  return [...Array<DayState>(7 - last.length).fill("future"), ...last];
}

// Mean confidence across topics for each date; null before any topic existed.
export function retentionSeries(g: ConfidenceGrid): (number | null)[] {
  return g.dates.map((_, i) => {
    const cells = g.topics.map((t) => t.cells[i]).filter((c) => c !== null);
    return cells.length ? Math.round(cells.reduce((s, c) => s + c.score, 0) / cells.length) : null;
  });
}
