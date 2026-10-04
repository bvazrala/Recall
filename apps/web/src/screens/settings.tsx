"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { AppBar, Button, Dialog, Folder, Mark, Page, Title } from "@/components/ui";
import { cx, useNav } from "@/lib/nav";
import { USER } from "@/lib/mock";

// Settings are local state only: the server has no account or preference routes yet.

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={cx("relative h-7 w-12 rounded-full transition-colors duration-200", on ? "bg-pen" : "bg-folder-text/30")}>
      <span className={cx("absolute top-0.5 left-0.5 size-6 rounded-full bg-surface transition-transform duration-200", on && "translate-x-5")} />
    </button>
  );
}

// Each section is a manila folder. Its rows sit straight on the folder, divided by the folder's edge color.
function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Folder tab={title} className="mt-6">
      <div className="-my-2 divide-y divide-manila-edge">{children}</div>
    </Folder>
  );
}
const SRow = ({ k, v, children }: { k: string; v?: React.ReactNode; children?: React.ReactNode }) => (
  <div className="flex min-h-14 flex-wrap items-center gap-x-3 py-2"><span className="flex-1 font-bold">{k}</span>{v && <span className="text-folder-text">{v}</span>}{children}</div>
);
// A square you tap, with the ink of a pen.
const STEP = "grid size-11 place-items-center rounded-[3px] text-pen shadow-[inset_0_0_0_2px_var(--color-field-line)]";

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
        <Title className="pt-3.5 lg:pt-0">Settings</Title>
        <div className="lg:mt-4 xl:grid xl:grid-cols-2 xl:items-start xl:gap-x-12">
          <Group title="Daily text">
            <SRow k="Mobile number"><span className="text-right">{USER.phone}<span className="flex items-center justify-end gap-1 font-hand text-[15px] leading-5 text-pen"><Mark kind="check" size={16} />verified</span></span></SRow>
            <SRow k="Daily question time"><input type="time" defaultValue="19:30" className="h-11 border-b-2 border-field-line bg-transparent px-0.5 text-[18px]" aria-label="Daily question time" /></SRow>
            <div className="py-3">
              <div className="font-bold">Days</div>
              {/* Like the week on a class page: a day you get a text on has an ink check in its box. */}
              <div className="mt-2 grid grid-cols-7 gap-1 text-center">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => (
                  <button key={d} aria-pressed={days[i]} onClick={() => setDays(days.map((v, j) => (j === i ? !v : v)))} className="flex min-h-14 flex-col items-center gap-1 rounded-[3px]">
                    <span className={cx("text-[13px]", days[i] ? "font-bold text-ink" : "text-folder-text")}>{d}</span>
                    <span className={cx("relative grid size-6 place-items-center rounded-[2px] border-2", days[i] ? "border-pen" : "border-folder-text/50")}>
                      {days[i] && <Mark kind="check" size={26} className="absolute -top-2 left-0.5 text-pen" />}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <SRow k="Pause texts"><Toggle on={pause} onChange={setPause} label="Pause texts" /></SRow>
          </Group>
          <Group title="Study">
            <SRow k="New cards per day">
              <div className="flex items-center gap-1">
                <button aria-label="Fewer" onClick={() => setPerDay(Math.max(0, perDay - 1))} className={STEP}><Minus size={18} strokeWidth={2} /></button>
                <span className="w-10 text-center font-hand text-[22px] leading-none text-pen">{perDay}</span>
                <button aria-label="More" onClick={() => setPerDay(perDay + 1)} className={STEP}><Plus size={18} strokeWidth={2} /></button>
              </div>
            </SRow>
            <div className="py-4">
              <div className="flex items-baseline justify-between"><span className="font-bold">Target retention</span><span className="font-hand text-[22px] leading-none text-pen">{ret}%</span></div>
              <input type="range" min={80} max={95} value={ret} onChange={(e) => setRet(+e.target.value)} className="mt-3 h-11 w-full accent-pen" aria-label="Target retention" />
              <div className="flex justify-between text-[14px] text-folder-text"><span>80%</span><span>95%</span></div>
              <p className="mt-2 text-[15px] text-folder-text">Higher means more reviews.</p>
            </div>
          </Group>
          <Group title="Account">
            <div className="flex items-center gap-3 py-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-pen font-bold text-white">{USER.initials}</span>
              <div className="min-w-0"><div className="font-bold">{USER.name}</div><div className="truncate text-[15px] text-folder-text">{USER.email}</div></div>
            </div>
            <SRow k="Name" v={USER.name} /><SRow k="Email" v={USER.email} /><SRow k="Password" v="Change" />
          </Group>
          <Group title="Data">
            <div className="flex min-h-14 items-center"><Button variant="text">Export my data</Button></div>
            <div className="flex min-h-14 items-center"><Button variant="danger" onClick={() => setDel(true)}>Delete my data</Button></div>
          </Group>
        </div>
        <Button variant="secondary" full className="mt-10 lg:w-auto lg:min-w-[260px]" onClick={() => go("landing")}>Sign out</Button>
        <p className="mt-6 text-[15px] text-ink-muted">Recall is in early preview.</p>
      </Page>
      {del && (
        <Dialog title="Delete your data?" onClose={() => setDel(false)}>
          <p className="mt-2 text-ink-muted">This removes your account, classes, cards, and review history, and stops the texts. It can&apos;t be undone.</p>
          <div className="mt-7 flex flex-wrap items-center justify-between gap-3"><Button variant="secondary" onClick={() => setDel(false)}>Cancel</Button><Button variant="danger" onClick={() => go("landing")}>Delete my data</Button></div>
        </Dialog>
      )}
    </>
  );
}
