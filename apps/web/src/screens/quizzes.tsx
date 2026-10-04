"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { ChevronDown, X } from "lucide-react";
import { AppBar, Bar, Button, Card, Chip, Dialog, Folder, FolderPanel, H2, IconBtn, Mark, MarkOver, Page, Segmented, StickyBottom, Title } from "@/components/ui";
import { LoadError, Loading } from "@/components/load-state";
import { api, forStudent, useLoad } from "@/lib/api";
import { joinNames } from "@/lib/day-data";
import { ICON, cx, useNav } from "@/lib/nav";
import { PAST_QUIZZES, QUIZ_REVIEWS } from "@/lib/mock";
import type { DayResponse, Quiz, QuizAnswer } from "@/lib/types";

// Today's quiz is real: Claude writes it from today's flashcards (apps/server/src/lib/quiz.ts) and the
// server grades it. Past quizzes and the review screen still run on placeholder data (see lib/mock.ts).

// The printed sheet a quiz is written on: an index card without the red line.
const SHEET = "rounded-[3px] bg-surface shadow-[0_1px_0_var(--color-line),0_10px_20px_-14px_rgba(30,63,150,0.55)]";
// A letter or number in the left column of a sheet, with room for a mark drawn over it.
const SLOT = "relative w-7 shrink-0 text-center font-bold";

// Reads today's quiz without writing one; the day's topics stand in until it exists.
async function loadToday() {
  const [{ quiz }, { topics }] = await Promise.all([
    api<{ quiz: Quiz | null }>(forStudent("/quiz")),
    api<DayResponse>(forStudent("/day")),
  ]);
  return { quiz, topics: quiz?.topics ?? topics.map((t) => t.name) };
}

const startQuiz = () => api<{ quiz: Quiz }>(forStudent("/quiz"), { method: "POST" }).then((r) => r.quiz);
const loadQuiz = () => api<{ quiz: Quiz | null }>(forStudent("/quiz")).then((r) => r.quiz);

export function Quizzes() {
  const { go } = useNav();
  const { data, error, loading } = useLoad(loadToday);
  const quiz = data?.quiz;
  const total = quiz?.questions.length ?? 10;
  const done = !!quiz && quiz.answeredCount >= total;
  const status = !quiz || quiz.answeredCount === 0
    ? "Not started yet"
    : done ? `Done: ${quiz.correctCount} of ${total} right` : `${quiz.answeredCount} of ${total} answered`;
  return (
    <>
      <AppBar />
      <Page>
        <Title className="pt-3.5 lg:pt-0">Quizzes</Title>
        <div className="lg:mt-10 lg:flex lg:flex-wrap lg:items-start lg:gap-x-14 lg:gap-y-12">
          <Folder tab="Today's quiz" className="mt-[21px] min-w-0 lg:mt-0 lg:flex-[2_1_480px]">
            {error ? <LoadError error={error} /> : loading || !data ? <Loading /> : data.topics.length === 0 ? (
              <p className="lg:text-[18px]">No topics today, so there&apos;s nothing to quiz on yet.</p>
            ) : (
              <>
                <h2 className="font-hand text-[24px] leading-[1.25] text-pen lg:text-[35px] lg:leading-[1.2]">{joinNames(data.topics)}</h2>
                <p className="mt-2 lg:mt-2.5 lg:text-[18px]">{total} questions, about {Math.max(1, Math.round((total * 35) / 60))} minutes.</p>
                <div className="mt-3.5 flex flex-wrap gap-2 lg:mt-4 lg:gap-2.5">{data.topics.map((t) => <Chip key={t}>{t}</Chip>)}</div>
                <div className="mt-5 flex items-center gap-3"><Bar value={quiz ? (quiz.answeredCount / total) * 100 : 0} className="flex-1" /><span className="text-[15px] text-folder-text">{status}</span></div>
                <Button full className="mt-[30px] lg:mt-8 lg:w-auto lg:min-w-[260px] lg:px-8" onClick={() => go(done ? "results" : "question")}>
                  {done ? "See results" : quiz && quiz.answeredCount > 0 ? "Resume quiz" : "Start quiz"}
                </Button>
              </>
            )}
          </Folder>
          <aside className="mt-10 min-w-0 lg:mt-2 lg:flex-[1_1_300px]">
            <H2>Past quizzes</H2>
            <Card className="mt-3">
              <ul className="divide-y divide-line">
                {PAST_QUIZZES.map((p) => (
                  <li key={p.id}>
                    <Link href={`/quizzes/review?quiz=${p.id}`} className="block w-full px-3.5 py-3 text-left">
                      <span className="flex items-baseline gap-3">
                        <span className="flex-1 font-bold">{p.topic}</span>
                        <span className="font-hand text-[19px] leading-none text-pen">{p.s}/10</span>
                      </span>
                      <span className="block text-[15px] text-ink-muted">{p.date}</span>
                      <Bar value={p.s * 10} className="mt-2" />
                    </Link>
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
  const { data: quiz, error, loading, reload } = useLoad(startQuiz);
  if (error) return <div className="paper page-x min-h-screen pt-[100px]"><LoadError error={error} /></div>;
  if (loading || !quiz) {
    return (
      <div className="paper page-x min-h-screen pt-[100px]">
        <p className="font-hand text-[24px] text-pen">Writing today&apos;s quiz…</p>
        <p className="mt-1 text-ink-muted">The first time each day this takes about 20 seconds.</p>
        <Loading className="mt-6 h-[360px]" />
      </div>
    );
  }
  return <Sheet key={quiz.id} quiz={quiz} reload={reload} />;
}

function Sheet({ quiz, reload }: { quiz: Quiz; reload: () => void }) {
  const { go } = useNav();
  const total = quiz.questions.length;
  // Start at the first unanswered question, so leaving and coming back resumes.
  const [i, setI] = useState(() => Math.min(quiz.answeredCount, Math.max(total - 1, 0)));
  const [sel, setSel] = useState<number | null>(null);
  const [answer, setAnswer] = useState<QuizAnswer | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<string>();
  const [confirm, setConfirm] = useState(false);

  const q = quiz.questions[i];
  const check = useCallback(async () => {
    if (sel === null || busy || !q) return;
    setBusy(true);
    setFailed(undefined);
    try {
      setAnswer(await api<QuizAnswer>(`/quizzes/${quiz.id}/answers`, { method: "POST", body: JSON.stringify({ questionId: q.id, choice: sel }) }));
    } catch (e) {
      // 409: answered already (another tab, a double click). The reloaded quiz resumes after it.
      if ((e as Error).message.includes("409")) reload();
      else setFailed((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [sel, busy, q, quiz.id, reload]);

  if (total === 0 || quiz.answeredCount >= total) {
    return (
      <div className="paper page-x min-h-screen pt-[100px]">
        <p className="font-hand text-[24px] text-pen">You&apos;ve finished today&apos;s quiz.</p>
        <Button full className="mt-6" onClick={() => go("results")}>See results</Button>
      </div>
    );
  }

  const checked = answer !== null;
  const filled = i + (checked ? 1 : 0); // dashes for answered questions
  const resumeAt = Math.min(filled + 1, total);
  const next = () => {
    if (i + 1 >= total) return go("results");
    setI(i + 1);
    setSel(null);
    setAnswer(null);
  };
  return (
    <div className="paper flex min-h-screen flex-col lg:[--sheet:640px]">
      <header className="paper-band page-x safe-top sticky top-0 z-20">
        <div className="safe-row flex items-center gap-3">
          <IconBtn label="Exit quiz" onClick={() => setConfirm(true)}><X size={24} strokeWidth={2} /></IconBtn>
          <div className="flex min-w-0 flex-1 items-center gap-[5px]" aria-hidden>
            {Array.from({ length: total }, (_, n) => <span key={n} className={cx("h-1 w-[17px] rounded-[2px]", n < filled ? cx("bg-pen", TILT[n % TILT.length]) : "bg-[#c6d4ea]")} />)}
          </div>
          <p className="shrink-0 font-hand text-[17px] text-ink-muted"><span className="sr-only">Question </span>{i + 1} of {total}</p>
        </div>
      </header>
      <main key={q.id} className="page-x anim-in flex flex-1 flex-col lg:pb-16">
        <p className="mt-2 font-hand text-[17px] text-ink-muted">{q.topic}</p>
        <div className={cx("mt-1 px-4 pt-5 pb-1.5", SHEET)}>
          <h1 className="text-[22px] leading-[1.35] font-bold">{q.prompt}</h1>
          <ol className="mt-3">
            {q.choices.map((o, n) => {
              const picked = sel === n;
              const correct = checked && n === answer.correctChoice;
              // Before checking, the student circles a choice. After, the circle marks the right answer
              // and a red X goes through a wrong pick.
              const circled = checked ? correct : picked;
              return (
                <li key={n} className="border-t border-[#e6ecf5]">
                  <button onClick={() => setSel(n)} disabled={checked || busy} aria-pressed={checked ? undefined : picked} className="flex min-h-[54px] w-full items-center gap-3.5 text-left">
                    <span className={cx(SLOT, circled ? "text-ink" : "text-ink-muted")}>
                      {"ABCD"[n]}
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
            <p className={cx("font-hand text-[25px] leading-[1.15]", answer.correct ? "text-pen" : "text-redpen")}>{answer.correct ? "Correct." : "Not quite."}</p>
            <p className="mt-2">{answer.explanation}</p>
          </div>
        )}
        {failed && <p className="mt-4 text-redpen">Couldn&apos;t save that answer: {failed}</p>}
        <StickyBottom>
          {!checked
            ? <Button full loading={busy} disabled={sel === null} onClick={check}>Check answer</Button>
            : <Button full onClick={next}>{i + 1 >= total ? "See results" : "Next question"}</Button>}
        </StickyBottom>
      </main>
      {confirm && (
        <Dialog title="Leave this quiz?" onClose={() => setConfirm(false)}>
          <p className="mt-2 text-ink-muted">Your answers so far are saved. You can resume from question {resumeAt}.</p>
          <div className="mt-7 grid grid-cols-2 gap-3"><Button variant="secondary" onClick={() => setConfirm(false)}>Keep going</Button><Button onClick={() => go("quizzes")}>Leave</Button></div>
        </Dialog>
      )}
    </div>
  );
}

// A graded sheet: the score in handwriting, and red pen only on the misses.
export function Results() {
  const { go } = useNav();
  const { data: quiz, error, loading } = useLoad(loadQuiz);
  if (error) return <><AppBar onClose={() => go("quizzes")} title="Results" right={<span className="w-11" />} /><Page sheet={560}><LoadError error={error} /></Page></>;
  if (loading) return <><AppBar onClose={() => go("quizzes")} title="Results" right={<span className="w-11" />} /><Page sheet={560}><Loading className="h-[360px]" /></Page></>;

  const total = quiz?.questions.length ?? 0;
  const missed = (quiz?.questions ?? []).map((q, n) => ({ ...q, n: n + 1 })).filter((q) => q.result && !q.result.correct);
  const missedTopics = [...new Set(missed.map((q) => q.topic))];
  const summary = !quiz
    ? "You haven't taken today's quiz yet."
    : missed.length === 0
      ? quiz.answeredCount < total ? `No misses so far. ${total - quiz.answeredCount} questions left.` : "You got every question right."
      : `You missed ${missed.length}, from ${joinNames(missedTopics)}.`;
  return (
    <>
      <AppBar onClose={() => go("quizzes")} title="Results" right={<span className="w-11" />} />
      <Page sheet={560}>
        <div className={cx("mt-2 px-4 pt-5 pb-1.5 lg:mt-0", SHEET)}>
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-[22px] leading-[1.35] font-bold">{quiz ? joinNames(quiz.topics) : "Today's quiz"}</h1>
            {quiz && <p className="shrink-0 font-hand text-[52px] leading-[0.9] text-pen" aria-label={`${quiz.correctCount} out of ${total}`}>{quiz.correctCount}<span className="text-[30px]">/{total}</span></p>}
          </div>
          <p className="mt-3">{summary}</p>
          <ul className="mt-3">
            {missed.map((q) => (
              <li key={q.id} className="border-t border-[#e6ecf5] py-3">
                <div className="flex items-start gap-3.5">
                  <span className={cx(SLOT, "text-ink-muted")}><span className="sr-only">Missed question </span>{q.n}<MarkOver kind="cross" size={30} className="text-redpen" /></span>
                  <div className="min-w-0 flex-1">
                    <p>{q.prompt}</p>
                    {q.result!.chosen >= 0 && <p className="mt-1.5 text-[15px] text-redpen">Your answer: {q.choices[q.result!.chosen]}</p>}
                    <p className="mt-1 text-[15px] font-bold">Answer: {q.choices[q.result!.correctChoice]}</p>
                    <p className="mt-1 text-[15px] text-ink-muted">{q.result!.explanation}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-8 flex flex-col gap-2">
          {quiz && quiz.answeredCount < total && <Button full onClick={() => go("question")}>Resume quiz</Button>}
          <Button variant="text" onClick={() => go("quizzes")}>Back to quizzes</Button>
        </div>
      </Page>
    </>
  );
}

export function PastQuiz({ quizId }: { quizId: string }) {
  const quiz = PAST_QUIZZES.find((q) => q.id === quizId);
  const review = QUIZ_REVIEWS[quizId] ?? [];
  const total = review.length;
  const score = review.filter((r) => r.ok).length;
  const missed = total - score;
  const [f, setF] = useState<"all" | "missed">("all");
  const [open, setOpen] = useState<Set<number>>(new Set(review.flatMap((r, i) => r.ok ? [] : [i])));
  const list = review.map((r, i) => ({ ...r, i })).filter((r) => f === "all" || !r.ok);
  if (!quiz) return <><AppBar back="quizzes" title="Review" /><Page sheet={640}><p>Quiz not found. Choose a quiz from the past quizzes list.</p></Page></>;
  return (
    <>
      <AppBar back="quizzes" title="Review" />
      <Page sheet={640}>
        <div className="flex items-end justify-between gap-4 pt-1.5 lg:pt-0">
          <div>
            <p className="font-hand text-[18px] leading-[1.3] text-ink-muted">{quiz.date}</p>
            <Title size="form">{quiz.topic}</Title>
          </div>
          <p className="shrink-0 font-hand text-[38px] leading-[1.1] text-pen" aria-label={`${score} out of ${total}`}>{score}/{total}</p>
        </div>
        <div className="mt-6">
          <Segmented value={f} onChange={setF} options={[{ id: "all", label: `All ${total}` }, { id: "missed", label: `Missed ${missed}` }]} />
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
