"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, GripVertical, MoreHorizontal, Paperclip, Pencil, Plus, X } from "lucide-react";
import { AppBar, Bar, Button, Card, Chip, CodeChip, Field, Folder, FolderPanel, H2, Highlight, Label, Mark, MarkOver, Page, Row, Segmented, SourceChip, StickyBottom, Title, classBg } from "@/components/ui";
import { LoadError, Loading } from "@/components/load-state";
import { api, forStudent, useLoad } from "@/lib/api";
import { ICON, cx, useNav } from "@/lib/nav";
import { CLASSES, EXTRACTED_TOPICS, FILES, GUIDE, PLAN_STEPS, WEEK } from "@/lib/mock";
import type { ConfidenceLevel, Topic } from "@/lib/types";

// Class list, upload flow, and the Week/Files tabs are placeholder data (see lib/mock.ts).
// The Topics tab is real: it lists the student's topics with their confidence.

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
// White list on a card, one row per line.
const LIST = "divide-y divide-line px-3.5";

const loadTopics = () => api<{ topics: Topic[] }>(forStudent("/topics")).then((r) => r.topics);

// Average confidence across topics, as a whole percent.
const retained = (topics: Topic[]) => (topics.length ? Math.round(topics.reduce((n, t) => n + t.confidenceScore, 0) / topics.length) : 0);
const cardTotal = (topics: Topic[]) => topics.reduce((n, t) => n + t.flashcardCount, 0);

export function Classes() {
  const { go } = useNav();
  const { data: topics, error, loading } = useLoad(loadTopics);
  return (
    <>
      <AppBar />
      <Page>
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-5 pt-3.5 lg:pt-0">
          <Title>My classes</Title>
          <Button variant="secondary" onClick={() => go("add-class")}><Plus {...ICON} />Add a class</Button>
        </div>
        {error ? <div className="mt-7"><LoadError error={error} /></div> : loading || !topics ? <Loading className="mt-7 h-48" /> : (
          <ul className="mt-7 grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-7 lg:mt-10 lg:gap-x-10 lg:gap-y-9">
            {CLASSES.map((c) => {
              const ret = retained(topics);
              return (
                <li key={c.code}>
                  {/* One folder per class. Its tab carries the class color. */}
                  <Folder className="h-full" tab={c.code} tabClassName={cx(classBg(c.code), "text-[14px] font-bold text-white")}>
                    <button onClick={() => go("class")} className="block w-full text-left after:absolute after:inset-0">
                      <span className="block font-hand text-[24px] leading-[1.25] text-pen lg:text-[30px]">{c.name}</span>
                      <span className="mt-1.5 block text-[15px] text-folder-text">{plural(topics.length, "topic")} and {plural(cardTotal(topics), "card")}.</span>
                      <span className="mt-4 flex items-center gap-3"><Bar value={ret} className="flex-1" /><span className="text-[15px]">{ret}% retained</span></span>
                    </button>
                  </Folder>
                </li>
              );
            })}
          </ul>
        )}
      </Page>
    </>
  );
}

export function AddClass() {
  const { go } = useNav();
  const [file, setFile] = useState(false);
  return (
    <>
      <AppBar back="classes" />
      <Page fill sheet={560}>
        <div className="pb-8 lg:pb-0">
          <Title size="form" className="pt-1.5 lg:pt-0">Add a class</Title>
          <div className="mt-6 flex flex-col gap-4">
            <Field label="Class name" placeholder="Cell Biology" defaultValue="Cell Biology" />
            <Field label="Course code (optional)" placeholder="BIOL 2210" />
          </div>
          <div className="mt-8">
            {!file ? (
              <div className="flex flex-col items-center rounded-[3px] border-2 border-dashed border-pen px-6 pt-7 pb-6 text-center">
                <FileText size={24} strokeWidth={2} className="text-ink-muted" aria-hidden />
                <p className="mt-3 font-bold">Add your syllabus or lecture slides</p>
                <p className="mt-1 text-[15px] text-ink-muted">PDF, PPTX, or DOCX.<span className="hidden lg:inline"> You can also drag it here.</span></p>
                <Button variant="secondary" className="mt-7" onClick={() => setFile(true)}>Choose file</Button>
              </div>
            ) : (
              <Card className="anim-in flex items-center gap-3 py-2 pr-1 pl-4">
                <Paperclip {...ICON} className="shrink-0 text-ink-muted" aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold">BIOL2210_syllabus.pdf</div>
                  <div className="text-[15px] text-ink-muted">1.2 MB</div>
                </div>
                <button aria-label="Remove file" onClick={() => setFile(false)} className="grid size-11 place-items-center"><X {...ICON} /></button>
              </Card>
            )}
          </div>
        </div>
        <StickyBottom>
          <Button full disabled={!file} onClick={() => go("processing")}>Build my plan</Button>
        </StickyBottom>
      </Page>
    </>
  );
}

export function Processing() {
  const { go } = useNav();
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (step >= PLAN_STEPS.length) { const t = setTimeout(() => go("confirm"), 500); return () => clearTimeout(t); }
    const t = setTimeout(() => setStep((s) => s + 1), 1400);
    return () => clearTimeout(t);
  }, [step, go]);
  return (
    <>
      <AppBar back="add-class" />
      <Page sheet={560}>
        <Label className="pt-1.5 lg:pt-0">Step {Math.min(step + 1, 4)} of 4</Label>
        <Title size="form">Building your plan</Title>
        <p className="mt-2"><SourceChip>BIOL2210_syllabus.pdf</SourceChip></p>
        {/* A handwritten checklist: each step gets an ink check when it finishes. */}
        <ol className="mt-7">
          {PLAN_STEPS.map((s, i) => (
            <li key={s} className="flex min-h-12 items-center gap-3">
              <span className="relative grid size-6 shrink-0 place-items-center">
                <span className={cx("size-[18px] rounded-[2px] border-2", i <= step ? "border-pen" : "border-ink-muted/50")} />
                {i < step && <Mark kind="check" size={24} label="Done" className="absolute -top-1.5 left-0.5 text-pen" />}
              </span>
              <span className="flex-1">
                <span className={cx("block font-hand text-[20px] leading-[1.3]", i <= step ? "text-pen" : "text-ink-muted")}>{s}</span>
                {i === step && <span className="mt-1 block h-1 overflow-hidden rounded-[2px] bg-pen/15"><span className="anim-indet block h-full w-2/5 rounded-[2px] bg-pen" /></span>}
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-6 text-[15px] text-ink-muted">This takes about a minute. You can leave this page. Recall will text you when your plan is ready.</p>
      </Page>
    </>
  );
}

export function Confirm() {
  const { go } = useNav();
  const [on, setOn] = useState(EXTRACTED_TOPICS.map(() => true));
  const n = on.filter(Boolean).length;
  return (
    <>
      <AppBar back="add-class" title="Confirm topics" />
      <Page fill sheet={640}>
        <div className="pb-8 lg:pb-0">
          <Title size="form" className="pt-1.5 lg:pt-0">We found 12 topics</Title>
          <p className="mt-2.5">in <span className="font-bold">BIOL2210_syllabus.pdf</span>. Rename, merge, or remove anything that&apos;s off.</p>
          <Card className="mt-6 flex items-center gap-3 py-1 pr-1 pl-3.5">
            <Label>Dates</Label>
            <span className="flex-1">Exam 2 is Oct 16.</span>
            <button aria-label="Edit exam date" className="grid size-11 place-items-center text-ink-muted"><Pencil {...ICON} /></button>
          </Card>
          <Card className="mt-4">
            <ul className="divide-y divide-line">
              {EXTRACTED_TOPICS.map(([t, w], i) => (
                <li key={t} className="flex items-center pl-1">
                  <label className="relative grid size-11 shrink-0 cursor-pointer place-items-center">
                    <input type="checkbox" checked={on[i]} onChange={() => setOn(on.map((v, j) => (j === i ? !v : v)))} className="peer size-5 cursor-pointer appearance-none rounded-[2px] border-2 border-pen" aria-label={`Include ${t}`} />
                    <Mark kind="check" size={24} className="pointer-events-none absolute top-1.5 left-3 text-pen opacity-0 peer-checked:opacity-100" />
                  </label>
                  <input defaultValue={t} className={cx("h-12 min-w-0 flex-1 rounded-[2px] bg-transparent px-1 text-[17px]", !on[i] && "text-ink-muted line-through")} aria-label="Topic name" />
                  <Chip tone="manila" className="shrink-0 px-3!">Wk {w}</Chip>
                  <span className="grid h-11 w-9 shrink-0 cursor-grab place-items-center text-ink-muted" aria-label="Reorder"><GripVertical {...ICON} /></span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
        <StickyBottom>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <span className="font-hand text-[18px] leading-none whitespace-nowrap text-ink-muted">{n} selected</span>
            <Button full disabled={!n} onClick={() => go("class")}>Looks right, build my plan</Button>
          </div>
        </StickyBottom>
      </Page>
    </>
  );
}

const LEVEL: Record<ConfidenceLevel, { label: string; strong?: boolean }> = {
  red: { label: "New" },
  orange: { label: "Shaky" },
  yellow: { label: "Learning" },
  green: { label: "Learning" },
  star: { label: "Strong", strong: true },
};

function TopicsTab({ data, error, loading }: { data?: Topic[]; error?: Error; loading: boolean }) {
  const router = useRouter();
  if (error) return <LoadError error={error} />;
  if (loading || !data) return <Loading className="h-48" />;
  if (data.length === 0) return <p className="font-hand text-[18px] text-folder-text">No topics yet.</p>;
  return (
    <Card className="anim-in">
      <ul className="divide-y divide-line">
        {data.map((t) => {
          const lv = LEVEL[t.confidenceLevel];
          return (
            <li key={t.id}>
              <button onClick={() => router.push(`/flashcards/study?topic=${t.id}`)} className="block w-full px-3.5 py-3 text-left">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="font-bold">{t.name}</span>
                  <span className={cx("flex shrink-0 items-center gap-1 font-hand text-[15px]", lv.strong ? "text-pen" : "text-ink-muted")}>{lv.strong && <Mark kind="check" size={14} strokeWidth={3} />}{lv.label}</span>
                </span>
                <span className="block text-[15px] text-ink-muted">{plural(t.flashcardCount, "card")}</span>
                <span className="mt-2 flex items-center gap-3"><Bar value={t.confidenceScore} className="flex-1" /><span className="w-10 text-right text-[15px] text-ink-muted">{t.confidenceScore ? `${t.confidenceScore}%` : "–"}</span></span>
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

const DAY_NAME: Record<string, string> = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday" };

export function ClassDetail() {
  const { go } = useNav();
  const [tab, setTab] = useState<"week" | "topics" | "files">("week");
  const topics = useLoad(loadTopics);
  const [day, setDay] = useState(6);
  const sel = WEEK[day];
  const today = sel.s === "today";
  // What there is to do on the selected day, as index cards. Each card's details read as a sentence.
  const items = [
    { k: "Study guide", t: sel.topic, m: <><span>{today ? "12 minute read" : "12 minute read. Read."}</span><SourceChip>Lecture 5.pptx</SourceChip></>, go: "topic" as const },
    { k: "Flashcards", t: today ? <Highlight className="px-[3px]! [--highlight-from:35%]">8 cards due</Highlight> : "8 cards", m: today ? "About 4 minutes" : "8 reviewed. Done.", go: "study" as const },
    { k: "Quiz", t: "10 questions", m: today ? "About 6 minutes. Not started yet." : `9 of 10. ${sel.s === "missed" ? "Missed" : "Completed"}.`, go: "question" as const },
  ];
  return (
    <>
      <AppBar back="classes" />
      <Page>
        <CodeChip code="MCAT" />
        <Title size="class" className="mt-1.5">MCAT</Title>
        <p className="mt-1.5 min-h-[1.5em] text-ink-muted">{topics.data && `${plural(topics.data.length, "topic")} and ${plural(cardTotal(topics.data), "card")}.`}</p>
        <div className="mt-[26px]">
          <Segmented value={tab} onChange={setTab} options={[{ id: "week", label: "Week" }, { id: "topics", label: "Topics" }, { id: "files", label: "Files" }]} />
          <FolderPanel>
            {tab === "week" && (
              <div className="anim-in lg:grid lg:grid-cols-[1fr_300px] lg:gap-10">
                <div>
                  <ol className="grid grid-cols-7 gap-0.5 text-center" aria-label="This week">
                    {WEEK.map((w, i) => (
                      <li key={w.d}>
                        {/* Today is circled. Another day, once picked, sits on a paper tab. */}
                        <button onClick={() => setDay(i)} aria-pressed={i === day} aria-label={`${DAY_NAME[w.d]} ${w.n}, ${w.s}`} className={cx("flex w-full flex-col items-center rounded-[6px]", i === day && w.s !== "today" && "bg-paper/80")}>
                          <span className={cx("text-[12px] leading-[18px]", w.s === "today" ? "font-bold text-ink" : "text-folder-text")}>{w.d}</span>
                          <span className={cx("relative font-hand text-[19px] leading-[1.4]", w.s === "today" && "text-pen")}>
                            {w.n}
                            {w.s === "today" && <MarkOver kind="circle" size={36} className="text-pen" />}
                          </span>
                          <span className="grid h-3.5 place-items-center text-pen">
                            {w.s === "done" && <Mark kind="check" size={14} strokeWidth={3} />}
                            {w.s === "missed" && <span className="h-0.5 w-2.5 rounded-full bg-ink-muted" />}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ol>
                  <div className="mt-[18px] mb-2.5 flex items-baseline justify-between gap-3">
                    <H2>{today ? "Today" : `${DAY_NAME[sel.d]}, ${sel.topic}`}</H2>
                    {sel.s === "done" && <span className="flex shrink-0 items-center gap-1 font-hand text-[15px] text-pen"><Mark kind="check" size={16} />done</span>}
                    {sel.s === "missed" && <span className="shrink-0 font-hand text-[15px] text-folder-text">missed</span>}
                  </div>
                  <ul className="flex flex-col gap-3">
                    {items.map((r) => <li key={r.k}><Row label={r.k} title={r.t} meta={r.m} onClick={() => go(r.go)} /></li>)}
                  </ul>
                </div>
                <div className="mt-7 lg:mt-0">
                  <H2 className="mb-2.5">This week</H2>
                  <Card>
                    <ul className={LIST}>
                      {WEEK.slice(0, 6).map((w) => (
                        <li key={w.d} className="flex min-h-11 items-center gap-3 py-2">
                          <span className="w-9 font-hand text-[15px] text-ink-muted">{w.d}</span>
                          <span className="flex-1">{w.topic}</span>
                          {w.s === "done" ? <Mark kind="check" size={18} label="done" className="text-pen" /> : <span className="font-hand text-[15px] text-ink-muted">missed</span>}
                        </li>
                      ))}
                    </ul>
                  </Card>
                </div>
              </div>
            )}

            {tab === "topics" && <TopicsTab {...topics} />}

            {tab === "files" && (
              <Card className="anim-in">
                <ul className={LIST}>
                  {FILES.map(([f, d, m]) => (
                    <li key={f} className="flex items-center gap-3 py-3">
                      <Paperclip {...ICON} className="shrink-0 text-ink-muted" aria-hidden />
                      <div className="min-w-0 flex-1"><div className="font-bold">{f}</div><div className="text-[15px] text-ink-muted">Added {d}. {m}.</div></div>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </FolderPanel>
          {tab === "files" && <Button variant="secondary" className="mt-7" onClick={() => go("add-class")}><Plus {...ICON} />Add lecture slides</Button>}
        </div>
      </Page>
    </>
  );
}

export function TopicDetail() {
  const { go } = useNav();
  const [menu, setMenu] = useState(false);
  return (
    <>
      <AppBar back="class" right={
        <div className="relative">
          <button aria-label="More" onClick={() => setMenu(!menu)} className="grid size-11 place-items-center"><MoreHorizontal size={24} strokeWidth={2} /></button>
          {menu && <Card className="anim-in absolute top-12 right-0 w-40 py-1">{["Edit", "Regenerate"].map((x) => <button key={x} className="h-11 w-full px-4 text-left active:bg-ink/5">{x}</button>)}</Card>}
        </div>
      } />
      <Page fill sheet={640}>
        <div className="pb-8 lg:pb-0">
          <div className="flex flex-wrap items-center gap-2"><CodeChip code="BIOL 2210" /><Chip tone="manila">Week 6</Chip></div>
          <Title size="class" className="mt-1.5">Glycolysis</Title>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-ink-muted"><span>Next review is today.</span><SourceChip>From Lecture 5.pptx, slides 12–18</SourceChip></p>
          {/* The guide itself is one index card. */}
          <Card className="mt-6 bg-[linear-gradient(180deg,transparent_0_32px,#ee9a9a_32px_33.5px,transparent_33.5px)] px-4 pt-1 pb-5 lg:px-6">
            <Label className="flex h-7 items-center">Study guide</Label>
            <article className="mt-4 space-y-7">
              <section>
                <H2>The short version</H2>
                <p className="mt-2">{GUIDE.summary}</p>
              </section>
              <section>
                <H2>Key terms</H2>
                <dl className="mt-2 divide-y divide-line border-y border-line">
                  {GUIDE.terms.map(([t, d]) => (
                    <div key={t} className="py-3"><dt className="font-bold">{t}</dt><dd className="text-ink-muted">{d}</dd></div>
                  ))}
                </dl>
              </section>
              <section>
                <H2>Steps</H2>
                <ol className="mt-2 space-y-2">
                  {GUIDE.steps.map((s, i) => (
                    <li key={i} className="grid grid-cols-[28px_1fr]"><span className="font-hand text-[19px] leading-[1.35] text-pen">{i + 1}.</span>{s}</li>
                  ))}
                </ol>
              </section>
            </article>
          </Card>
        </div>
        <StickyBottom>
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <Button onClick={() => go("study")}>Review cards</Button>
            <Button variant="secondary" onClick={() => go("question")}>Take quiz</Button>
          </div>
        </StickyBottom>
      </Page>
    </>
  );
}
