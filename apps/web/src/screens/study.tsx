"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { AppBar, Button, IconBtn, Label, Page, StickyNote, StreakStrip, Title } from "@/components/ui";
import { LoadError, Loading } from "@/components/load-state";
import { api, forStudent, useLoad } from "@/lib/api";
import { loadDay } from "@/lib/day-data";
import { cx, useNav } from "@/lib/nav";
import { streakOf, weekStrip } from "@/lib/stats";
import type { Flashcard, HistoryResponse, Rating, Topic } from "@/lib/types";

type QueueCard = Flashcard & { topic: string };

// With ?topic=<id>, practice every card in that topic (any topic, due or not). Otherwise, today's cards.
async function loadQueue(): Promise<{ cards: QueueCard[]; scoped: boolean }> {
  const only = new URLSearchParams(window.location.search).get("topic");
  if (only) {
    const [{ topics }, { flashcards }] = await Promise.all([
      api<{ topics: Topic[] }>(forStudent("/topics")),
      api<{ flashcards: Flashcard[] }>(`/topics/${only}/flashcards`),
    ]);
    const name = topics.find((t) => t.id === only)?.name ?? "";
    return { cards: flashcards.map((c) => ({ ...c, topic: name })), scoped: true };
  }
  const day = await loadDay();
  const cards = day.topics
    .flatMap((t) => (day.cards[t.topicId] ?? []).map((c) => ({ ...c, topic: t.name })))
    .sort((a, b) => a.due.localeCompare(b.due));
  return { cards, scoped: false };
}

// Self-rating buttons -> FSRS ratings (1 Again, 3 Good, 4 Easy).
const RATINGS: { label: string; rating: Rating }[] = [
  { label: "Don’t know", rating: 1 },
  { label: "Kinda", rating: 3 },
  { label: "Know it", rating: 4 },
];

// A blank index card, for the cards waiting under the one being studied.
const CARD = "rounded-[3px] bg-surface shadow-[0_1px_0_var(--color-line),0_8px_16px_-12px_rgba(30,63,150,0.55)]";

export function Study() {
  return (
    <div className="paper flex min-h-screen flex-col lg:[--sheet:560px]">
      <Session />
    </div>
  );
}

function Session() {
  const { go } = useNav();
  const { data, error, loading } = useLoad(loadQueue);
  const queue = data?.cards;
  const scoped = !!data?.scoped;
  const leave = () => go(scoped ? "class" : "home");
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

  if (error) return <div className="page-x pt-[100px]"><LoadError error={error} /></div>;
  if (loading || !queue) return <div className="page-x pt-[100px]"><Loading className="h-[440px]" /></div>;
  if (total === 0) return <Empty scoped={scoped} onHome={leave} />;
  if (done) return <Complete given={given} scoped={scoped} />;

  const n = i + 1;
  return (
    <>
      <header className="paper-band page-x safe-top sticky top-0 z-20">
        <div className="safe-row flex items-center gap-3">
          <IconBtn label="End session" onClick={leave}><X size={24} strokeWidth={2} /></IconBtn>
          <div className="h-1 flex-1 overflow-hidden rounded-[2px] bg-[#c6d4ea]" aria-hidden><div className="h-full rounded-[2px] bg-pen transition-[width] duration-250" style={{ width: `${((n - 1) / total) * 100}%` }} /></div>
          <p className="shrink-0 font-hand text-[17px] text-ink-muted">{n} of {total}</p>
        </div>
      </header>
      <main className="page-x flex flex-1 flex-col pb-6">
        <div className="relative mt-2 w-full">
          <span className={cx("absolute inset-0 translate-x-2 translate-y-2 rotate-[1.5deg]", CARD)} aria-hidden />
          <span className={cx("absolute inset-0 translate-x-1 translate-y-1 rotate-[-0.8deg]", CARD)} aria-hidden />
          {/* The card being studied is a literal index card: the topic on the red line, the writing on the rules. */}
          <button
            key={card!.id}
            onClick={doFlip}
            aria-label={back ? "Answer side" : "Flip card"}
            className={cx(
              "relative block h-[min(440px,54vh)] w-full overflow-hidden text-left transition-transform duration-150 ease-out motion-reduce:transition-opacity",
              CARD,
              flip === "out" && "scale-x-0 ease-in",
              leaving && "anim-slideout",
            )}
          >
            <span className="absolute inset-x-0 top-0 flex h-8 items-center px-3.5 font-hand text-[15px] text-ink-muted"><span className="truncate">{card!.topic}</span></span>
            <span className="absolute inset-x-0 top-8 h-[1.5px] bg-[#ee9a9a]" />
            <span className="ruled absolute inset-x-0 top-[33.5px] bottom-0" />
            <span className="absolute inset-x-0 top-[33.5px] bottom-0 flex flex-col justify-center px-6">
              {!back ? (
                <span className="block text-center text-[22px] leading-[1.35] font-bold">{card!.question}</span>
              ) : (
                <>
                  <Label>Answer</Label>
                  <span className="mt-2 block text-[20px] leading-[1.4]">{card!.answer}</span>
                </>
              )}
            </span>
          </button>
        </div>

        <div className="mt-auto pt-9 lg:mt-0">
          {failed && <p role="alert" className="mb-5 text-center text-[15px] text-redpen">Couldn&apos;t save that rating ({failed}). Try again.</p>}
          {!back ? (
            <>
              {i === 0 && <p className="mb-5 text-center font-hand text-[17px] text-ink-muted">Tap the card to flip</p>}
              <Button variant="secondary" full onClick={doFlip}>Show answer</Button>
            </>
          ) : (
            <div className="anim-in grid grid-cols-3 gap-2">
              {RATINGS.map((r, k) => (
                <Button key={r.label} variant="secondary" disabled={leaving} onClick={() => void rate(r.rating)} className="px-1! text-[15px]! whitespace-nowrap lg:text-[17px]!">
                  {r.label}
                  <span className="sr-only">Key {k + 1}</span>
                </Button>
              ))}
            </div>
          )}
          <p className="mt-4 hidden text-center text-[15px] text-ink-muted lg:block">Press space to flip, then 1, 2, or 3 to rate.</p>
        </div>
      </main>
    </>
  );
}

function Empty({ onHome, scoped }: { onHome: () => void; scoped: boolean }) {
  return (
    <>
      <AppBar onClose={onHome} title={<span />} right={<span className="w-11" />} />
      <Page>
        <Title className="pt-1.5 lg:pt-0">Nothing to study yet.</Title>
        <p className="mt-3 font-hand text-[18px] leading-[1.4] text-ink-muted">{scoped ? "This topic has no flashcards yet." : "Today\u2019s topics have no flashcards. Add some and they\u2019ll show up here."}</p>
        <Button full className="mt-8" onClick={onHome}>{scoped ? "Back to class" : "Back to home"}</Button>
      </Page>
    </>
  );
}

const loadHistory = () => api<HistoryResponse>(forStudent("/history"));

// Three ways to fill a bar without red or green: solid, hatched, and outlined ink.
const OUTLINE = "shadow-[inset_0_0_0_2px_var(--color-pen)]";
const HATCH = cx(OUTLINE, "bg-[repeating-linear-gradient(135deg,var(--color-pen)_0_3px,transparent_3px_7px)]");

function Complete({ given, scoped }: { given: Rating[]; scoped: boolean }) {
  const { go } = useNav();
  const { data: history } = useLoad(loadHistory);
  const count = (r: Rating) => given.filter((g) => g === r).length;
  const parts = [["Know it", count(4), "bg-pen"], ["Kinda", count(3), HATCH], ["Don’t know", count(1), OUTLINE]] as const;
  return (
    <>
      <AppBar onClose={() => go(scoped ? "class" : "home")} title={<span />} right={<span className="w-11" />} />
      <Page>
        <Title className="pt-1.5 lg:pt-0">{scoped ? "That\u2019s the whole topic." : "That\u2019s today\u2019s cards."}</Title>
        <p className="mt-2 text-ink-muted">{given.length === 1 ? "1 card" : `${given.length} cards`} reviewed.</p>
        <div className="mt-8 flex h-3.5 gap-0.5">{parts.map(([l, n, c]) => n > 0 && <span key={l} className={cx("rounded-[2px]", c)} style={{ flex: n }} />)}</div>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[15px]">{parts.map(([l, n, c]) => <li key={l} className="flex items-center gap-1.5"><span className={cx("size-3 rounded-[2px]", c)} />{l} <span className="font-hand text-[17px] leading-none text-pen">{n}</span></li>)}</ul>
        {history && (
          <div className="mt-10">
            <StickyNote className="w-[164px]">
              <p className="font-hand text-[42px] leading-none text-pen">{streakOf(history).current}</p>
              <p className="font-hand text-[18px] leading-[1.2] text-[#3b3418]">day streak</p>
            </StickyNote>
            <StreakStrip days={weekStrip(history)} className="mt-7 text-ink-muted" />
          </div>
        )}
        {!scoped && <p className="mt-8">Next cards: tomorrow.</p>}
        <div className="mt-8 flex flex-col gap-2">
          <Button full onClick={() => go(scoped ? "class" : "home")}>{scoped ? "Back to class" : "Back to home"}</Button>
          <Button variant="text" onClick={() => go("question")}>Take today&apos;s quiz</Button>
        </div>
      </Page>
    </>
  );
}
