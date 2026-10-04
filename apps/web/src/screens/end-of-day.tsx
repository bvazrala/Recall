"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Loading, LoadError } from "@/components/load-state";
import { Mark, Title } from "@/components/ui";
import { api, forStudent, useLoad } from "@/lib/api";
import { cx } from "@/lib/nav";
import type { ConfidenceLevel, DayResponse } from "@/lib/types";

// Reached from the 8 PM iMessage. The student rates each of today's topics, then the day closes with those
// ratings as overrides (POST /day/close). One topic at a time, so a phone screen holds a single decision.

const OPTIONS: { level: ConfidenceLevel; label: string; hint: string; bg: string; text: string }[] = [
  { level: "star", label: "Mastered", hint: "I could teach it", bg: "bg-level-star", text: "text-white" },
  { level: "green", label: "Solid", hint: "I could explain it", bg: "bg-level-green", text: "text-white" },
  { level: "yellow", label: "Getting there", hint: "I know the main idea", bg: "bg-level-yellow", text: "text-ink" },
  { level: "orange", label: "Shaky", hint: "I got pieces of it", bg: "bg-level-orange", text: "text-ink" },
  { level: "red", label: "Lost", hint: "I don't get it yet", bg: "bg-level-red", text: "text-white" },
];

const PICK_MS = 260; // long enough to see which option was tapped before the card leaves

const loadDay = () => api<DayResponse>(forStudent("/day"));

export function EndOfDay() {
  const { data, error, loading } = useLoad(loadDay);
  if (error) return <div className="paper page-x min-h-dvh pt-[100px]"><LoadError error={error} /></div>;
  if (loading || !data) return <div className="paper page-x min-h-dvh pt-[100px]"><Loading className="h-[360px]" /></div>;
  return <Rate day={data.day} topics={data.topics} />;
}

function Rate({ day, topics }: { day: DayResponse["day"]; topics: DayResponse["topics"] }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<ConfidenceLevel | null>(null);
  const [ratings, setRatings] = useState<Record<string, ConfidenceLevel>>({});
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState<string>();

  const topic = topics[i];

  const close = async (all: Record<string, ConfidenceLevel>) => {
    try {
      await api(forStudent("/day/close"), {
        method: "POST",
        body: JSON.stringify({ dayNumber: day.number, overrides: Object.entries(all).map(([topicId, level]) => ({ topicId, level })) }),
      });
      setDone(true);
    } catch (e) {
      // 409: the day was already closed (the link was opened twice). The ratings are in, so this is still done.
      if ((e as Error).message.includes("409")) setDone(true);
      else setFailed((e as Error).message);
    }
  };

  const pick = (level: ConfidenceLevel) => {
    if (picked || !topic) return;
    setPicked(level);
    const all = { ...ratings, [topic.topicId]: level };
    setRatings(all);
    setTimeout(() => {
      setPicked(null);
      if (i + 1 < topics.length) setI(i + 1);
      else void close(all);
    }, PICK_MS);
  };

  if (done || topics.length === 0) {
    return (
      <div className="paper page-x flex min-h-dvh flex-col pt-[100px]">
        <div className="anim-in">
          <Mark kind="check" size={44} strokeWidth={3} className="text-pen" />
          <Title className="mt-4">Thank you.</Title>
          <p className="mt-3 text-[19px]">{topics.length === 0 ? "Nothing to rate today." : "Your ratings are saved."} You may exit now.</p>
        </div>
      </div>
    );
  }

  const waiting = i === topics.length - 1 && picked !== null; // the last tap, while the day closes
  return (
    <div className="paper page-x flex min-h-dvh flex-col pt-[100px] pb-[max(24px,env(safe-area-inset-bottom))]">
      <p className="font-hand text-[18px] leading-none text-ink-muted" aria-live="polite">
        {i + 1} of {topics.length}
      </p>
      {/* Keyed by topic so each one slides in fresh. */}
      <div key={topic.topicId} className={cx("anim-slidein mt-4", picked && "pointer-events-none")}>
        <p className="text-[15px] text-ink-muted">How well do you understand</p>
        <Title size="form" className="mt-1 break-words">{topic.name}?</Title>
        <ul className="mt-8 flex flex-col gap-3">
          {OPTIONS.map((o) => (
            <li key={o.level}>
              <button
                type="button"
                onClick={() => pick(o.level)}
                aria-label={`${o.label}. ${o.hint}`}
                className={cx(
                  "flex min-h-[60px] w-full items-center gap-3 rounded-[3px] px-4 py-2.5 text-left shadow-[0_3px_0_rgba(0,0,0,0.25)] transition-[transform,opacity] duration-150 ease-out active:translate-y-px",
                  o.bg,
                  o.text,
                  picked && (picked === o.level ? "scale-[1.02]" : "opacity-40"),
                )}
              >
                {o.level === "star" && <Star size={20} strokeWidth={2} className="shrink-0 fill-level-yellow text-level-yellow" />}
                <span className="text-[18px] font-bold">{o.label}</span>
                <span className="ml-auto text-[15px] opacity-90">{o.hint}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      {waiting && !failed && <p className="mt-6 font-hand text-[18px] text-ink-muted">Saving…</p>}
      {failed && (
        <div className="mt-6">
          <p className="text-redpen">Couldn&apos;t save your ratings. {failed}</p>
          <button type="button" className="mt-2 min-h-11 font-bold text-pen underline decoration-2 underline-offset-[5px]" onClick={() => { setFailed(undefined); void close(ratings); }}>
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
