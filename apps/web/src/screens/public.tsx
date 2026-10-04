"use client";

import { useState } from "react";
import { ChevronLeft, Eye, EyeOff, FileText, Minus, Plus } from "lucide-react";
import { Bubble, Button, Card, Field, IconBtn, Label, Wordmark } from "@/components/ui";
import { ICON, cx, useNav } from "@/lib/nav";
import { FAQ } from "@/lib/mock";

function Thread() {
  return (
    <Card className="p-4 pt-3 space-y-2">
      <p className="text-center text-[11px] text-ink-muted font-medium pb-1">Today 7:30 PM</p>
      <Bubble from="them">Quick one from Cell Biology: why does glycolysis net only 2 ATP per glucose?</Bubble>
      <Bubble from="me">It spends 2 ATP early and makes 4 later.</Bubble>
      <Bubble from="them">Right. Next review in 4 days.</Bubble>
    </Card>
  );
}

function ForgettingCurve() {
  // x: days 0–30, y: memory 0–100. Each review resets to 100, next decay is flatter.
  const W = 340, H = 180, px = (d: number) => 28 + (d / 30) * (W - 40), py = (m: number) => 12 + (1 - m / 100) * (H - 40);
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
        {[0, 50, 100].map((m) => (
          <g key={m}>
            <line x1={28} x2={W - 12} y1={py(m)} y2={py(m)} stroke="currentColor" strokeOpacity={0.14} />
            <text x={0} y={py(m) + 4} className="mono" fontSize={10} fill="#6B675E">{m}%</text>
          </g>
        ))}
        {[0, 7, 14, 21, 30].map((d) => (
          <text key={d} x={px(d)} y={H - 6} className="mono" fontSize={10} fill="#6B675E" textAnchor="middle">d{d}</text>
        ))}
        {segs.map((s, i) => <polyline key={i} points={s} fill="none" stroke="#1C1B19" strokeWidth={1.5} />)}
        {segs.slice(0, -1).map((_, i) => {
          const d = reviews[i + 1];
          return <line key={i} x1={px(d)} x2={px(d)} y1={py(100)} y2={py(100 * Math.exp(-(d - reviews[i]) / (1.6 * Math.pow(2.4, i))))} stroke="#1C1B19" strokeOpacity={0.3} strokeDasharray="2 3" />;
        })}
        {reviews.slice(0, -1).map((d) => <circle key={d} cx={px(d)} cy={py(100)} r={4.5} fill="#C93A22" />)}
      </svg>
      <figcaption className="text-[14px] leading-5 text-ink-muted mt-3">
        Each review pushes the next one further out. Recall uses FSRS, the scheduling algorithm Anki offers, to pick the day.
      </figcaption>
    </figure>
  );
}

const STEPS: [string, string, string, React.ReactNode][] = [
  ["01", "Upload what you have.", "A syllabus or lecture slides, PDF, PPTX, or DOCX.",
    <Card key="a" className="flex items-center gap-3 px-3 py-2.5"><FileText {...ICON} /><div className="flex-1 text-[14px]">BIOL2210_syllabus.pdf</div><span className="mono text-[12px] text-ink-muted">1.2 MB</span></Card>],
  ["02", "Get a plan.", "Recall finds the topics, spreads them across your weeks, and writes flashcards and quizzes for each.",
    <Card key="b" className="px-3 py-2.5 flex justify-between">{["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
      <span key={i} className={cx("text-center w-8 rounded-chip py-1", i === 6 && "bg-marker")}>
        <span className="block text-[11px] text-ink-muted">{d}</span><span className="mono text-[13px]">{28 + i > 30 ? 28 + i - 30 : 28 + i}</span>
      </span>))}</Card>],
  ["03", "Answer by text.", "One question a day. Reply in your own words; Recall grades it and decides when to ask again.",
    <div key="c" className="max-w-[260px]"><Bubble from="me">It spends 2 ATP early and makes 4 later.</Bubble></div>],
];

export function Landing() {
  const { go } = useNav();
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 bg-paper border-b border-line safe-top">
        <div className="max-w-[1040px] mx-auto safe-row px-5 flex items-center justify-between">
          <Wordmark />
          <Button variant="text" className="-mr-3" onClick={() => go("login")}>Log in</Button>
        </div>
      </header>

      <section className="max-w-[1040px] mx-auto px-5 pt-12 pb-14 lg:grid lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:pt-20">
        <div>
          <Label className="text-accent-text">Spaced repetition by text</Label>
          <h1 className="font-serif font-medium text-[40px] leading-[44px] tracking-[-0.015em] mt-4 lg:text-[56px] lg:leading-[60px]">
            One text a day. Remembered by the final.
          </h1>
          <p className="text-[16px] leading-6 text-ink-muted mt-5 max-w-[440px]">
            Upload your syllabus. Recall turns it into a study plan, flashcards, and quizzes, then texts you one question a day, right when you&apos;re about to forget.
          </p>
          <div className="mt-7 flex flex-col gap-1 max-w-[360px]">
            <Button full onClick={() => go("signup")}>Get started</Button>
            <Button variant="text" onClick={() => go("login")}>I already have an account</Button>
          </div>
        </div>
        <div className="mt-10 lg:mt-0 lg:pt-6 rotate-[0.6deg]"><Thread /></div>
      </section>

      <section className="max-w-[1040px] mx-auto px-5 py-12 border-t border-line">
        <Label>How it works</Label>
        <ol className="mt-8 relative">
          <span className="absolute left-[22px] top-2 bottom-2 w-px bg-line" aria-hidden />
          {STEPS.map(([n, t, b, frag]) => (
            <li key={n} className="relative grid grid-cols-[44px_1fr] gap-4 pb-10 last:pb-0 lg:grid-cols-[44px_1fr_1fr] lg:gap-10">
              <span className="font-serif font-medium text-[28px] leading-none bg-paper py-1 text-center">{n}</span>
              <div>
                <h3 className="font-serif font-medium text-[20px] leading-[26px]">{t}</h3>
                <p className="text-[15px] leading-6 text-ink-muted mt-1">{b}</p>
              </div>
              <div className="col-start-2 lg:col-start-3 mt-1">{frag}</div>
            </li>
          ))}
        </ol>
      </section>

      <section className="max-w-[1040px] mx-auto px-5 py-12 border-t border-line lg:grid lg:grid-cols-2 lg:gap-16">
        <div>
          <Label>Why it works</Label>
          <h2 className="font-serif font-medium text-[28px] leading-8 mt-3">You forget on a curve. Recall asks right before the drop.</h2>
        </div>
        <div className="mt-8 lg:mt-0"><ForgettingCurve /></div>
      </section>

      <section className="max-w-[1040px] mx-auto px-5 py-12 border-t border-line grid grid-cols-[150px_1fr] gap-6 items-center lg:grid-cols-[260px_1fr] lg:gap-16">
        <div className="rounded-[28px] border-[6px] border-ink bg-paper overflow-hidden h-[300px] lg:h-[460px]">
          <div className="origin-top-left scale-[0.38] w-[393px] lg:scale-[0.62] p-5 pointer-events-none" aria-hidden>
            <Label>Sunday, Oct 4</Label>
            <div className="font-serif text-[28px] mt-2">Good evening, Maya.</div>
            <Card className="p-5 mt-5">
              <Label>Today&apos;s study</Label>
              <div className="font-serif text-[24px] mt-2 leading-7">Glycolysis and the Krebs cycle</div>
              <div className="mono text-[14px] text-ink-muted mt-2">14 cards due · 1 quiz</div>
              <div className="h-12 rounded-ctl bg-accent mt-5" />
            </Card>
            <div className="font-serif text-[64px] mt-6 leading-none">12</div>
          </div>
        </div>
        <ul className="space-y-5 text-[16px] leading-6">
          <li><span className="font-semibold">Today first.</span> <span className="text-ink-muted">One card tells you what&apos;s due.</span></li>
          <li><span className="font-semibold">Every class in one place.</span> <span className="text-ink-muted">Topics and weeks, side by side.</span></li>
          <li><span className="font-semibold">Progress without noise.</span> <span className="text-ink-muted">A streak, a chart, three numbers.</span></li>
        </ul>
      </section>

      <section className="max-w-[1040px] mx-auto px-5 py-12 border-t border-line lg:grid lg:grid-cols-[1fr_2fr] lg:gap-16">
        <Label>Questions</Label>
        <div className="mt-4 lg:mt-0 divide-y divide-line border-y border-line">
          {FAQ.map(([q, a], i) => (
            <div key={q}>
              <button onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} className="w-full min-h-14 flex items-center justify-between gap-4 text-left text-[16px] font-medium py-3">
                {q}{open === i ? <Minus {...ICON} /> : <Plus {...ICON} />}
              </button>
              {open === i && <p className="pb-4 text-[15px] leading-6 text-ink-muted anim-in">{a}</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="bg-ink text-paper">
        <div className="max-w-[1040px] mx-auto px-5 py-14 lg:flex lg:items-end lg:justify-between">
          <h2 className="font-serif font-medium text-[36px] leading-10">Start with one syllabus.</h2>
          <Button className="mt-6 lg:mt-0 w-full lg:w-auto" onClick={() => go("signup")}>Get started</Button>
        </div>
      </section>
      <footer className="max-w-[1040px] mx-auto px-5 py-8 flex items-center gap-5 text-[14px] text-ink-muted">
        <Wordmark className="text-[18px] text-ink" />
        <a href="#" className="min-h-11 inline-flex items-center">Privacy</a>
        <a href="#" className="min-h-11 inline-flex items-center">Terms</a>
        <span className="ml-auto">Early preview</span>
      </footer>
    </div>
  );
}

function AuthShell({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  const { go } = useNav();
  return (
    <div className="min-h-screen">
      <header className="safe-row safe-top box-content px-5 flex items-center max-w-[440px] mx-auto">
        <IconBtn label="Back" onClick={() => go("landing")}><ChevronLeft {...ICON} /></IconBtn>
      </header>
      <main className="px-5 pt-4 pb-12 max-w-[440px] mx-auto anim-in">
        <h1 className="font-serif font-medium text-[28px] leading-8">{title}</h1>
        {sub && <p className="text-[16px] leading-6 text-ink-muted mt-2">{sub}</p>}
        <div className="mt-7">{children}</div>
      </main>
    </div>
  );
}

function PasswordField({ helper, error }: { helper?: string; error?: string }) {
  const [show, setShow] = useState(false);
  return (
    <Field label="Password" type={show ? "text" : "password"} helper={helper} error={error} defaultValue={error ? "glycolysis" : undefined}
      trailing={<button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"} className="size-11 grid place-items-center text-ink-muted">{show ? <EyeOff {...ICON} /> : <Eye {...ICON} />}</button>} />
  );
}

// Auth is not wired yet: both forms just continue to the dashboard.
export function SignUp() {
  const { go } = useNav();
  const [loading, setLoading] = useState(false);
  return (
    <AuthShell title="Create your account" sub="Recall texts you on iMessage, so use your iPhone number.">
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setLoading(true); setTimeout(() => go("home"), 700); }}>
        <Field label="Name" placeholder="Maya Chen" />
        <Field label="Email" type="email" placeholder="maya.chen@example.edu" />
        <Field label="Mobile number" type="tel" placeholder="+1 (555) 010-0142" helper="Your daily question arrives here." />
        <PasswordField helper="At least 8 characters" />
        <Button full loading={loading} className="!mt-6">Create account</Button>
      </form>
      <p className="text-[12px] leading-4 text-ink-muted mt-4">By creating an account you agree to the Terms and Privacy Policy, and to receive one text a day. Reply STOP anytime.</p>
      <p className="text-[14px] mt-8">Already have an account? <button className="font-semibold underline underline-offset-4 min-h-11" onClick={() => go("login")}>Log in</button></p>
    </AuthShell>
  );
}

export function LogIn() {
  const { go } = useNav();
  return (
    <AuthShell title="Welcome back">
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); go("home"); }}>
        <Field label="Email" type="email" defaultValue="maya.chen@example.edu" />
        <PasswordField />
        <button type="button" className="text-[14px] font-medium underline underline-offset-4 min-h-11">Forgot password?</button>
        <Button full>Log in</Button>
      </form>
      <p className="text-[14px] mt-8">New here? <button className="font-semibold underline underline-offset-4 min-h-11" onClick={() => go("signup")}>Create an account</button></p>
    </AuthShell>
  );
}
