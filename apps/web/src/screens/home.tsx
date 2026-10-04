"use client";

import { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import { AppBar, Button, Card, Chip, H2, Label, Page, Segmented, Stat, StreakStrip, Title } from "@/components/ui";
import { LoadError, Loading } from "@/components/load-state";
import { useDay } from "@/components/day-context";
import { api, forStudent, useLoad } from "@/lib/api";
import { cardCount, joinNames, minutesFor } from "@/lib/day-data";
import { ICON, cx, useNav } from "@/lib/nav";
import { REVIEWS_PER_DAY, USER } from "@/lib/mock";
import { retentionSeries, streakOf, weekStrip } from "@/lib/stats";
import type { ConfidenceGrid, HistoryResponse, Topic } from "@/lib/types";

const loadHistory = () => api<HistoryResponse>(forStudent("/history"));
const loadGrid = () => api<ConfidenceGrid>(forStudent("/confidence-grid?days=14"));
const loadTopics = () => api<{ topics: Topic[] }>(forStudent("/topics")).then((r) => r.topics);

const fmtDate = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

function Chart({ empty, grid }: { empty?: boolean; grid?: ConfidenceGrid }) {
  const [mode, setMode] = useState<"reviews" | "retention">("retention");
  const retention = grid ? retentionSeries(grid) : [];
  const n = 14;
  const W = 353, H = 170, L = 26, B = 22, cw = W - L, ch = H - B - 8;
  const y = (v: number) => 8 + ch - (v / 30) * ch;
  const yr = (v: number) => 8 + ch - (v / 100) * ch;
  const bw = cw / n;
  const days = Array.from({ length: n }, (_, i) => (grid && [0, 6, n - 1].includes(i) ? fmtDate(grid.dates[i]) : ""));
  const points = retention.flatMap((v, i) => (v === null ? [] : [{ v, i }]));
  const first = points[0], last = points.at(-1);

  return (
    <section>
      <div className="flex items-center justify-between gap-4">
        <H2>Your reviews</H2>
        <Segmented className="w-[200px]" value={mode} onChange={setMode} options={[{ id: "reviews", label: "Reviews" }, { id: "retention", label: "Retention" }]} />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className={cx("w-full mt-5", empty && "opacity-40")} role="img" aria-label={mode === "reviews" ? "Cards reviewed per day, last 14 days" : "Retention, last 14 days"}>
        {(mode === "reviews" ? [0, 10, 20, 30] : [0, 25, 50, 75, 100]).map((v) => {
          const yy = mode === "reviews" ? y(v) : yr(v);
          return (
            <g key={v}>
              <line x1={L} x2={W} y1={yy} y2={yy} stroke="#1C1B19" strokeOpacity={0.14} />
              <text x={0} y={yy + 4} fontSize={10} className="mono" fill="#6B675E">{mode === "reviews" ? v : `${v}%`}</text>
            </g>
          );
        })}
        {!empty && mode === "reviews" && REVIEWS_PER_DAY.map((v, i) => {
          const x = L + i * bw + 3, h = 8 + ch - y(v), today = i === n - 1;
          return (
            <g key={i}>
              {v > 0 && <path d={`M${x},${y(0)} v${-(h - 2)} q0,-2 2,-2 h${bw - 10} q2,0 2,2 v${h - 2} z`} fill={today ? "#C93A22" : "#1C1B19"} />}
              {today && <text x={x + (bw - 6) / 2} y={y(v) - 6} textAnchor="middle" fontSize={11} className="mono" fill="#A82E1A" fontWeight={500}>{v}</text>}
            </g>
          );
        })}
        {!empty && mode === "retention" && (
          <>
            <polyline fill="none" stroke="#1C1B19" strokeWidth={1.5} points={points.map((p) => `${L + p.i * bw + bw / 2},${yr(p.v)}`).join(" ")} />
            {points.map((p) => <circle key={p.i} cx={L + p.i * bw + bw / 2} cy={yr(p.v)} r={p.i === n - 1 ? 4 : 2.5} fill={p.i === n - 1 ? "#C93A22" : "#1C1B19"} />)}
          </>
        )}
        {days.map((d, i) => d && <text key={i} x={L + i * bw + bw / 2} y={H - 4} textAnchor={i === n - 1 ? "end" : "middle"} fontSize={10} className="mono" fill="#6B675E">{d}</text>)}
      </svg>
      <p className="text-[14px] leading-5 text-ink-muted mt-3">
        {empty
          ? "Your reviews show up here after your first session."
          : mode === "reviews"
            ? "Sample data. Daily review counts arrive once the server reports them."
            : first && last && first.i !== last.i
              ? `Retention is ${last.v}%, from ${first.v}% on ${fmtDate(grid!.dates[first.i])}.`
              : last ? `Retention is ${last.v}% today.` : "Retention shows up after your first review."}
      </p>
    </section>
  );
}

function Streak({ empty, history }: { empty?: boolean; history?: HistoryResponse }) {
  const { current, longest } = history ? streakOf(history) : { current: 0, longest: 0 };
  return (
    <section>
      <div className="flex items-end justify-between">
        <div className="flex items-baseline gap-2">
          <span className={cx("font-serif font-medium text-[64px] leading-[56px]", empty && "text-ink-muted/50")}>{empty ? 0 : current}</span>
          <span className="text-[16px]">day streak</span>
        </div>
        <span className="mono text-[13px] text-ink-muted">Longest: {empty ? 0 : longest}</span>
      </div>
      <div className="mt-5">
        <StreakStrip muted={empty} days={empty || !history ? ["future", "future", "future", "future", "future", "future", "today"] : weekStrip(history)} />
      </div>
    </section>
  );
}

function StatRow({ retention, cards, topics }: { retention: number | null; cards: number; topics: number }) {
  return (
    <div className="flex divide-x divide-line border-y border-line [&>*]:px-3 [&>*:first-child]:pl-0">
      <Stat value={retention === null ? "–" : <>{retention}<span className="text-[18px]">%</span></>} label="retention" />
      <Stat value={cards} label="flashcards" />
      <Stat value={topics} label="topics" />
    </div>
  );
}

function NextText() {
  const { go } = useNav();
  return (
    <p className="flex items-center gap-2 text-[14px] text-ink-muted">
      <MessageSquare {...ICON} className="shrink-0" />
      <span>Next text tonight at <span className="mono text-ink">7:30 PM</span></span>
      <span aria-hidden>·</span>
      <button onClick={() => go("settings")} className="text-ink font-medium underline underline-offset-4 min-h-11">Change</button>
    </p>
  );
}

function Greeting({ welcome }: { welcome?: boolean }) {
  const [now, setNow] = useState<Date>();
  useEffect(() => setNow(new Date()), []);
  const h = now?.getHours() ?? 12;
  const part = h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
  return (
    <>
      <Label>{now ? now.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }) : " "}</Label>
      <Title className={cx("mt-2", !welcome && "lg:text-[36px] lg:leading-10")}>{welcome ? `Welcome, ${USER.first}.` : `Good ${part}, ${USER.first}.`}</Title>
    </>
  );
}

export function Home() {
  const { go } = useNav();
  const { data: day, error, loading } = useDay();
  const history = useLoad(loadHistory);
  const grid = useLoad(loadGrid);
  const topics = useLoad(loadTopics);

  if (error) return <><AppBar /><Page wide><LoadError error={error} /></Page></>;
  if (day && day.topics.length === 0) return <HomeEmpty />;

  const cards = day ? cardCount(day) : 0;
  const series = grid.data ? retentionSeries(grid.data).filter((v) => v !== null) : [];
  const stats = { retention: series.at(-1) ?? null, cards: (topics.data ?? []).reduce((n, t) => n + t.flashcardCount, 0), topics: topics.data?.length ?? 0 };

  return (
    <>
      <AppBar />
      <Page wide>
        <Greeting />
        <div className="mt-6 lg:grid lg:grid-cols-[1fr_340px] lg:gap-12">
          <div className="space-y-10">
            <Card className="p-5 lg:p-7">
              <Label>Today&apos;s study</Label>
              {loading || !day ? <Loading className="h-28 mt-3" /> : (
                <>
                  <h2 className="font-serif font-medium text-[24px] leading-[30px] mt-2">{joinNames(day.topics.map((t) => t.name))}</h2>
                  <p className="mono text-[14px] text-ink-muted mt-2">{cards} cards due · 1 quiz · about {minutesFor(cards)} min</p>
                  <div className="flex flex-wrap gap-2 mt-3">{day.topics.map((t) => <Chip key={t.topicId}>{t.name}</Chip>)}</div>
                  <div className="mt-6 flex flex-col gap-1 lg:flex-row lg:items-center lg:gap-3">
                    <Button full className="lg:w-auto lg:px-8" disabled={cards === 0} onClick={() => go("study")}>Start today&apos;s review</Button>
                    <Button variant="text" onClick={() => go("question")}>Take today&apos;s quiz</Button>
                  </div>
                </>
              )}
              <div className="mt-4 pt-1 border-t border-line lg:hidden"><NextText /></div>
            </Card>
            <div className="lg:hidden"><Streak history={history.data} /></div>
            <Chart grid={grid.data} />
            <div className="lg:hidden"><StatRow {...stats} /></div>
          </div>
          <aside className="hidden lg:block space-y-10 lg:border-l lg:border-line lg:pl-12">
            <Streak history={history.data} />
            <StatRow {...stats} />
            <NextText />
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
      <Page wide>
        <Greeting welcome />
        <div className="mt-6 lg:grid lg:grid-cols-[1fr_340px] lg:gap-12">
          <div className="space-y-10">
            <Card className="p-5 lg:p-7">
              <h2 className="font-serif font-medium text-[24px] leading-[30px]">Start with a syllabus.</h2>
              <p className="text-[16px] leading-6 text-ink-muted mt-2">Upload one file and Recall builds your first week.</p>
              <Button full className="mt-6 lg:w-auto lg:px-8" onClick={() => go("add-class")}>Upload a syllabus</Button>
            </Card>
            <Chart empty />
          </div>
          <div className="mt-10 lg:mt-0"><Streak empty /></div>
        </div>
      </Page>
    </>
  );
}
