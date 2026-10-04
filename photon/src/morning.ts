// Demo day counter: texting this closes the student's current day and sends the next day's morning message.
export const NEXT_DAY_KEYWORD = "next day";

const API_URL = process.env.API_URL ?? "http://localhost:4111";

type Level = "red" | "yellow" | "green" | "star";

// The DayTopic shape the Recall server returns.
export interface DayTopic {
  topicId: string;
  name: string;
  position: number;
  levelNow: Level;
  scoreNow: number;
}

export interface NextDay {
  number: number;
  topics: DayTopic[];
}

// Thrown when another request closed this day first (two "next day" texts at once).
export class AlreadyAdvancedError extends Error {}

const LEVEL_EMOJI: Record<Level, string> = { red: "🔴", yellow: "🟡", green: "🟢", star: "⭐" };

export function isNextDayRequest(text: string): boolean {
  return text.trim().toLowerCase() === NEXT_DAY_KEYWORD;
}

// The server accepts the phone as the student id; digits only keeps the URL clean.
const studentPath = (handle: string) => `${API_URL}/students/${handle.replace(/\D/g, "")}`;

// Opens today if needed, then closes it. The server opens the next day and returns its topics.
export async function startNextDay(handle: string): Promise<NextDay> {
  const dayRes = await fetch(`${studentPath(handle)}/day`);
  if (!dayRes.ok) throw new Error(`GET day failed: ${dayRes.status} ${await dayRes.text()}`);
  const { day } = (await dayRes.json()) as { day: { number: number } };

  // Sending dayNumber makes a racing request fail with 409 instead of closing the day after.
  const closeRes = await fetch(`${studentPath(handle)}/day/close`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ dayNumber: day.number }),
  });
  if (closeRes.status === 409) throw new AlreadyAdvancedError(await closeRes.text());
  if (!closeRes.ok) throw new Error(`close day failed: ${closeRes.status} ${await closeRes.text()}`);
  const { next } = (await closeRes.json()) as { next: NextDay };
  return next;
}

export function formatMorning(day: NextDay): string {
  if (day.topics.length === 0) {
    return `Good morning! Day ${day.number}. No topics yet. Add some to get started.`;
  }
  const list = day.topics.map((t, i) => `${i + 1}. ${LEVEL_EMOJI[t.levelNow] ?? ""} ${t.name}`).join("\n");
  return `Good morning! Day ${day.number}. Today's ${day.topics.length} topics:\n${list}`;
}
