"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, MessageSquare, Star } from "lucide-react";
import { AppBar, Button, Chip, Folder, H2, MarkOver, Page, Segmented, Stat, StickyNote, StreakStrip, Title } from "@/components/ui";
import { LoadError, Loading } from "@/components/load-state";
import { useDay } from "@/components/day-context";
import { api, forStudent, useLoad } from "@/lib/api";
import { cardCount, joinNames, minutesFor } from "@/lib/day-data";
import { cx, useNav, type DayState } from "@/lib/nav";
import { REVIEWS_PER_DAY, USER } from "@/lib/mock";
import { retentionSeries, streakOf, weekStrip } from "@/lib/stats";
import type { ConfidenceGrid, ConfidenceLevel, HistoryResponse, Topic } from "@/lib/types";

const loadHistory = () => api<HistoryResponse>(forStudent("/history"));
const loadGrid = () => api<ConfidenceGrid>(forStudent("/confidence-grid?days=14"));
const loadTopics = () => api<{ topics: Topic[] }>(forStudent("/topics")).then((r) => r.topics);

const PAGE_DAYS = 14;
const MAX_DAYS = 365; // the server's backfill cap
const LAST_PAGE = Math.floor(MAX_DAYS / PAGE_DAYS) - 1;

const LEVEL_STYLE: Record<ConfidenceLevel, { label: string; bg: string }> = {
  red: { label: "Lost", bg: "bg-level-red" },
  orange: { label: "Shaky", bg: "bg-level-orange" },
  yellow: { label: "Getting there", bg: "bg-level-yellow" },
  green: { label: "Solid", bg: "bg-level-green" },
  star: { label: "Mastered", bg: "bg-level-star" },
};

const fmtDate = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

// Today's number, written over its mark in handwriting with the highlighter.
const TODAY_NOTE = "highlight absolute font-hand text-[22px] leading-[1.1] text-pen [--highlight-from:35%]";

function Chart({ empty, grid }: { empty?: boolean; grid?: ConfidenceGrid }) {
  const [mode, setMode] = useState<"reviews" | "retention" | "topics">("topics");
  const retention = grid ? retentionSeries(grid) : [];
  const n = 14;
  const x = (i: number) => ((i + 0.5) / n) * 100;
  const peak = Math.max(...REVIEWS_PER_DAY) * 1.2;
  const points = retention.flatMap((v, i) => (v === null ? [] : [{ v, i }]));
  const first = points[0], last = points.at(-1);

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <H2>Your reviews</H2>
        <Segmented small value={mode} onChange={setMode} options={[{ id: "reviews", label: "Reviews" }, { id: "retention", label: "Retention" }, { id: "topics", label: "Topic Mastery" }]} />
      </div>
      {mode === "topics" && !empty ? <TopicGrid /> : <figure className="mt-[52px]">
        {mode === "reviews" ? (
          <div className={cx("flex h-[192px] items-end gap-1.5 border-b-2 border-ink px-1 lg:gap-2.5", empty && "opacity-40")} role="img" aria-label="Cards reviewed per day, last 14 days">
            {!empty && REVIEWS_PER_DAY.map((v, i) => {
              const today = i === n - 1;
              return (
                <div
                  key={i}
                  className={cx("relative flex-1 rounded-t-[3px]", v > 0 && (today ? "bg-[repeating-linear-gradient(135deg,var(--color-pen)_0_3px,transparent_3px_7px)] shadow-[inset_0_0_0_2px_var(--color-pen)]" : "bg-pen"))}
                  style={{ height: `${(v / peak) * 100}%` }}
                >
                  {today && <span className={cx(TODAY_NOTE, "bottom-full left-1/2 mb-1 -translate-x-1/2")}>{v}</span>}
                </div>
              );
            })}
          </div>
        ) : (
          <div className={cx("relative h-[192px] border-b-2 border-ink", empty && "opacity-40")} role="img" aria-label="Retention, last 14 days">
            {!empty && last && (
              <>
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" aria-hidden>
                  <polyline fill="none" stroke="var(--color-pen)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" points={points.map((p) => `${x(p.i)},${100 - p.v}`).join(" ")} />
                </svg>
                {points.map((p) => (
                  <span key={p.i} className="absolute size-[7px] -translate-x-1/2 translate-y-1/2 rounded-full bg-pen" style={{ left: `${x(p.i)}%`, bottom: `${p.v}%` }}>
                    {p.i === last.i && <MarkOver kind="circle" size={24} className="text-pen" />}
                  </span>
                ))}
                {first.i !== last.i && <span className="absolute -translate-x-1/2 font-hand text-[17px] leading-[1.1] text-ink-muted" style={{ left: `${x(first.i)}%`, bottom: `calc(${first.v}% + 12px)` }}>{first.v}%</span>}
                <span className={cx(TODAY_NOTE, "-translate-x-[70%]")} style={{ left: `${x(last.i)}%`, bottom: `calc(${last.v}% + 16px)` }}>{last.v}%</span>
              </>
            )}
          </div>
        )}
        <div className="mt-2 flex h-5 justify-between text-[14px] text-ink-muted">
          {grid && [fmtDate(grid.dates[0]), fmtDate(grid.dates[6]), "Today"].map((d) => <span key={d}>{d}</span>)}
        </div>
        <figcaption className={cx("mt-4", empty && "font-hand text-[18px] text-ink-muted")}>
          {empty
            ? "Your reviews show up here after your first session."
            : mode === "reviews"
              ? "Sample data. Daily review counts arrive once the server reports them."
              : first && last && first.i !== last.i
                ? `Retention is ${last.v}%, from ${first.v}% on ${fmtDate(grid!.dates[first.i])}.`
                : last ? `Retention is ${last.v}% today.` : "Retention shows up after your first review."}
        </figcaption>
      </figure>}
    </section>
  );
}

// Topics down the side, days across (oldest left, newest right). The endpoint always ends today, so
// going back a page means asking for a longer window and showing its oldest 14 days.
function TopicGrid() {
  const [page, setPage] = useState(0);
  const load = useCallback(() => api<ConfidenceGrid>(forStudent(`/confidence-grid?days=${PAGE_DAYS * (page + 1)}`)), [page]);
  const { data, error, loading } = useLoad(load);
  if (error) return <LoadError error={error} />;
  if (!data) return <Loading className="h-48" />;
  const dates = data.dates.slice(0, PAGE_DAYS);
  const range = `${fmtDate(dates[0])} – ${page === 0 ? "Today" : fmtDate(dates[dates.length - 1])}`;
  return (
    <div className={cx("mt-6", loading && "opacity-60")}>
      <div className="flex items-center justify-between gap-3">
        <button onClick={() => setPage(page + 1)} disabled={page >= LAST_PAGE || loading} className="flex min-h-11 items-center gap-1 font-bold text-pen hover:text-pen-dark disabled:text-ink-muted/50"><ChevronLeft size={20} aria-hidden />Earlier</button>
        <span className="font-hand text-[18px] text-ink-muted">{range}</span>
        <button onClick={() => setPage(page - 1)} disabled={page === 0 || loading} className="flex min-h-11 items-center gap-1 font-bold text-pen hover:text-pen-dark disabled:text-ink-muted/50">Later<ChevronRight size={20} aria-hidden /></button>
      </div>
      {data.topics.length === 0 ? <p className="mt-3 font-hand text-[18px] text-ink-muted">No topics yet.</p> : (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[520px] border-separate border-spacing-x-0.5 border-spacing-y-1">
            <thead>
              <tr>
                <th scope="col" className="sr-only">Topic</th>
                {dates.map((d) => <th key={d} scope="col" className="text-[12px] font-normal text-ink-muted" title={fmtDate(d)}>{Number(d.slice(8))}</th>)}
              </tr>
            </thead>
            <tbody>
              {data.topics.map((t) => (
                <tr key={t.id}>
                  <th scope="row" className="sticky left-0 w-[132px] max-w-[132px] truncate bg-paper pr-2 text-left text-[15px] font-bold">{t.name}</th>
                  {t.cells.slice(0, PAGE_DAYS).map((c, i) => (
                    <td key={dates[i]} className="p-0">
                      {c ? (
                        <span role="img" aria-label={`${t.name}, ${fmtDate(dates[i])}: ${LEVEL_STYLE[c.level].label}`} title={`${fmtDate(dates[i])}: ${LEVEL_STYLE[c.level].label}`} className={cx("flex h-7 items-center justify-center rounded-[3px]", LEVEL_STYLE[c.level].bg)}>
                          {c.level === "star" && <Star size={14} strokeWidth={2} className="fill-level-yellow text-level-yellow" aria-hidden />}
                        </span>
                      ) : <span aria-label="Not studied yet" className="flex h-7 items-center justify-center text-ink-muted/50">–</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const NO_WEEK: DayState[] = ["future", "future", "future", "future", "future", "future", "today"];

// The streak is the screen's one sticky note. Phones get the small note with the week under it;
// desktop has room for the week on the note itself.
function Streak({ empty, history, large }: { empty?: boolean; history?: HistoryResponse; large?: boolean }) {
  const { current, longest } = history && !empty ? streakOf(history) : { current: 0, longest: 0 };
  const week = empty || !history ? NO_WEEK : weekStrip(history);
  const best = <>Your longest is {plural(longest, "day")}.</>;
  if (large) {
    return (
      <StickyNote large className="w-full max-w-[300px] self-start">
        <p className="flex items-baseline gap-2.5">
          <span className={cx("font-hand text-[62px] leading-[0.95]", empty ? "text-pen/40" : "text-pen")}>{current}</span>
          <span className="font-hand text-[23px] leading-[1.1] text-[#3b3418]">day streak</span>
        </p>
        <p className="mt-3 mb-3.5 text-[15px] text-[#4a4220]">{best}</p>
        <StreakStrip muted={empty} days={week} className="text-[#4a4220]" />
      </StickyNote>
    );
  }
  return (
    <StickyNote className="w-[164px] shrink-0">
      <p className={cx("font-hand text-[42px] leading-none", empty ? "text-pen/40" : "text-pen")}>{current}</p>
      <p className="font-hand text-[18px] leading-[1.2] text-[#3b3418]">day streak</p>
    </StickyNote>
  );
}

function Week({ empty, history }: { empty?: boolean; history?: HistoryResponse }) {
  const longest = history && !empty ? streakOf(history).longest : 0;
  return (
    <div>
      <StreakStrip muted={empty} days={empty || !history ? NO_WEEK : weekStrip(history)} className="text-ink-muted" />
      <p className="mt-3 text-[15px] text-ink-muted">Your longest is {plural(longest, "day")}.</p>
    </div>
  );
}

function Stats({ retention, cards, topics }: { retention: number | null; cards: number; topics: number }) {
  return (
    <>
      <Stat value={retention === null ? "–" : `${retention}%`} label="retention" />
      <Stat value={cards} label="flashcards" />
      <Stat value={topics} label="topics" />
    </>
  );
}

function NextText() {
  const { go } = useNav();
  return (
    <p className="flex flex-wrap items-center gap-x-2.5 text-[16px] text-ink-muted lg:text-[17px]">
      <MessageSquare size={22} strokeWidth={2} className="shrink-0" aria-hidden />
      Next text tonight at 7:30 PM.
      <button onClick={() => go("settings")} className="min-h-11 font-bold text-pen underline hover:text-pen-dark">Change</button>
    </p>
  );
}

function Greeting({ welcome }: { welcome?: boolean }) {
  const [now, setNow] = useState<Date>();
  useEffect(() => setNow(new Date()), []);
  const h = now?.getHours() ?? 12;
  const part = h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
  return (
    <div className="pt-3.5 lg:pt-0">
      <p className="font-hand text-[18px] leading-[1.3] text-ink-muted lg:text-[20px]">{now ? now.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }) : " "}</p>
      <Title className="mt-0.5 lg:mt-0">{welcome ? `Welcome, ${USER.first}.` : `Good ${part}, ${USER.first}.`}</Title>
    </div>
  );
}

const COLUMNS = "lg:mt-10 lg:flex lg:flex-wrap lg:items-start lg:gap-x-14 lg:gap-y-12";
const MAIN = "min-w-0 lg:flex lg:flex-[3_1_480px] lg:flex-col lg:gap-[52px]";
const ASIDE = "hidden min-w-0 flex-[1_1_260px] flex-col gap-11 pt-2 lg:flex";

export function Home() {
  const { go } = useNav();
  const { data: day, error, loading } = useDay();
  const history = useLoad(loadHistory);
  const grid = useLoad(loadGrid);
  const topics = useLoad(loadTopics);

  if (error) return <><AppBar /><Page><div className="pt-2 lg:pt-0"><LoadError error={error} /></div></Page></>;
  if (day && day.topics.length === 0) return <HomeEmpty />;

  const cards = day ? cardCount(day) : 0;
  const series = grid.data ? retentionSeries(grid.data).filter((v) => v !== null) : [];
  const stats = { retention: series.at(-1) ?? null, cards: (topics.data ?? []).reduce((n, t) => n + t.flashcardCount, 0), topics: topics.data?.length ?? 0 };

  return (
    <>
      <AppBar />
      <Page>
        <header className="lg:flex lg:flex-wrap lg:items-end lg:justify-between lg:gap-x-8 lg:gap-y-4">
          <Greeting />
          <div className="hidden lg:-mb-px lg:block"><NextText /></div>
        </header>
        <div className={COLUMNS}>
          <div className={MAIN}>
            <Folder tab="Today" className="mt-[21px] lg:mt-0">
              {loading || !day ? <Loading className="h-40" /> : (
                <>
                  <h2 className="font-hand text-[24px] leading-[1.25] text-pen lg:text-[35px] lg:leading-[1.2]">{joinNames(day.topics.map((t) => t.name))}</h2>
                  <p className="mt-2 lg:mt-2.5 lg:text-[18px]">{plural(cards, "card")} and 1 quiz, about {plural(minutesFor(cards), "minute")}.</p>
                  <div className="mt-3.5 flex flex-wrap gap-2 lg:mt-4 lg:gap-2.5">{day.topics.map((t) => <Chip key={t.topicId}>{t.name}</Chip>)}</div>
                  <div className="mt-[30px] flex flex-col gap-2 lg:mt-8 lg:flex-row lg:flex-wrap lg:items-center lg:gap-x-8 lg:gap-y-[18px]">
                    <Button full className="lg:w-auto lg:min-w-[260px] lg:px-8" disabled={cards === 0} onClick={() => go("study")}>Start today&apos;s review</Button>
                    <Button variant="text" onClick={() => go("question")}>Take today&apos;s quiz</Button>
                  </div>
                </>
              )}
            </Folder>
            <div className="lg:hidden">
              <div className="mt-[34px] flex items-start gap-6">
                <Streak history={history.data} />
                <dl className="mt-1 flex flex-1 flex-col gap-3"><Stats {...stats} /></dl>
              </div>
              <div className="mt-7"><Week history={history.data} /></div>
              <div className="mt-3"><NextText /></div>
            </div>
            <div className="mt-9 lg:mt-0"><Chart grid={grid.data} /></div>
          </div>
          <aside className={ASIDE}>
            <Streak large history={history.data} />
            <dl className="grid grid-cols-3 gap-3"><Stats {...stats} /></dl>
          </aside>
        </div>
      </Page>
    </>
  );
}

export function HomeEmpty() {
  const { go } = useNav();
  return (
    <>
      <AppBar />
      <Page>
        <Greeting welcome />
        <div className={COLUMNS}>
          <div className={MAIN}>
            <div className="mt-5 lg:mt-0">
              <p className="max-w-[420px] font-hand text-[20px] leading-[1.4] text-ink-muted">Start with a syllabus. Upload one file and Recall builds your first week.</p>
              <Button full className="mt-7 lg:w-auto lg:min-w-[260px] lg:px-8" onClick={() => go("add-class")}>Upload a syllabus</Button>
            </div>
            <div className="mt-10 lg:hidden">
              <Streak empty />
              <div className="mt-7"><Week empty /></div>
            </div>
            <div className="mt-9 lg:mt-0"><Chart empty /></div>
          </div>
          <aside className={ASIDE}><Streak large empty /></aside>
        </div>
      </Page>
    </>
  );
}
