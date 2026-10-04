"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { AppBar, Button, Chip, H2, Label, Page, Title } from "@/components/ui";
import { cx, useNav } from "@/lib/nav";
import { USER } from "@/lib/mock";

// Settings are local state only: the server has no account or preference routes yet.

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={cx("relative w-12 h-7 rounded-full transition-colors duration-200", on ? "bg-ink" : "bg-ink/20")}>
      <span className={cx("absolute top-0.5 left-0.5 size-6 rounded-full bg-surface transition-transform duration-200", on && "translate-x-5")} />
    </button>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <Label className="mb-2 px-1">{title}</Label>
      <div className="bg-surface border border-line rounded-card divide-y divide-line">{children}</div>
    </section>
  );
}
const SRow = ({ k, v, children }: { k: string; v?: React.ReactNode; children?: React.ReactNode }) => (
  <div className="flex items-center gap-3 px-4 min-h-14 py-2"><span className="flex-1 text-[16px]">{k}</span>{v && <span className="text-[15px] text-ink-muted">{v}</span>}{children}</div>
);

export function Settings() {
  const { go } = useNav();
  const [days, setDays] = useState([true, true, true, true, true, false, true]);
  const [pause, setPause] = useState(false);
  const [perDay, setPerDay] = useState(10);
  const [ret, setRet] = useState(90);
  const [del, setDel] = useState(false);
  return (
    <>
      <AppBar />
      <Page>
        <Title>Settings</Title>
        <Group title="Account">
          <div className="flex items-center gap-3 px-4 py-4">
            <span className="grid place-items-center size-12 rounded-full bg-ink text-paper font-semibold">{USER.initials}</span>
            <div><div className="text-[16px] font-medium">{USER.name}</div><div className="text-[14px] text-ink-muted">{USER.email}</div></div>
          </div>
          <SRow k="Name" v={USER.name} /><SRow k="Email" v={USER.email} /><SRow k="Password" v="Change" />
        </Group>
        <Group title="Texting">
          <SRow k="Mobile number"><span className="mono text-[14px]">{USER.phone}</span><Chip tone="good">Verified</Chip></SRow>
          <SRow k="Daily question time"><input type="time" defaultValue="19:30" className="mono text-[16px] bg-transparent h-11" aria-label="Daily question time" /></SRow>
          <div className="px-4 py-3">
            <div className="text-[16px] mb-2.5">Days</div>
            <div className="grid grid-cols-7 gap-1.5">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => (
                <button key={d} aria-pressed={days[i]} onClick={() => setDays(days.map((v, j) => (j === i ? !v : v)))}
                  className={cx("h-11 rounded-chip text-[13px] font-medium border transition-colors", days[i] ? "bg-ink text-paper border-ink" : "border-line text-ink-muted")}>{d}</button>
              ))}
            </div>
          </div>
          <SRow k="Pause texts"><Toggle on={pause} onChange={setPause} label="Pause texts" /></SRow>
        </Group>
        <Group title="Study">
          <SRow k="New cards per day">
            <div className="flex items-center border border-line rounded-ctl">
              <button aria-label="Fewer" onClick={() => setPerDay(Math.max(0, perDay - 1))} className="size-11 grid place-items-center"><Minus size={18} strokeWidth={1.5} /></button>
              <span className="mono w-8 text-center">{perDay}</span>
              <button aria-label="More" onClick={() => setPerDay(perDay + 1)} className="size-11 grid place-items-center"><Plus size={18} strokeWidth={1.5} /></button>
            </div>
          </SRow>
          <div className="px-4 py-4">
            <div className="flex justify-between"><span className="text-[16px]">Target retention</span><span className="mono">{ret}%</span></div>
            <input type="range" min={80} max={95} value={ret} onChange={(e) => setRet(+e.target.value)} className="w-full mt-3 h-11 accent-[#1C1B19]" aria-label="Target retention" />
            <div className="flex justify-between mono text-[12px] text-ink-muted"><span>80%</span><span>95%</span></div>
            <p className="text-[14px] text-ink-muted mt-2">Higher means more reviews.</p>
          </div>
        </Group>
        <Group title="Data">
          <button className="w-full text-left px-4 min-h-14 text-[16px]">Export my data</button>
          <button onClick={() => setDel(true)} className="w-full text-left px-4 min-h-14 text-[16px] text-accent-text">Delete account</button>
        </Group>
        <Button variant="secondary" full className="mt-10" onClick={() => go("landing")}>Sign out</Button>
        <p className="text-center text-[13px] text-ink-muted mt-6">Recall · early preview</p>
      </Page>
      {del && (
        <div className="fixed inset-0 z-50 bg-ink/40 flex items-end sm:items-center justify-center p-4" onClick={() => setDel(false)}>
          <div role="dialog" aria-modal className="w-full max-w-[380px] bg-surface rounded-card p-5 anim-in" onClick={(e) => e.stopPropagation()}>
            <H2>Delete your account?</H2>
            <p className="text-[15px] text-ink-muted mt-2">This removes your classes, cards, and review history, and stops the texts. It can&apos;t be undone.</p>
            <div className="mt-5 grid grid-cols-2 gap-3"><Button variant="secondary" onClick={() => setDel(false)}>Cancel</Button><Button onClick={() => go("landing")}>Delete</Button></div>
          </div>
        </div>
      )}
    </>
  );
}
