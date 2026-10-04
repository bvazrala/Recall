"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { AppBar, Button, IconBtn, Label, Page, StreakStrip, Title } from "@/components/ui";
import { LoadError, Loading } from "@/components/load-state";
import { api, forStudent, useLoad } from "@/lib/api";
import { loadDay } from "@/lib/day-data";
import { ICON, cx, useNav } from "@/lib/nav";
import { streakOf, weekStrip } from "@/lib/stats";
import type { Flashcard, HistoryResponse, Rating } from "@/lib/types";

type QueueCard = Flashcard & { topic: string };

// Optional ?topic=<id> narrows the session to one topic.
async function loadQueue(): Promise<QueueCard[]> {
  const only = new URLSearchParams(window.location.search).get("topic");
  const day = await loadDay();
  return day.topics
    .filter((t) => !only || t.topicId === only)
    .flatMap((t) => (day.cards[t.topicId] ?? []).map((c) => ({ ...c, topic: t.name })))
    .sort((a, b) => a.due.localeCompare(b.due));
}

// Self-rating buttons -> FSRS ratings (1 Again, 3 Good, 4 Easy).
const RATINGS: { label: string; rating: Rating; cls: string }[] = [
  { label: "Don’t know", rating: 1, cls: "bg-accent text-surface" },
  { label: "Kinda", rating: 3, cls: "bg-marker text-ink" },
  { label: "Know it", rating: 4, cls: "bg-good text-surface" },
];

export function Study() {
  const { go } = useNav();
  const { data: queue, error, loading } = useLoad(loadQueue);
  const [i, setI] = useState(0);
  const [flip, setFlip] = useState<"front" | "out" | "back">("front");
  const [leaving, setLeaving] = useState(false);
  const [failed, setFailed] = useState<string>();
  const [given, setGiven] = useState<Rating[]>([]);
  const busy = useRef(false);

  const total = queue?.length ?? 0;
  const done = !!queue && total > 0 && i >= total;
  const back = flip === "back";
  const card = queue?.[i];

  const doFlip = () => {
    if (flip !== "front" || !card) return;
    setFlip("out");
    setTimeout(() => setFlip("back"), 150);
  };

  const rate = async (rating: Rating) => {
    if (!card || !back || busy.current) return;
    busy.current = true;
    setFailed(undefined);
    setLeaving(true);
    try {
      // Run the leave animation and the request together; advance only once the server has the review.
      await Promise.all([
        api(`/flashcards/${card.id}/review`, { method: "POST", body: JSON.stringify({ rating }) }),
        new Promise((r) => setTimeout(r, 200)),
      ]);
      setGiven((g) => [...g, rating]);
      setFlip("front");
      setI((n) => n + 1);
    } catch (e) {
      setFailed((e as Error).message);
    } finally {
      setLeaving(false);
      busy.current = false;
    }
  };

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.code === "Space") { e.preventDefault(); doFlip(); }
      const r = RATINGS[Number(e.key) - 1];
      if (r && back) void rate(r.rating);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });

  if (error) return <div className="px-5 pt-12 max-w-[640px] mx-auto"><LoadError error={error} /></div>;
  if (loading || !queue) return <div className="px-5 pt-12 max-w-[640px] mx-auto"><Loading className="h-[460px]" /></div>;
  if (total === 0) return <Empty onHome={() => go("home")} />;
  if (done) return <Complete given={given} />;

  const n = i + 1;
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 bg-paper safe-top">
        <div className="safe-row px-5 flex items-center max-w-[640px] mx-auto">
          <IconBtn label="End session" onClick={() => go("home")}><X {...ICON} /></IconBtn>
          <span className="flex-1 text-center mono text-[14px]">{n} of {total}</span>
          <span className="w-6" />
        </div>
        <div className="h-0.5 bg-ink/10"><div className="h-full bg-ink transition-[width] duration-250" style={{ width: `${((n - 1) / total) * 100}%` }} /></div>
      </header>
      <main className="flex-1 px-5 pt-8 pb-10 max-w-[640px] w-full mx-auto flex flex-col">
        <div className="relative mx-auto w-full max-w-[353px]">
          <span className="absolute inset-0 translate-x-2 translate-y-2 rotate-[1.5deg] bg-surface border border-line rounded-card" aria-hidden />
          <span className="absolute inset-0 translate-x-1 translate-y-1 rotate-[-0.8deg] bg-surface border border-line rounded-card" aria-hidden />
          <button
            key={card!.id}
            onClick={doFlip}
            aria-label={back ? "Answer side" : "Flip card"}
            className={cx(
              "relative w-full h-[min(460px,58vh)] bg-surface rounded-card border border-line shadow-card text-left overflow-hidden transition-transform ease-out duration-150 motion-reduce:transition-opacity",
              flip === "out" && "scale-x-0 ease-in",
              leaving && "anim-slideout",
            )}
          >
            <div className="absolute inset-x-0 top-[15%] h-[1.5px] bg-accent" />
            <div className="absolute left-5 top-[15%] -translate-y-1/2"><span className="bg-surface border border-accent/40 rounded-chip px-2 h-6 inline-flex items-center text-[12px] font-medium max-w-[280px] truncate">{card!.topic}</span></div>
            <div className="absolute inset-x-0 top-[calc(15%+1.5px)] bottom-0 ruled" />
            <div className="absolute inset-x-0 top-[15%] bottom-0 flex flex-col justify-center px-7">
              {!back ? (
                <p className="font-serif font-medium text-[26px] leading-[34px] text-center">{card!.question}</p>
              ) : (
                <div>
                  <Label>Answer</Label>
                  <p className="font-serif font-medium text-[22px] leading-[30px] mt-2">{card!.answer}</p>
                </div>
              )}
            </div>
          </button>
        </div>

        <div className="mt-auto pt-8">
          {failed && <p role="alert" className="text-center text-[14px] text-accent-text mb-3">Couldn&apos;t save that rating ({failed}). Try again.</p>}
          {!back ? (
            <>
              {i === 0 && <p className="text-center text-[14px] text-ink-muted mb-3">Tap the card to flip</p>}
              <Button variant="secondary" full onClick={doFlip}>Show answer</Button>
            </>
          ) : (
            <div className="grid grid-cols-3 gap-2 anim-in">
              {RATINGS.map((r, k) => (
                <button key={r.label} disabled={leaving} onClick={() => void rate(r.rating)} className={cx("h-16 rounded-ctl flex flex-col items-center justify-center active:scale-[0.97] transition-transform duration-150 disabled:opacity-60", r.cls)}>
                  <span className="text-[16px] font-semibold leading-5">{r.label}</span>
                  <span className="sr-only">Key {k + 1}</span>
                </button>
              ))}
            </div>
          )}
          <p className="hidden lg:block text-center mono text-[12px] text-ink-muted mt-4">Space flip · 1 / 2 / 3</p>
        </div>
      </main>
    </div>
  );
}

function Empty({ onHome }: { onHome: () => void }) {
  return (
    <>
      <AppBar onClose={onHome} title={<span />} right={<span className="w-6" />} />
      <Page>
        <Title>Nothing to study yet.</Title>
        <p className="text-[16px] text-ink-muted mt-3">Today&apos;s topics have no flashcards. Add some and they&apos;ll show up here.</p>
        <Button full className="mt-8" onClick={onHome}>Back to home</Button>
      </Page>
    </>
  );
}

const loadHistory = () => api<HistoryResponse>(forStudent("/history"));

function Complete({ given }: { given: Rating[] }) {
  const { go } = useNav();
  const { data: history } = useLoad(loadHistory);
  const count = (r: Rating) => given.filter((g) => g === r).length;
  const parts = [["Know it", count(4), "bg-good"], ["Kinda", count(3), "bg-marker"], ["Don’t know", count(1), "bg-accent"]] as const;
  return (
    <>
      <AppBar onClose={() => go("home")} title={<span />} right={<span className="w-6" />} />
      <Page>
        <Title className="text-[36px] leading-10">That&apos;s today&apos;s cards.</Title>
        <p className="mono text-[14px] text-ink-muted mt-2">{given.length} reviewed</p>
        <div className="mt-8 flex h-3 rounded-chip overflow-hidden gap-0.5">{parts.map(([l, n, c]) => n > 0 && <span key={l} className={c} style={{ flex: n }} />)}</div>
        <ul className="mt-3 flex gap-5 text-[14px]">{parts.map(([l, n, c]) => <li key={l} className="flex items-center gap-1.5"><span className={cx("size-2.5 rounded-[2px]", c)} />{l} <span className="mono">{n}</span></li>)}</ul>
        {history && (
          <div className="mt-10 pt-6 border-t border-line">
            <div className="flex items-baseline gap-2"><span className="font-serif font-medium text-[48px] leading-none">{streakOf(history).current}</span><span>day streak</span></div>
            <div className="mt-4"><StreakStrip days={weekStrip(history)} /></div>
          </div>
        )}
        <p className="text-[16px] mt-8">Next cards: tomorrow.</p>
        <div className="mt-6 flex flex-col gap-1">
          <Button full onClick={() => go("home")}>Back to home</Button>
          <Button variant="text" onClick={() => go("question")}>Take today&apos;s quiz</Button>
        </div>
      </Page>
    </>
  );
}
