"use client";

import { useEffect, useState } from "react";
import { Check, FileText, GripVertical, MoreHorizontal, Pencil, Plus, X } from "lucide-react";
import { AppBar, Bar, Button, Card, Chip, CodeChip, Field, H2, Label, Page, Row, Segmented, SourceChip, StickyBottom, Title } from "@/components/ui";
import { LoadError, Loading } from "@/components/load-state";
import { api, forStudent, useLoad } from "@/lib/api";
import { ICON, cx, useNav } from "@/lib/nav";
import { CLASSES, EXTRACTED_TOPICS, FILES, GUIDE, PLAN_STEPS, WEEK } from "@/lib/mock";
import type { ConfidenceLevel, Topic } from "@/lib/types";

// Class list, upload flow, and the Week/Files tabs are placeholder data (see lib/mock.ts).
// The Topics tab is real: it lists the student's topics with their confidence.

export function Classes() {
  const { go } = useNav();
  return (
    <>
      <AppBar />
      <Page wide>
        <div className="flex items-center justify-between">
          <Title>My classes</Title>
          <Button variant="secondary" className="!h-10 !px-3 text-[14px]" onClick={() => go("add-class")}><Plus {...ICON} />Add class</Button>
        </div>
        <ul className="mt-6 space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
          {CLASSES.map((c) => (
            <li key={c.code}>
              <button onClick={() => go("class")} className="w-full text-left bg-surface border border-line rounded-card p-4 active:bg-ink/[0.02] transition-colors">
                <div className="flex items-center gap-2"><CodeChip code={c.code} /><span className="ml-auto"><Chip tone="accent">{c.exam}</Chip></span></div>
                <div className="font-serif font-medium text-[20px] leading-[26px] mt-3">{c.name}</div>
                <div className="mono text-[13px] text-ink-muted mt-1">{c.topics} topics · {c.cards} cards</div>
                <div className="flex items-center gap-3 mt-4"><Bar value={c.ret} className="flex-1" /><span className="mono text-[13px]">{c.ret}% retained</span></div>
                <div className="text-[14px] text-ink-muted mt-3">Next: <span className="text-ink">{c.next}</span></div>
              </button>
            </li>
          ))}
        </ul>
      </Page>
    </>
  );
}

export function AddClass() {
  const { go } = useNav();
  const [file, setFile] = useState(false);
  return (
    <>
      <AppBar back="classes" title={<span className="font-medium">Add a class</span>} />
      <Page>
        <Title className="hidden lg:block mb-6">Add a class</Title>
        <div className="space-y-4">
          <Field label="Class name" placeholder="Cell Biology" defaultValue="Cell Biology" />
          <Field label="Course code (optional)" placeholder="BIOL 2210" />
        </div>
        <div className="mt-6">
          {!file ? (
            <div className="h-[200px] rounded-card border-[1.5px] border-dashed border-ink/30 bg-surface/60 flex flex-col items-center justify-center text-center px-6">
              <FileText {...ICON} className="text-ink-muted" />
              <div className="font-medium text-[16px] mt-3">Add your syllabus or lecture slides</div>
              <div className="text-[14px] text-ink-muted mt-1">PDF, PPTX, or DOCX<span className="hidden lg:inline"> · or drag it here</span></div>
              <Button variant="secondary" className="mt-4 !h-11" onClick={() => setFile(true)}>Choose file</Button>
            </div>
          ) : (
            <Card className="flex items-center gap-3 pl-4 pr-2 py-2 anim-in">
              <FileText {...ICON} />
              <div className="flex-1 min-w-0">
                <div className="text-[16px] truncate">BIOL2210_syllabus.pdf</div>
                <div className="mono text-[13px] text-ink-muted">1.2 MB</div>
              </div>
              <button aria-label="Remove file" onClick={() => setFile(false)} className="size-11 grid place-items-center"><X {...ICON} /></button>
            </Card>
          )}
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
      <AppBar back="add-class" title={<span className="font-medium">Building your plan</span>} />
      <Page>
        <p className="mono text-[13px] text-ink-muted">Step {Math.min(step + 1, 4)} of 4</p>
        <Title className="mt-2">BIOL2210_syllabus.pdf</Title>
        <ol className="mt-8 border-t border-line">
          {PLAN_STEPS.map((s, i) => (
            <li key={s} className="py-4 border-b border-line">
              <div className="flex items-center gap-3">
                <span className={cx("size-6 rounded-full grid place-items-center shrink-0", i < step ? "bg-ink text-paper" : "border border-line")}>
                  {i < step && <Check size={14} strokeWidth={2} />}
                </span>
                <span className={cx("text-[16px]", i > step && "text-ink-muted")}>{s}</span>
              </div>
              {i === step && <div className="ml-9 mt-3 h-1 rounded-chip bg-ink/10 overflow-hidden"><div className="h-full w-2/5 bg-ink rounded-chip anim-indet" /></div>}
            </li>
          ))}
        </ol>
        <p className="text-[14px] leading-5 text-ink-muted mt-6">This takes about a minute. You can leave this page. Recall will text you when your plan is ready.</p>
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
      <AppBar back="add-class" title={<span className="font-medium">Confirm topics</span>} />
      <Page>
        <Title>We found 12 topics</Title>
        <p className="text-[16px] leading-6 text-ink-muted mt-2">in <span className="mono text-[14px] text-ink">BIOL2210_syllabus.pdf</span>. Rename, merge, or remove anything that&apos;s off.</p>
        <Card className="mt-6 flex items-center gap-3 pl-4 pr-1 py-1">
          <Label className="text-ink">Dates</Label>
          <span className="flex-1 text-[15px]">Exam 2 · <span className="mono text-[14px]">Oct 16</span></span>
          <button aria-label="Edit exam date" className="size-11 grid place-items-center"><Pencil {...ICON} /></button>
        </Card>
        <ul className="mt-4 bg-surface border border-line rounded-card divide-y divide-line">
          {EXTRACTED_TOPICS.map(([t, w], i) => (
            <li key={t} className="flex items-center gap-2 pl-2 pr-1">
              <label className="size-11 grid place-items-center cursor-pointer">
                <input type="checkbox" checked={on[i]} onChange={() => setOn(on.map((v, j) => (j === i ? !v : v)))} className="size-5 accent-[#1C1B19]" aria-label={`Include ${t}`} />
              </label>
              <input defaultValue={t} className={cx("flex-1 min-w-0 h-12 bg-transparent text-[16px] outline-none rounded-chip focus:bg-paper px-1", !on[i] && "text-ink-muted line-through")} aria-label="Topic name" />
              <Chip className="mono">Wk {w}</Chip>
              <span className="size-11 grid place-items-center text-ink-muted cursor-grab" aria-label="Reorder"><GripVertical {...ICON} /></span>
            </li>
          ))}
        </ul>
        <StickyBottom>
          <div className="flex items-center gap-4">
            <span className="mono text-[14px] whitespace-nowrap">{n} selected</span>
            <Button full disabled={!n} onClick={() => go("class")}>Looks right, build my plan</Button>
          </div>
        </StickyBottom>
      </Page>
    </>
  );
}

const loadTopics = () => api<{ topics: Topic[] }>(forStudent("/topics")).then((r) => r.topics);

const LEVEL: Record<ConfidenceLevel, { label: string; tone: "line" | "marker" | "good" }> = {
  red: { label: "New", tone: "line" },
  yellow: { label: "Learning", tone: "marker" },
  green: { label: "Learning", tone: "marker" },
  star: { label: "Strong", tone: "good" },
};

function TopicsTab() {
  const { go } = useNav();
  const { data, error, loading } = useLoad(loadTopics);
  if (error) return <div className="mt-6"><LoadError error={error} /></div>;
  if (loading || !data) return <Loading className="mt-6 h-48" />;
  if (data.length === 0) return <p className="mt-6 text-[16px] text-ink-muted">No topics yet.</p>;
  return (
    <ul className="mt-6 anim-in border-t border-line">
      {data.map((t) => {
        const lv = LEVEL[t.confidenceLevel];
        return (
          <li key={t.id} className="border-b border-line">
            <button onClick={() => go("topic")} className="w-full text-left py-4">
              <div className="flex items-center gap-3"><span className="flex-1 text-[16px]">{t.name}</span><Chip tone={lv.tone}>{lv.label}</Chip></div>
              <div className="mono text-[13px] text-ink-muted mt-1">{t.flashcardCount} cards</div>
              <div className="flex items-center gap-3 mt-2"><Bar value={t.confidenceScore} className="flex-1" /><span className="mono text-[13px] w-10 text-right">{t.confidenceScore ? `${t.confidenceScore}%` : "–"}</span></div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function ClassDetail() {
  const { go } = useNav();
  const [tab, setTab] = useState<"week" | "topics" | "files">("week");
  const [day, setDay] = useState(6);
  const sel = WEEK[day];
  return (
    <>
      <AppBar back="classes" title={<span className="font-medium">Cell Biology</span>} />
      <Page wide>
        <div className="flex items-center gap-3 flex-wrap"><Title>Cell Biology</Title><CodeChip code="BIOL 2210" /></div>
        <p className="text-[14px] text-ink-muted mt-2">Exam 2 · <span className="mono">Oct 16 · 12 days</span></p>
        <Segmented className="mt-5 lg:max-w-[360px]" value={tab} onChange={setTab} options={[{ id: "week", label: "Week" }, { id: "topics", label: "Topics" }, { id: "files", label: "Files" }]} />

        {tab === "week" && (
          <div className="anim-in lg:grid lg:grid-cols-[1fr_300px] lg:gap-12">
            <div>
              <ol className="mt-6 grid grid-cols-7 gap-1">
                {WEEK.map((w, i) => (
                  <li key={w.d}>
                    <button onClick={() => setDay(i)} aria-pressed={i === day} className={cx("w-full min-h-16 flex flex-col items-center gap-1 rounded-ctl py-2 border transition-colors", i === day ? "border-ink border-2" : "border-transparent")}>
                      <span className="text-[12px] text-ink-muted">{w.d}</span>
                      <span className={cx("mono text-[15px] px-1.5 rounded-chip", w.s === "today" && "bg-marker")}>{w.n}</span>
                      <span className="size-1 rounded-full bg-ink/60" />
                    </button>
                  </li>
                ))}
              </ol>
              <div className="mt-6">
                <div className="flex items-baseline justify-between">
                  <H2>{sel.s === "today" ? "Today · Sunday" : `${sel.d} · ${sel.topic}`}</H2>
                  {sel.s === "done" && <span className="flex items-center gap-1 text-[14px] text-good"><Check size={16} strokeWidth={2} />Done</span>}
                  {sel.s === "missed" && <span className="text-[14px] text-accent-text">Missed</span>}
                </div>
                <ul className="mt-3 bg-surface border border-line rounded-card divide-y divide-line px-4">
                  {[
                    { k: "Study guide", t: sel.topic, m: "12 min read", go: "topic" as const, st: sel.s === "today" ? null : "Read" },
                    { k: "Flashcards", t: "8 due", m: sel.s === "today" ? "about 4 min" : "8 reviewed", go: "study" as const, st: sel.s === "today" ? "Due" : "Done" },
                    { k: "Quiz", t: "10 questions", m: sel.s === "today" ? "about 6 min" : "9/10", go: "question" as const, st: sel.s === "today" ? "Not started" : sel.s === "missed" ? "Missed" : "Completed" },
                  ].map((r) => (
                    <li key={r.k}>
                      <Row
                        onClick={() => go(r.go)}
                        title={<><Label className="!text-[11px]">{r.k}</Label><span className="block mt-0.5">{r.t}</span></>}
                        meta={<span className="flex items-center gap-2 flex-wrap">{r.m}<SourceChip>Lecture 5.pptx</SourceChip></span>}
                        right={r.st && <Chip tone={r.st === "Completed" || r.st === "Done" || r.st === "Read" ? "good" : r.st === "Missed" ? "accent" : "line"}>{r.st}</Chip>}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-10 lg:mt-6">
              <Label>This week</Label>
              <ul className="mt-2 border-t border-line">
                {WEEK.slice(0, 6).map((w) => (
                  <li key={w.d} className="flex items-center gap-4 py-3 border-b border-line text-[15px]">
                    <span className="mono text-[13px] text-ink-muted w-8">{w.d}</span>
                    <span className="flex-1">{w.topic}</span>
                    {w.s === "done" ? <Check size={16} strokeWidth={2} className="text-good" aria-label="done" /> : <span className="text-[13px] text-accent-text">missed</span>}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {tab === "topics" && <TopicsTab />}

        {tab === "files" && (
          <div className="mt-6 anim-in">
            <ul className="bg-surface border border-line rounded-card divide-y divide-line">
              {FILES.map(([f, d, m]) => (
                <li key={f} className="flex items-center gap-3 px-4 py-3.5">
                  <FileText {...ICON} />
                  <div className="flex-1"><div className="text-[16px]">{f}</div><div className="text-[13px] text-ink-muted"><span className="mono">{d}</span> · {m}</div></div>
                </li>
              ))}
            </ul>
            <Button variant="secondary" className="mt-4" onClick={() => go("add-class")}><Plus {...ICON} />Add lecture slides</Button>
          </div>
        )}
      </Page>
    </>
  );
}

export function TopicDetail() {
  const { go } = useNav();
  const [menu, setMenu] = useState(false);
  return (
    <>
      <AppBar back="class" title={<span className="font-medium">Study guide</span>} right={
        <div className="relative">
          <button aria-label="More" onClick={() => setMenu(!menu)} className="size-11 grid place-items-center -mr-2.5"><MoreHorizontal {...ICON} /></button>
          {menu && <div className="absolute right-0 top-12 w-40 bg-surface border border-line rounded-ctl py-1 anim-in">{["Edit", "Regenerate"].map((x) => <button key={x} className="w-full text-left px-4 h-11 text-[15px] active:bg-ink/5">{x}</button>)}</div>}
        </div>
      } />
      <Page>
        <Title className="text-[36px] leading-10">Glycolysis</Title>
        <div className="flex flex-wrap gap-2 mt-3"><CodeChip code="BIOL 2210" /><Chip className="mono">Wk 6</Chip><SourceChip>From Lecture 5.pptx, slides 12–18</SourceChip></div>
        <p className="mono text-[13px] text-ink-muted mt-3">Next review: today</p>
        <article className="mt-8 space-y-8 text-[16px] leading-[26px]">
          <section>
            <H2>The short version</H2>
            <p className="mt-2">{GUIDE.summary}</p>
          </section>
          <section>
            <H2>Key terms</H2>
            <dl className="mt-2 border-t border-line">
              {GUIDE.terms.map(([t, d]) => (
                <div key={t} className="py-3 border-b border-line"><dt className="font-semibold">{t}</dt><dd className="text-ink-muted">{d}</dd></div>
              ))}
            </dl>
          </section>
          <section>
            <H2>Steps</H2>
            <ol className="mt-2 space-y-2">
              {GUIDE.steps.map((s, i) => (
                <li key={i} className="grid grid-cols-[28px_1fr]"><span className="mono text-[14px] text-ink-muted pt-0.5">{String(i + 1).padStart(2, "0")}</span>{s}</li>
              ))}
            </ol>
          </section>
        </article>
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
