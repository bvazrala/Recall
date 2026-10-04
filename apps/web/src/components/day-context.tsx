"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useLoad } from "@/lib/api";
import { loadDay, type DayData } from "@/lib/day-data";

type Ctx = { data?: DayData; error?: Error; loading: boolean; reload: () => void };
const DayCtx = createContext<Ctx>({ loading: true, reload: () => {} });
export const useDay = () => useContext(DayCtx);

export function DayProvider({ children }: { children: ReactNode }) {
  const { data, error, loading, reload } = useLoad(loadDay);
  return <DayCtx.Provider value={{ data, error, loading, reload }}>{children}</DayCtx.Provider>;
}
