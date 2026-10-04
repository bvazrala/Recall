"use client";

import { useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { AppBar, Bar, Button, Card, Chip, H2, IconBtn, Label, Page, Segmented, StickyBottom, Title } from "@/components/ui";
import { ICON, cx, useNav } from "@/lib/nav";
import { PAST_QUIZZES, QUESTION as Q, QUIZ_REVIEW } from "@/lib/mock";

// Quizzes have no server routes yet, so every screen here runs on placeholder data (see lib/mock.ts).

export function Quizzes() {
  const { go } = useNav();
  return (
    <>
      <AppBar />
      <Page wide>
        <Title>Quizzes</Title>
        <div className="mt-6 lg:grid lg:grid-cols-[2fr_1fr] lg:gap-0">
          <div className="lg:pr-10">
            <Card className="p-5 lg:p-8">
              <Label>Today&apos;s quiz</Label>
              <h2 className="font-serif font-medium text-[24px] leading-[30px] mt-2 lg:text-[32px] lg:leading-9">Glycolysis and the Krebs cycle</h2>
              <p className="mono text-[14px] text-ink-muted mt-2">10 questions · about 6 min</p>
              <div className="flex gap-2 mt-3"><Chip>Glycolysis</Chip><Chip>Krebs cycle</Chip></div>
              <div className="mt-5 flex items-center gap-3"><Bar value={0} className="flex-1" /><span className="text-[14px] text-ink-muted">Not started</span></div>
              <Button full className="mt-5 lg:w-auto lg:px-10" onClick={() => go("question")}>Start quiz</Button>
            </Card>
          </div>
          <aside className="mt-10 lg:mt-0 lg:pl-10 lg:border-l lg:border-line lg:sticky lg:top-10 lg:self-start">
            <H2>Past quizzes</H2>
            <ul className="mt-3 border-t border-line">
              {PAST_QUIZZES.map((p) => (
                <li key={p.date} className="border-b border-line">
                  <button onClick={() => go("past-quiz")} className="w-full text-left py-3.5 min-h-14">
                    <div className="flex items-baseline gap-3">
                      <span className="mono text-[13px] text-ink-muted w-[84px] shrink-0">{p.date}</span>
                      <span className="flex-1 text-[16px]">{p.topic}</span>
                      <span className="mono text-[14px]">{p.s}/10</span>
                    </div>
                    <Bar value={p.s * 10} tone={p.s >= 8 ? "good" : "ink"} className="mt-2 ml-[96px]" />
                  </button>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </Page>
    </>
  );
}

type AnswerState = "idle" | "selected" | "correct" | "wrong" | "reveal";

function AnswerRow({ letter, text, state, onClick }: { letter: string; text: string; state: AnswerState; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cx(
        "w-full min-h-14 flex items-center gap-3 px-4 rounded-ctl bg-surface text-left transition-colors duration-150",
        state === "idle" && "border border-line",
        state === "selected" && "border-2 border-ink",
        (state === "correct" || state === "reveal") && "border-2 border-good",
        state === "wrong" && "border-2 border-accent",
      )}
    >
      <span className="mono text-[14px] text-ink-muted w-4">{letter}</span>
      <span className="flex-1 text-[16px]">{text}</span>
      {(state === "correct" || state === "reveal") && <Check {...ICON} className="text-good" aria-label="Correct" />}
      {state === "wrong" && <X {...ICON} className="text-accent" aria-label="Incorrect" />}
    </button>
  );
}

export function Question() {
  const { go } = useNav();
  const [sel, setSel] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 bg-paper px-5 max-w-[640px] w-full mx-auto safe-top">
        <div className="safe-row flex items-center gap-4">
          <IconBtn label="Exit quiz" onClick={() => setConfirm(true)}><X {...ICON} /></IconBtn>
          <div className="flex-1 grid grid-cols-10 gap-1" aria-label="Question 4 of 10">
            {Array.from({ length: 10 }, (_, i) => <span key={i} className={cx("h-1 rounded-chip", i < 3 ? "bg-ink" : i === 3 ? "bg-accent" : "bg-ink/15")} />)}
          </div>
        </div>
      </header>
      <main className="flex-1 px-5 pt-7 pb-12 max-w-[640px] w-full mx-auto anim-in">
        <p className="mono text-[13px] text-ink-muted">Question 4 of 10</p>
        <h1 className="font-serif font-medium text-[24px] leading-[30px] mt-2">{Q.prompt}</h1>
        <div className="mt-6 space-y-2.5">
          {Q.options.map((o, i) => {
            let st: AnswerState = sel === i ? "selected" : "idle";
            if (checked) st = i === Q.correct ? (sel === i ? "correct" : "reveal") : sel === i ? "wrong" : "idle";
            return <AnswerRow key={o} letter={"ABCD"[i]} text={o} state={st} onClick={checked ? undefined : () => setSel(i)} />;
          })}
        </div>
        {checked && (
          <div className="mt-5 p-4 rounded-card bg-surface border border-line anim-in">
            <Label className={sel === Q.correct ? "!text-good" : "!text-accent-text"}>{sel === Q.correct ? "Correct" : "Not quite"}</Label>
            <p className="text-[15px] leading-6 mt-1.5">{Q.why}</p>
          </div>
        )}
        <StickyBottom>
          {!checked ? <Button full disabled={sel === null} onClick={() => setChecked(true)}>Check answer</Button> : <Button full onClick={() => go("results")}>Next</Button>}
        </StickyBottom>
      </main>
      {confirm && (
        <div className="fixed inset-0 z-50 bg-ink/40 flex items-end sm:items-center justify-center p-4" onClick={() => setConfirm(false)}>
          <div className="w-full max-w-[380px] bg-surface rounded-card p-5 anim-in" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal>
            <H2>Leave this quiz?</H2>
            <p className="text-[15px] text-ink-muted mt-2">Your answers so far are saved. You can resume from question 4.</p>
            <div className="mt-5 grid grid-cols-2 gap-3"><Button variant="secondary" onClick={() => setConfirm(false)}>Keep going</Button><Button onClick={() => go("quizzes")}>Leave</Button></div>
          </div>
        </div>
      )}
    </div>
  );
}

export function Results() {
  const { go } = useNav();
  return (
    <>
      <AppBar onClose={() => go("quizzes")} title={<span className="font-medium">Results</span>} right={<span className="w-6" />} />
      <Page>
        <Label>Glycolysis and the Krebs cycle</Label>
        <div className="font-serif font-medium text-[72px] leading-[72px] mt-3">8<span className="text-ink-muted">/10</span></div>
        <p className="text-[16px] mt-3">You missed 2, both from Glycolysis.</p>
        <ul className="mt-6 border-t border-line">
          {["Which enzyme catalyzes the committed step of glycolysis?", "How many NADH does glycolysis produce per glucose?"].map((q, i) => (
            <li key={q} className="py-3.5 border-b border-line flex gap-3"><X {...ICON} className="text-accent shrink-0 mt-0.5" aria-label="Missed" /><span className="mono text-[13px] text-ink-muted pt-0.5">Q{[4, 7][i]}</span><span className="text-[15px]">{q}</span></li>
          ))}
        </ul>
        <div className="mt-8 flex flex-col gap-1">
          <Button full onClick={() => go("past-quiz")}>Review answers</Button>
          <Button variant="text" onClick={() => go("quizzes")}>Back to quizzes</Button>
        </div>
      </Page>
    </>
  );
}

export function PastQuiz() {
  const [f, setF] = useState<"all" | "missed">("all");
  const [open, setOpen] = useState<Set<number>>(new Set([2]));
  const list = QUIZ_REVIEW.map((r, i) => ({ ...r, i })).filter((r) => f === "all" || !r.ok);
  return (
    <>
      <AppBar back="quizzes" title={<span className="font-medium">Review</span>} />
      <Page>
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="font-serif font-medium text-[22px] leading-7"><span className="mono text-[15px] text-ink-muted block">Sat, Oct 3</span>Cell membranes</h1>
          <span className="font-serif font-medium text-[32px]">9/10</span>
        </div>
        <Segmented className="mt-5" value={f} onChange={setF} options={[{ id: "all", label: "All 10" }, { id: "missed", label: "Missed 1" }]} />
        <ul className="mt-5 space-y-3">
          {list.map((r) => {
            const isOpen = open.has(r.i);
            return (
              <li key={r.i}><Card>
                <button className="w-full flex gap-3 p-4 text-left min-h-14" aria-expanded={isOpen} onClick={() => { const n = new Set(open); if (isOpen) n.delete(r.i); else n.add(r.i); setOpen(n); }}>
                  <span className="mono text-[13px] text-ink-muted pt-0.5">{String(r.i + 1).padStart(2, "0")}</span>
                  <span className="flex-1 text-[16px]">{r.p}</span>
                  {r.ok ? <Check {...ICON} className="text-good shrink-0" aria-label="Correct" /> : <X {...ICON} className="text-accent shrink-0" aria-label="Missed" />}
                  <ChevronDown {...ICON} className={cx("shrink-0 text-ink-muted transition-transform duration-200", isOpen && "rotate-180")} />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pl-[52px] space-y-2 text-[15px] anim-in">
                    <div><Label className="!text-[11px]">Your answer</Label><div className={cx("flex items-center gap-2", !r.ok && "text-accent-text")}>{r.ok ? <Check size={16} className="text-good" /> : <X size={16} />}{r.you}</div></div>
                    {!r.ok && <div><Label className="!text-[11px]">Correct answer</Label><div className="flex items-center gap-2"><Check size={16} className="text-good" />{r.right}</div></div>}
                    {r.why && <p className="text-ink-muted leading-6 pt-1">{r.why}</p>}
                  </div>
                )}
              </Card></li>
            );
          })}
        </ul>
      </Page>
    </>
  );
}
