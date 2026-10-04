"use client";

import { useCallback, useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4111";

// Until sign-in is wired, the web app acts as one student chosen by env var.
export const STUDENT_ID = process.env.NEXT_PUBLIC_STUDENT_ID ?? "";

// Thin wrapper for calling the Mastra server. Custom routes live at the server root (e.g. /status),
// Mastra's built-in endpoints under /api.
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    cache: "no-store",
    ...init,
    headers: init?.body ? { "Content-Type": "application/json", ...init.headers } : init?.headers,
  });
  if (!res.ok) throw new Error(`${init?.method ?? "GET"} ${path} failed: ${res.status}`);
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

export const forStudent = (suffix = "") => {
  if (!STUDENT_ID) throw new Error("NEXT_PUBLIC_STUDENT_ID is not set (see apps/web/.env.example)");
  return `/students/${STUDENT_ID}${suffix}`;
};

type State<T> = { data?: T; error?: Error; loading: boolean };

// Loads once on mount; `reload` fetches again. `load` should be stable (module-level or useCallback).
export function useLoad<T>(load: () => Promise<T>) {
  const [state, setState] = useState<State<T>>({ loading: true });
  const run = useCallback(() => {
    let live = true;
    load().then(
      (data) => live && setState({ data, loading: false }),
      (error: Error) => live && setState((s) => ({ ...s, error, loading: false })),
    );
    return () => void (live = false);
  }, [load]);
  useEffect(() => run(), [run]);
  return { ...state, reload: run };
}
