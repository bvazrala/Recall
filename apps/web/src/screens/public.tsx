"use client";

import { useState } from "react";
import { ChevronLeft, Eye, EyeOff, Minus, Plus } from "lucide-react";
import { Bubble, Button, Card, Field, Folder, H2, IconBtn, Mark, MarkOver, SourceChip, StickyNote, Title, Wordmark } from "@/components/ui";
import { ICON, cx, useNav, type Screen } from "@/lib/nav";
import { FAQ } from "@/lib/mock";

// A plain ink link, for small links inside text and headers.
const LINK = "font-bold text-pen underline hover:text-pen-dark";

function Thread() {
  return (
    <Card className="space-y-2 p-4 pt-3">
      <p className="pb-1 text-center text-[12px] font-bold text-ink-muted">Today 7:30 PM</p>
      <Bubble from="them">Quick one from Cell Biology: why does glycolysis net only 2 ATP per glucose?</Bubble>
      <Bubble from="me">It spends 2 ATP early and makes 4 later.</Bubble>
      <Bubble from="them">Right. Next review in 4 days.</Bubble>
    </Card>
  );
}

function ForgettingCurve() {
  // x: days 0–30, y: memory 0–100. Each review resets to 100, next decay is flatter.
  const W = 340, H = 180, X0 = 40, px = (d: number) => X0 + (d / 30) * (W - X0 - 8), py = (m: number) => 12 + (1 - m / 100) * (H - 40);
  const reviews = [0, 2, 6, 14, 30];
  const segs: string[] = [];
  for (let i = 0; i < reviews.length - 1; i++) {
    const a = reviews[i], b = reviews[i + 1], s = 1.6 * Math.pow(2.4, i);
    const pts: string[] = [];
    for (let d = a; d <= b; d += 0.25) pts.push(`${px(d).toFixed(1)},${py(100 * Math.exp(-(d - a) / s)).toFixed(1)}`);
    segs.push(pts.join(" "));
  }
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Memory strength falls between reviews; each review resets it and the decline flattens.">
        {[50, 100].map((m) => <line key={m} x1={X0} x2={W} y1={py(m)} y2={py(m)} stroke="var(--color-rule)" />)}
        <line x1={X0} x2={W} y1={py(0)} y2={py(0)} stroke="var(--color-ink)" strokeWidth={2} />
        {[0, 50, 100].map((m) => <text key={m} x={0} y={py(m) + 4} fontSize={11} fill="var(--color-ink-muted)">{m}%</text>)}
        {[0, 7, 14, 21, 30].map((d) => (
          <text key={d} x={px(d)} y={H - 6} fontSize={11} fill="var(--color-ink-muted)" textAnchor={d === 0 ? "start" : d === 30 ? "end" : "middle"}>day {d}</text>
        ))}
        {segs.map((s, i) => <polyline key={i} points={s} fill="none" stroke="var(--color-pen)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />)}
        {segs.slice(0, -1).map((_, i) => {
          const d = reviews[i + 1];
          return <line key={i} x1={px(d)} x2={px(d)} y1={py(100)} y2={py(100 * Math.exp(-(d - reviews[i]) / (1.6 * Math.pow(2.4, i))))} stroke="var(--color-pen)" strokeOpacity={0.45} strokeDasharray="2 3" />;
        })}
        {reviews.slice(0, -1).map((d) => <circle key={d} cx={px(d)} cy={py(100)} r={4} fill="var(--color-pen)" />)}
      </svg>
      <figcaption className="mt-3 text-[15px] text-ink-muted">
        Each review pushes the next one further out. Recall uses FSRS, the scheduling algorithm Anki offers, to pick the day.
      </figcaption>
    </figure>
  );
}

const STEPS: [string, string, React.ReactNode][] = [
  ["Upload what you have.", "A syllabus or lecture slides, PDF, PPTX, or DOCX.",
    <Card key="a" className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3.5 py-2.5"><SourceChip>BIOL2210_syllabus.pdf</SourceChip><span className="text-[14px] text-ink-muted">1.2 MB</span></Card>],
  ["Get a plan.", "Recall finds the topics, spreads them across your weeks, and writes flashcards and quizzes for each.",
    <Card key="b" className="grid grid-cols-7 px-2 py-2 text-center">{["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
      <span key={i}>
        <span className="block text-[12px] text-ink-muted">{d}</span>
        <span className={cx("relative inline-block font-hand text-[17px] leading-[1.4]", i === 6 && "text-pen")}>{28 + i > 30 ? 28 + i - 30 : 28 + i}{i === 6 && <MarkOver kind="circle" size={32} className="text-pen" />}</span>
      </span>))}</Card>],
  ["Answer by text.", "One question a day. Reply in your own words; Recall grades it and decides when to ask again.",
    <Card key="c" className="p-3"><Bubble from="me">It spends 2 ATP early and makes 4 later.</Bubble></Card>],
];

// Landing layout: every section sits on the same sheet (page-x), on a 12-column grid with 64px gutters.
// Sections are 96px apart on desktop and 64px on phones, three and two of the paper's rules.
const SECTION = "page-x py-8 lg:py-12";
const NOTE = "font-hand text-[18px] leading-[1.3] text-ink-muted lg:text-[20px]";
const POINTS = [
  ["Today first.", "One folder tells you what's due."],
  ["Every class in one place.", "Topics and weeks, side by side."],
  ["Progress without noise.", "A streak, a chart, three numbers."],
];

export function Landing() {
  const { go } = useNav();
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="paper min-h-screen lg:[--sheet:1200px]">
      <header className="paper-band page-x safe-top sticky top-0 z-20">
        <div className="safe-row flex items-center justify-between">
          <Wordmark />
          <Button variant="text" onClick={() => go("login")}>Log in</Button>
        </div>
      </header>

      <section className="page-x pt-4 pb-16 lg:pt-12 lg:pb-24">
        <div className="lg:grid lg:grid-cols-12 lg:items-center lg:gap-x-16">
          <div className="lg:col-span-7">
            <p className={NOTE}>Spaced repetition by text</p>
            {/* Two sentences, two lines. The size follows the screen so the second one never wraps on desktop. */}
            <h1 className="mt-1 font-hand text-[40px] leading-[1.15] text-pen lg:text-[clamp(40px,3.9vw,54px)] lg:leading-[1.12]">
              <span className="block">One text a day.</span>
              <span className="block">Remembered by the final.</span>
            </h1>
            <p className="mt-5 max-w-[540px] lg:mt-6 lg:text-[20px]">
              Upload your syllabus. Recall turns it into a study plan, flashcards, and quizzes, then texts you one question a day, right when you&apos;re about to forget.
            </p>
            <div className="mt-9 flex flex-col gap-2 lg:mt-10 lg:flex-row lg:flex-wrap lg:items-center lg:gap-x-8">
              <Button full className="lg:w-auto lg:min-w-[260px] lg:px-8" onClick={() => go("signup")}>Get started</Button>
              <Button variant="text" className="whitespace-nowrap" onClick={() => go("login")}>I already have an account</Button>
            </div>
          </div>
          <div className="mt-12 rotate-[0.6deg] lg:col-span-5 lg:mt-0"><Thread /></div>
        </div>
      </section>

      <section className={SECTION}>
        <H2>How it works</H2>
        {/* Desktop: three columns that share their rows, so numbers, text, and examples line up across. */}
        <ol className="mt-7 grid gap-y-9 lg:mt-8 lg:grid-cols-3 lg:gap-x-16 lg:gap-y-0">
          {STEPS.map(([t, b, frag], i) => (
            <li key={t} className="grid grid-cols-[36px_minmax(0,1fr)] gap-x-3 gap-y-3 lg:row-span-3 lg:grid-cols-1 lg:grid-rows-subgrid lg:gap-y-4">
              <span className="font-hand text-[30px] leading-none text-pen lg:text-[38px]">{i + 1}.</span>
              <div>
                <h3 className="font-bold lg:text-[19px]">{t}</h3>
                <p className="mt-1 text-ink-muted">{b}</p>
              </div>
              <div className="col-start-2 lg:col-start-1">{frag}</div>
            </li>
          ))}
        </ol>
      </section>

      <section className={SECTION}>
        <div className="lg:grid lg:grid-cols-2 lg:items-center lg:gap-x-16">
          <div>
            <p className={NOTE}>Why it works</p>
            <h2 className="mt-1 font-hand text-[28px] leading-[1.2] text-pen lg:text-[35px]">You forget on a curve. Recall asks right before the drop.</h2>
          </div>
          <div className="mt-8 lg:mt-0"><ForgettingCurve /></div>
        </div>
      </section>

      <section className={SECTION}>
        <div className="lg:grid lg:grid-cols-2 lg:items-center lg:gap-x-16">
          {/* A small phone showing the home screen, drawn with the real pieces. */}
          <div className="mx-auto h-[300px] w-[150px] overflow-hidden rounded-[28px] border-[6px] border-ink bg-paper lg:h-[460px] lg:w-[260px]">
            <div className="paper pointer-events-none h-[790px] w-[393px] origin-top-left scale-[0.351] pt-5 pr-5 pl-11 [--paper-band:20px]! [--paper-margin:28px]! lg:scale-[0.631]" aria-hidden>
              <p className="font-hand text-[18px] leading-[1.3] text-ink-muted">Sunday, Oct 4</p>
              <p className="font-hand text-[34px] leading-[1.2] text-pen">Good evening, Maya.</p>
              <Folder tab="Today" className="mt-[21px]">
                <p className="font-hand text-[24px] leading-[1.25] text-pen">Glycolysis and the Krebs cycle</p>
                <p className="mt-2">14 cards and 1 quiz, about 12 minutes.</p>
                <div className="relative mt-[30px] h-[52px] rounded-[0_10px_10px_10px] bg-pen shadow-[0_3px_0_rgba(17,30,66,0.4)]"><span className="absolute -top-[11px] left-0 h-3 w-24 bg-pen [clip-path:polygon(0_100%,12%_0,88%_0,100%_100%)]" /></div>
              </Folder>
              <StickyNote className="mt-[34px] w-[164px]">
                <p className="font-hand text-[42px] leading-none text-pen">12</p>
                <p className="font-hand text-[18px] leading-[1.2] text-[#3b3418]">day streak</p>
              </StickyNote>
            </div>
          </div>
          <ul className="mt-8 space-y-4 lg:mt-0 lg:space-y-6 lg:text-[19px]">
            {POINTS.map(([lead, rest]) => (
              <li key={lead} className="flex gap-3">
                <Mark kind="check" size={22} className="mt-0.5 text-pen" />
                <span><span className="font-bold">{lead}</span> <span className="text-ink-muted">{rest}</span></span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={SECTION}>
        <div className="lg:grid lg:grid-cols-12 lg:gap-x-16">
          <H2 className="lg:col-span-4">Questions</H2>
          <div className="mt-4 divide-y divide-rule border-y border-rule lg:col-span-8 lg:mt-0">
            {FAQ.map(([q, a], i) => (
              <div key={q}>
                <button onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} className="flex min-h-14 w-full items-center justify-between gap-4 py-3 text-left font-bold">
                  {q}{open === i ? <Minus {...ICON} className="shrink-0 text-ink-muted" /> : <Plus {...ICON} className="shrink-0 text-ink-muted" />}
                </button>
                {open === i && <p className="anim-in pb-4 text-ink-muted">{a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The hero already has the screen's one ink folder, so this one is manila. */}
      <section className="page-x pt-8 pb-16 lg:pt-12 lg:pb-24">
        <div className="lg:flex lg:items-center lg:justify-between lg:gap-10">
          <h2 className="font-hand text-[34px] leading-[1.2] text-pen lg:text-[44px]">Start with one syllabus.</h2>
          <Button variant="secondary" className="mt-8 w-full lg:mt-0 lg:w-auto lg:min-w-[260px]" onClick={() => go("signup")}>Get started</Button>
        </div>
      </section>
      <footer className="page-x pb-8">
        <div className="flex items-center gap-5 border-t border-rule pt-4 text-[15px] text-ink-muted">
          <Wordmark className="text-[22px]" />
          <a href="#" className="inline-flex min-h-11 items-center hover:text-pen">Privacy</a>
          <a href="#" className="inline-flex min-h-11 items-center hover:text-pen">Terms</a>
          <span className="ml-auto">Early preview</span>
        </div>
      </footer>
    </div>
  );
}

function AuthShell({ title, sub, alt, children }: { title: string; sub?: string; alt: { label: string; to: Screen }; children: React.ReactNode }) {
  const { go } = useNav();
  return (
    <div className="paper page-x min-h-screen lg:[--sheet:440px]">
      <header className="safe-top">
        <div className="safe-row flex items-center">
          <IconBtn label="Back" onClick={() => go("landing")}><ChevronLeft size={24} strokeWidth={2} /></IconBtn>
          <button onClick={() => go(alt.to)} className={cx("ml-auto min-h-11", LINK)}>{alt.label}</button>
        </div>
      </header>
      <main className="anim-in pb-12">
        <Title size="form" className="mt-1.5">{title}</Title>
        {sub && <p className="mt-2.5">{sub}</p>}
        <div className="mt-6">{children}</div>
      </main>
    </div>
  );
}

function PasswordField({ helper, error }: { helper?: string; error?: string }) {
  const [show, setShow] = useState(false);
  return (
    <Field label="Password" type={show ? "text" : "password"} helper={helper} error={error} defaultValue={error ? "glycolysis" : undefined}
      trailing={<button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"} className="grid h-[42px] w-11 place-items-center text-ink-muted">{show ? <EyeOff size={22} strokeWidth={2} /> : <Eye size={22} strokeWidth={2} />}</button>} />
  );
}

// Auth is not wired yet: both forms just continue to the dashboard.
export function SignUp() {
  const { go } = useNav();
  const [loading, setLoading] = useState(false);
  return (
    <AuthShell title="Create your account" sub="Recall texts you on iMessage, so use your iPhone number." alt={{ label: "Log in", to: "login" }}>
      <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); setLoading(true); setTimeout(() => go("home"), 700); }}>
        <Field label="Name" placeholder="Maya Chen" />
        <Field label="Email" type="email" placeholder="maya.chen@example.edu" />
        <Field label="Mobile number" type="tel" placeholder="+1 (555) 010-0142" helper="Your daily question arrives here." />
        <PasswordField helper="At least 8 characters." />
        <Button full loading={loading} className="mt-[18px]">Create account</Button>
      </form>
      <p className="mt-[18px] text-[14px] text-ink-muted">
        By creating an account you agree to the <a href="#" className="text-pen underline hover:text-pen-dark">Terms</a> and <a href="#" className="text-pen underline hover:text-pen-dark">Privacy Policy</a>, and to one text a day. Reply STOP anytime.
      </p>
    </AuthShell>
  );
}

export function LogIn() {
  const { go } = useNav();
  return (
    <AuthShell title="Welcome back" alt={{ label: "Create account", to: "signup" }}>
      <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); go("home"); }}>
        <Field label="Email" type="email" defaultValue="maya.chen@example.edu" />
        <PasswordField />
        <button type="button" className={cx("min-h-11 self-start", LINK)}>Forgot password?</button>
        <Button full className="mt-[18px]">Log in</Button>
      </form>
    </AuthShell>
  );
}
