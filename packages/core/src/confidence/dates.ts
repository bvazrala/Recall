// Student-local calendar dates as "YYYY-MM-DD" strings. No date library: Intl knows the time zones.

const DAY_MS = 24 * 60 * 60 * 1000;

function parts(at: Date, timeZone: string) {
  const out: Record<string, number> = {};
  for (const p of new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  }).formatToParts(at)) {
    if (p.type !== "literal") out[p.type] = Number(p.value);
  }
  return out;
}

const pad = (n: number, width = 2) => String(n).padStart(width, "0");

export function localDate(at: Date, timeZone: string): string {
  const p = parts(at, timeZone);
  return `${pad(p.year, 4)}-${pad(p.month)}-${pad(p.day)}`;
}

function toUtcMs(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function fromUtcMs(ms: number): string {
  const d = new Date(ms);
  return `${pad(d.getUTCFullYear(), 4)}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function addDays(date: string, days: number): string {
  return fromUtcMs(toUtcMs(date) + days * DAY_MS);
}

// Every date from `from` to `to`, inclusive. Empty when `from` is after `to`.
export function datesBetween(from: string, to: string): string[] {
  const out: string[] = [];
  for (let ms = toUtcMs(from); ms <= toUtcMs(to); ms += DAY_MS) out.push(fromUtcMs(ms));
  return out;
}

// How far the zone's wall clock is ahead of UTC at this instant.
function offsetMs(at: Date, timeZone: string): number {
  const p = parts(at, timeZone);
  const wall = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return wall - Math.floor(at.getTime() / 1000) * 1000;
}

// The instant a local date begins. The second pass handles days where the offset changes (daylight saving).
export function startOfLocalDay(date: string, timeZone: string): Date {
  const wall = toUtcMs(date);
  let instant = wall - offsetMs(new Date(wall), timeZone);
  instant = wall - offsetMs(new Date(instant), timeZone);
  return new Date(instant);
}

// The last millisecond of a local date.
export function endOfLocalDay(date: string, timeZone: string): Date {
  return new Date(startOfLocalDay(addDays(date, 1), timeZone).getTime() - 1);
}
