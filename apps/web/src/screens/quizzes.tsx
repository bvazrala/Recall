"use client";

import { useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { AppBar, Bar, Button, Card, Chip, Dialog, Folder, FolderPanel, H2, IconBtn, Mark, MarkOver, Page, Segmented, StickyBottom, Title } from "@/components/ui";
import { ICON, cx, useNav } from "@/lib/nav";
import { PAST_QUIZZES, QUESTION as Q, QUIZ_REVIEW } from "@/lib/mock";

// Quizzes have no server routes yet, so every screen here runs on placeholder data (see lib/mock.ts).

// The printed sheet a quiz is written on: an index card without the red line.
const SHEET = "rounded-[3px] bg-surface shadow-[0_1px_0_var(--color-line),0_10px_20px_-14px_rgba(30,63,150,0.55)]";
// A letter or number in the left column of a sheet, with room for a mark drawn over it.
const SLOT = "relative w-7 shrink-0 text-center font-bold";

export function Quizzes() {
  const { go } = useNav();
  return (
    <>
      <AppBar />
      <Page>
        <Title className="pt-3.5 lg:pt-0">Quizzes</Title>
        <div className="lg:mt-10 lg:flex lg:flex-wrap lg:items-start lg:gap-x-14 lg:gap-y-12">
          <Folder tab="Today's quiz" className="mt-[21px] min-w-0 lg:mt-0 lg:flex-[2_1_480px]">
            <h2 className="font-hand text-[24px] leading-[1.25] text-pen lg:text-[35px] lg:leading-[1.2]">Glycolysis and the Krebs cycle</h2>
            <p className="mt-2 lg:mt-2.5 lg:text-[18px]">10 questions, about 6 minutes.</p>
            <div className="mt-3.5 flex flex-wrap gap-2 lg:mt-4 lg:gap-2.5"><Chip>Glycolysis</Chip><Chip>Krebs cycle</Chip></div>
            <div className="mt-5 flex items-center gap-3"><Bar value={0} className="flex-1" /><span className="text-[15px] text-folder-text">Not started yet</span></div>
            <Button full className="mt-[30px] lg:mt-8 lg:w-auto lg:min-w-[260px] lg:px-8" onClick={() => go("question")}>Start quiz</Button>
          </Folder>
          <aside className="mt-10 min-w-0 lg:mt-2 lg:flex-[1_1_300px]">
            <H2>Past quizzes</H2>
            <Card className="mt-3">
              <ul className="divide-y divide-line">
                {PAST_QUIZZES.map((p) => (
                  <li key={p.date}>
                    <button onClick={() => go("past-quiz")} className="block w-full px-3.5 py-3 text-left">
                      <span className="flex items-baseline gap-3">
                        <span className="flex-1 font-bold">{p.topic}</span>
                        <span className="font-hand text-[19px] leading-none text-pen">{p.s}/10</span>
                      </span>
                      <span className="block text-[15px] text-ink-muted">{p.date}</span>
                      <Bar value={p.s * 10} className="mt-2" />
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          </aside>
        </div>
      </Page>
    </>
  );
}

// Filled progress dashes are drawn by hand, so each one tilts a little.
const TILT = ["-rotate-[5deg]", "rotate-[4deg]", "-rotate-[3deg]", "rotate-[5deg]"];

export function Question() {
  const { go } = useNav();
  const [sel, setSel] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const right = sel === Q.correct;
  return (
    <div className="paper flex min-h-screen flex-col lg:[--sheet:640px]">
      <header className="paper-band page-x safe-top sticky top-0 z-20">
        <div className="safe-row flex items-center gap-3">
          <IconBtn label="Exit quiz" onClick={() => setConfirm(true)}><X size={24} strokeWidth={2} /></IconBtn>
          <div className="flex min-w-0 flex-1 items-center gap-[5px]" aria-hidden>
            {Array.from({ length: 10 }, (_, i) => <span key={i} className={cx("h-1 w-[17px] rounded-[2px]", i < 4 ? cx("bg-pen", TILT[i % TILT.length]) : "bg-[#c6d4ea]")} />)}
          </div>
          <p className="shrink-0 font-hand text-[17px] text-ink-muted"><span className="sr-only">Question </span>4 of 10</p>
        </div>
      </header>
      <main className="page-x anim-in flex flex-1 flex-col lg:pb-16">
        <div className={cx("mt-2 px-4 pt-5 pb-1.5", SHEET)}>
          <h1 className="text-[22px] leading-[1.35] font-bold">{Q.prompt}</h1>
          <ol className="mt-3">
            {Q.options.map((o, i) => {
              const picked = sel === i;
              const correct = checked && i === Q.correct;
              // Before checking, the student circles a choice. After, the circle marks the right answer
              // and a red X goes through a wrong pick.
              const circled = checked ? correct : picked;
              return (
                <li key={o} className="border-t border-[#e6ecf5]">
                  <button onClick={() => setSel(i)} disabled={checked} aria-pressed={checked ? undefined : picked} className="flex min-h-[54px] w-full items-center gap-3.5 text-left">
                    <span className={cx(SLOT, circled ? "text-ink" : "text-ink-muted")}>
                      {"ABCD"[i]}
                      {circled && <MarkOver kind="circle" size={40} className="text-pen" />}
                      {checked && picked && !correct && <MarkOver kind="cross" size={30} className="text-redpen" />}
                    </span>
                    <span className={cx("min-w-0 flex-1 [overflow-wrap:anywhere]", circled && "font-bold")}>{o}</span>
                    {checked && picked && !correct && <span className="shrink-0 font-hand text-[15px] text-redpen"><span className="sr-only">Incorrect, </span>your answer</span>}
                    {correct && <Mark kind="check" label={picked ? "Correct, your answer" : "Correct answer"} className="text-pen" />}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
        {checked && (
          <div className="anim-in mt-[22px]">
            <p className={cx("font-hand text-[25px] leading-[1.15]", right ? "text-pen" : "text-redpen")}>{right ? "Correct." : "Not quite."}</p>
            <p className="mt-2">{Q.why}</p>
          </div>
        )}
        <StickyBottom>
          {!checked ? <Button full disabled={sel === null} onClick={() => setChecked(true)}>Check answer</Button> : <Button full onClick={() => go("results")}>Next question</Button>}
        </StickyBottom>
      </main>
      {confirm && (
        <Dialog title="Leave this quiz?" onClose={() => setConfirm(false)}>
          <p className="mt-2 text-ink-muted">Your answers so far are saved. You can resume from question 4.</p>
          <div className="mt-7 grid grid-cols-2 gap-3"><Button variant="secondary" onClick={() => setConfirm(false)}>Keep going</Button><Button onClick={() => go("quizzes")}>Leave</Button></div>
        </Dialog>
      )}
    </div>
  );
}

const MISSED = [
  [4, "Which enzyme catalyzes the committed step of glycolysis?"],
  [7, "How many NADH does glycolysis produce per glucose?"],
] as const;

// A graded sheet: the score in handwriting, and red pen only on the misses.
export function Results() {
  const { go } = useNav();
  return (
    <>
      <AppBar onClose={() => go("quizzes")} title="Results" right={<span className="w-11" />} />
      <Page sheet={560}>
        <div className={cx("mt-2 px-4 pt-5 pb-1.5 lg:mt-0", SHEET)}>
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-[22px] leading-[1.35] font-bold">Glycolysis and the Krebs cycle</h1>
            <p className="shrink-0 font-hand text-[52px] leading-[0.9] text-pen" aria-label="8 out of 10">8<span className="text-[30px]">/10</span></p>
          </div>
          <p className="mt-3">You missed 2, both from Glycolysis.</p>
          <ul className="mt-3">
            {MISSED.map(([n, q]) => (
              <li key={n} className="flex min-h-[54px] items-center gap-3.5 border-t border-[#e6ecf5] py-2">
                <span className={cx(SLOT, "text-ink-muted")}><span className="sr-only">Missed question </span>{n}<MarkOver kind="cross" size={30} className="text-redpen" /></span>
                <span>{q}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-8 flex flex-col gap-2">
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
      <AppBar back="quizzes" title="Review" />
      <Page sheet={640}>
        <div className="flex items-end justify-between gap-4 pt-1.5 lg:pt-0">
          <div>
            <p className="font-hand text-[18px] leading-[1.3] text-ink-muted">Sat, Oct 3</p>
            <Title size="form">Cell membranes</Title>
          </div>
          <p className="shrink-0 font-hand text-[38px] leading-[1.1] text-pen" aria-label="9 out of 10">9/10</p>
        </div>
        <div className="mt-6">
          <Segmented value={f} onChange={setF} options={[{ id: "all", label: "All 10" }, { id: "missed", label: "Missed 1" }]} />
          <FolderPanel>
            <ul className="flex flex-col gap-3">
              {list.map((r) => {
                const isOpen = open.has(r.i);
                return (
                  <li key={r.i}>
                    <div className={SHEET}>
                      <button className="flex min-h-14 w-full items-center gap-3 py-3 pr-3 pl-2.5 text-left" aria-expanded={isOpen} onClick={() => { const n = new Set(open); if (isOpen) n.delete(r.i); else n.add(r.i); setOpen(n); }}>
                        <span className={cx(SLOT, "text-ink-muted")}>{r.i + 1}{!r.ok && <MarkOver kind="cross" size={30} className="text-redpen" />}</span>
                        <span className="flex-1">{r.p}</span>
                        {r.ok ? <Mark kind="check" label="Correct" className="text-pen" /> : <span className="sr-only">Missed</span>}
                        <ChevronDown {...ICON} className={cx("shrink-0 text-ink-muted transition-transform duration-200", isOpen && "rotate-180")} />
                      </button>
                      {isOpen && (
                        <div className="anim-in pr-3 pb-4 pl-[50px]">
                          <ul className="border-t border-[#e6ecf5]">
                            <li className="flex min-h-11 items-center gap-2 py-1.5">
                              <span className={cx("flex-1", r.ok && "font-bold")}>{r.you}</span>
                              <span className={cx("shrink-0 font-hand text-[15px]", r.ok ? "text-pen" : "text-redpen")}>your answer</span>
                              {r.ok ? <Mark kind="check" size={18} className="text-pen" /> : <Mark kind="cross" size={18} label="Incorrect" className="text-redpen" />}
                            </li>
                            {!r.ok && (
                              <li className="flex min-h-11 items-center gap-2 border-t border-[#e6ecf5] py-1.5">
                                <span className="flex-1 font-bold">{r.right}</span>
                                <Mark kind="check" size={18} label="Correct answer" className="text-pen" />
                              </li>
                            )}
                          </ul>
                          {r.why && <p className="pt-2 text-[15px] text-ink-muted">{r.why}</p>}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </FolderPanel>
        </div>
      </Page>
    </>
  );
}
