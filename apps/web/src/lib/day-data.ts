import { api, forStudent } from "./api";
import type { DayResponse, DayTopic, Flashcard } from "./types";

export type DayData = { day: DayResponse["day"]; topics: DayTopic[]; cards: Record<string, Flashcard[]> };

// Today's day plus the flashcards of each of its topics (the server freezes the topics on first call).
export async function loadDay(): Promise<DayData> {
  const { day, topics } = await api<DayResponse>(forStudent("/day"));
  const lists = await Promise.all(
    topics.map((t) => api<{ flashcards: Flashcard[] }>(`${forStudent("/day/flashcards")}?topicId=${t.topicId}`)),
  );
  return { day, topics, cards: Object.fromEntries(topics.map((t, i) => [t.topicId, lists[i].flashcards])) };
}

export const cardCount = (d: DayData) => Object.values(d.cards).reduce((n, c) => n + c.length, 0);

// ~50s a card, rounded up to a whole minute.
export const minutesFor = (cards: number) => Math.max(1, Math.ceil((cards * 50) / 60));

export const joinNames = (names: string[]) =>
  names.length <= 2 ? names.join(" and ") : `${names.slice(0, 2).join(", ")} and ${names.length - 2} more`;
