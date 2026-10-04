"use client";

import { createContext, useCallback, useContext } from "react";
import { useRouter } from "next/navigation";

// The design navigates by screen name; each name maps to a real route.
export const ROUTES = {
  landing: "/",
  signup: "/signup",
  login: "/login",
  home: "/home",
  "home-empty": "/home",
  classes: "/classes",
  "add-class": "/classes/new",
  processing: "/classes/new/processing",
  confirm: "/classes/new/confirm",
  class: "/classes/biol-2210",
  topic: "/classes/biol-2210/glycolysis",
  quizzes: "/quizzes",
  question: "/quizzes/take",
  results: "/quizzes/results",
  "past-quiz": "/quizzes/review",
  flashcards: "/flashcards",
  study: "/flashcards/study",
  settings: "/settings",
} as const;

export type Screen = keyof typeof ROUTES;

const DrawerCtx = createContext<{ openDrawer: () => void }>({ openDrawer: () => {} });
export const DrawerProvider = DrawerCtx.Provider;

export function useNav() {
  const router = useRouter();
  const { openDrawer } = useContext(DrawerCtx);
  const go = useCallback((s: Screen) => router.push(ROUTES[s]), [router]);
  return { go, openDrawer };
}

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
export const ICON = { size: 20, strokeWidth: 2 };

export type DayState = "done" | "missed" | "today" | "future";
