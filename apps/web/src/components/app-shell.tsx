"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { Avatar, Wordmark } from "@/components/ui";
import { DayProvider, useDay } from "@/components/day-context";
import { DrawerProvider, cx } from "@/lib/nav";
import { cardCount } from "@/lib/day-data";
import { USER } from "@/lib/mock";

const NAV = [
  { href: "/home", label: "Home", match: ["/home"] },
  { href: "/classes", label: "My classes", match: ["/classes"] },
  { href: "/quizzes", label: "Quizzes", match: ["/quizzes"], badge: 1 }, // mock until quiz routes exist
  { href: "/flashcards", label: "Flashcards", match: ["/flashcards"] },
  { href: "/settings", label: "Settings", match: ["/settings"] },
] as const;

// The binder's dividers. The active one is a paper tab that runs into the page, with its label highlighted.
function NavList() {
  const path = usePathname();
  const { data } = useDay();
  return (
    <ul className="flex flex-col gap-1.5">
      {NAV.map((n) => {
        const active = n.match.some((m) => path === m || path.startsWith(`${m}/`));
        const badge = n.href === "/flashcards" ? (data ? cardCount(data) : 0) : "badge" in n ? n.badge : 0;
        return (
          <li key={n.href}>
            <Link
              href={n.href}
              aria-current={active ? "page" : undefined}
              className={cx("flex min-h-12 items-center justify-between rounded-l-[10px] pr-7 pl-4 font-bold", active ? "bg-paper text-ink" : "text-[#3e3a2c] hover:bg-paper/40")}
            >
              <span className={cx(active && "highlight")}>{n.label}</span>
              {badge > 0 && <span className="font-hand text-[19px] leading-none font-normal text-pen">{badge}</span>}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function Footer() {
  const { data } = useDay();
  return (
    <div className="flex items-center gap-3 pr-5">
      <Avatar />
      <div>
        <div className="font-bold">{USER.name}</div>
        {data && <div className="text-[15px] text-[#5c5539]">Day {data.day.number}</div>}
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [drawer, setDrawer] = useState(false);
  const path = usePathname();
  useEffect(() => setDrawer(false), [path]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(false);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);

  return (
    <DayProvider>
      <DrawerProvider value={{ openDrawer: () => setDrawer(true) }}>
        <div className="lg:grid lg:grid-cols-[240px_1fr]">
          <aside className="sticky top-0 hidden h-screen flex-col gap-[30px] bg-manila pt-8 pb-7 pl-7 shadow-[inset_-2px_0_0_var(--color-manila-edge)] lg:flex">
            <Wordmark className="text-[36px]" />
            <NavList />
            <div className="mt-auto"><Footer /></div>
          </aside>
          {/* Desktop has no header, so the paper's plain band shrinks to 40px. */}
          <div className="paper flex min-h-screen min-w-0 flex-col lg:[--paper-band:40px]">{children}</div>
        </div>

        <div className={cx("fixed inset-0 z-40 lg:hidden transition-opacity duration-200 ease-out", drawer ? "opacity-100" : "opacity-0 pointer-events-none")} aria-hidden={!drawer}>
          <div className="absolute inset-0 bg-ink/40" onClick={() => setDrawer(false)} />
          <nav className={cx("safe-top absolute top-0 bottom-0 left-0 flex w-[300px] flex-col bg-manila pb-[max(28px,env(safe-area-inset-bottom))] pl-7 shadow-[inset_-2px_0_0_var(--color-manila-edge)] transition-transform duration-200 ease-out", drawer ? "translate-x-0" : "-translate-x-full")} aria-label="Main">
            <div className="safe-row flex items-center justify-between pr-2">
              <Wordmark />
              <button aria-label="Close menu" onClick={() => setDrawer(false)} className="grid size-11 place-items-center"><X size={24} strokeWidth={2} /></button>
            </div>
            <NavList />
            <div className="mt-auto"><Footer /></div>
          </nav>
        </div>
      </DrawerProvider>
    </DayProvider>
  );
}
