"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ClipboardList, Home as HomeIcon, Layers, Settings as Cog, X } from "lucide-react";
import { Avatar, Wordmark } from "@/components/ui";
import { DayProvider, useDay } from "@/components/day-context";
import { DrawerProvider, ICON, cx } from "@/lib/nav";
import { cardCount } from "@/lib/day-data";
import { USER } from "@/lib/mock";

const NAV = [
  { href: "/home", label: "Home", icon: HomeIcon, match: ["/home"] },
  { href: "/classes", label: "My Classes", icon: BookOpen, match: ["/classes"] },
  { href: "/quizzes", label: "Quizzes", icon: ClipboardList, match: ["/quizzes"], badge: 1 }, // mock until quiz routes exist
  { href: "/flashcards", label: "Flashcards", icon: Layers, match: ["/flashcards"] },
  { href: "/settings", label: "Settings", icon: Cog, match: ["/settings"] },
] as const;

function NavList() {
  const path = usePathname();
  const { data } = useDay();
  return (
    <ul className="space-y-1">
      {NAV.map((n) => {
        const active = n.match.some((m) => path === m || path.startsWith(`${m}/`));
        const badge = n.href === "/flashcards" ? (data ? cardCount(data) : 0) : "badge" in n ? n.badge : 0;
        return (
          <li key={n.href}>
            <Link href={n.href} aria-current={active ? "page" : undefined} className="w-full h-12 flex items-center gap-3 px-3 rounded-ctl text-[16px] active:bg-ink/5 hover:bg-ink/[0.03]">
              <n.icon {...ICON} />
              <span className={cx("px-1 -mx-1 rounded-chip", active && "marker font-semibold")}>{n.label}</span>
              {badge > 0 && <span className="ml-auto mono text-[12px] min-w-6 h-6 px-1.5 grid place-items-center rounded-chip border border-line">{badge}</span>}
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
    <div className="flex items-center gap-3 pt-4 border-t border-line">
      <Avatar size={40} />
      <div>
        <div className="text-[15px] font-medium">{USER.name}</div>
        {data && <div className="mono text-[13px] text-ink-muted">Day {data.day.number}</div>}
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
          <aside className="hidden lg:flex flex-col sticky top-0 h-screen border-r border-line px-4 py-6">
            <div className="px-3 mb-8"><Wordmark /></div>
            <NavList />
            <div className="mt-auto"><Footer /></div>
          </aside>
          <div className="min-w-0">{children}</div>
        </div>

        <div className={cx("fixed inset-0 z-40 lg:hidden transition-opacity duration-200 ease-out", drawer ? "opacity-100" : "opacity-0 pointer-events-none")} aria-hidden={!drawer}>
          <div className="absolute inset-0 bg-ink/40" onClick={() => setDrawer(false)} />
          <nav className={cx("absolute left-0 top-0 bottom-0 w-[300px] bg-paper border-r border-line flex flex-col px-4 pt-[max(48px,calc(env(safe-area-inset-top)-6px))] pb-[max(20px,env(safe-area-inset-bottom))] transition-transform duration-200 ease-out", drawer ? "translate-x-0" : "-translate-x-full")} aria-label="Main">
            <div className="safe-row flex items-center justify-between px-3">
              <Wordmark />
              <button aria-label="Close menu" onClick={() => setDrawer(false)} className="size-11 grid place-items-center -mr-2.5"><X {...ICON} /></button>
            </div>
            <div className="mt-4"><NavList /></div>
            <div className="mt-auto"><Footer /></div>
          </nav>
        </div>
      </DrawerProvider>
    </DayProvider>
  );
}
