"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { ChevronLeft, ChevronRight, Loader2, Menu, Paperclip, X } from "lucide-react";
import { ICON, cx, useNav, type DayState, type Screen } from "@/lib/nav";
import { CLASSES } from "@/lib/mock";

// The notebook pieces. design/DESIGN.md has the recipe for each one, and design/screens/ shows them in use.

// A folder tab is a trapezoid. Paper objects carry their own shadow instead of a shared one.
const TAB = "[clip-path:polygon(0_100%,10%_0,90%_0,100%_100%)]";
const PANEL = "rounded-[0_14px_14px_14px] bg-manila shadow-[0_2px_0_var(--color-manila-edge),0_16px_26px_-22px_rgba(74,56,14,0.75)]";
const CARD = "rounded-[3px] bg-surface shadow-[0_1px_0_var(--color-line),0_8px_16px_-12px_rgba(30,63,150,0.55)]";
// The red line near the top of an index card.
const CARD_LINE = "bg-[linear-gradient(180deg,transparent_0_32px,#ee9a9a_32px_33.5px,transparent_33.5px)]";

export function Wordmark({ className = "text-[30px]" }: { className?: string }) {
  return (
    <span className={cx("font-hand leading-[1.1] text-pen", className)}>
      Recall<span className="text-redpen">.</span>
    </span>
  );
}

// Hand-drawn grading marks. They take the current text color: pen for right, redpen for wrong.
const MARKS = {
  check: { box: [24, 24], width: 2.6, d: "M4.5 13.2c2 1.6 3.4 3.3 4.6 5.3C11.8 12.6 15.4 8 20 4.6" },
  circle: { box: [40, 38], width: 2, d: "M21 3.2C30.6 2.8 37.6 9 37.2 18.6 36.8 28.2 29.2 34.8 19.8 34.6 10.4 34.4 2.8 27.6 3 18.6 3.2 9.6 10.4 3.4 19.6 4.2" },
  cross: { box: [24, 24], width: 2.4, d: "M5 4.6c4.6 4.4 9.2 9.6 14 14.8M18.8 4.8C13.6 9.4 9.2 14.2 4.6 19.4" },
} as const;

export function Mark({ kind, size = 20, strokeWidth, label, className }: { kind: keyof typeof MARKS; size?: number; strokeWidth?: number; label?: string; className?: string }) {
  const m = MARKS[kind];
  return (
    <svg
      viewBox={`0 0 ${m.box[0]} ${m.box[1]}`}
      width={size}
      height={Math.round((size * m.box[1]) / m.box[0])}
      className={cx("shrink-0", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <path d={m.d} fill="none" stroke="currentColor" strokeWidth={strokeWidth ?? m.width} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// A mark drawn over its parent, centered on it (the circle around a letter, the X through one).
export function MarkOver({ kind, size, className }: { kind: keyof typeof MARKS; size: number; className?: string }) {
  return <Mark kind={kind} size={size} className={cx("pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2", className)} />;
}

export function Highlight({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx("highlight", className)}>{children}</span>;
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "text" | "danger";
  loading?: boolean;
  full?: boolean;
};
// primary and secondary are folders (ink and manila); text and danger are underlined links.
// A folder needs 12px of clear space above it for its tab.
export function Button({ variant = "primary", loading, full, className, children, disabled, ...rest }: BtnProps) {
  const folder = variant === "primary" || variant === "secondary";
  const v = {
    primary: "bg-pen text-white shadow-[0_3px_0_rgba(17,30,66,0.4)] hover:bg-pen-dark",
    secondary: "bg-manila text-ink shadow-[0_3px_0_var(--color-manila-edge)]",
    text: "text-pen hover:text-pen-dark",
    danger: "text-redpen",
  }[variant];
  return (
    <button
      className={cx(
        "relative inline-flex items-center justify-center gap-2 text-[17px] font-bold select-none transition-[background-color,color,transform,opacity] duration-150 ease-out disabled:opacity-50",
        folder
          ? "min-h-[52px] rounded-[0_10px_10px_10px] px-5 py-3.5 active:translate-y-px disabled:active:translate-y-0 lg:min-h-[54px] lg:py-[15px] lg:text-[18px]"
          : "min-h-11 underline decoration-2 underline-offset-[5px]",
        v,
        full && "w-full",
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {folder && <span aria-hidden className="absolute left-0 -top-[11px] h-3 w-24 max-w-[60%] bg-inherit [clip-path:polygon(0_100%,12%_0,88%_0,100%_100%)]" />}
      {loading && <Loader2 {...ICON} className="animate-spin" />}
      {children}
    </button>
  );
}

export function IconBtn({ label, onClick, children, className }: { label: string; onClick?: () => void; children: ReactNode; className?: string }) {
  return (
    <button aria-label={label} onClick={onClick} className={cx("grid size-11 shrink-0 place-items-center text-ink", className ?? "-ml-3")}>
      {children}
    </button>
  );
}

// A small plain tab for things that are not a class: a topic, a week. "shade" sits on manila, "manila" on white or paper.
export function Chip({ children, tone = "shade", className }: { children: ReactNode; tone?: "shade" | "manila"; className?: string }) {
  return (
    <span className={cx("inline-flex h-[26px] max-w-full items-center px-4 font-hand text-[15px] text-folder-text", TAB, tone === "manila" ? "bg-manila" : "bg-manila-shade", className)}>
      <span className="truncate">{children}</span>
    </span>
  );
}

// Each class keeps one tab color everywhere: green, purple, orange, in the order of the class list.
const CLASS_BG = ["bg-class-green", "bg-class-purple", "bg-class-orange"];
export const classBg = (code: string) => CLASS_BG[Math.max(0, CLASSES.findIndex((c) => c.code === code)) % CLASS_BG.length];

export const CodeChip = ({ code }: { code: string }) => (
  <span className={cx("inline-flex h-7 items-center px-[18px] text-sm font-bold whitespace-nowrap text-white", TAB, classBg(code))}>{code}</span>
);

// Where a piece of content came from, clipped on.
export const SourceChip = ({ children }: { children: ReactNode }) => (
  <span className="inline-flex items-center gap-1 text-[15px] text-ink-muted">
    <Paperclip size={16} strokeWidth={2} className="shrink-0" aria-hidden />
    {children}
  </span>
);

// A handwritten note in pencil: a card label, a date, a remark in the margin.
export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("font-hand text-[15px] leading-5 text-ink-muted", className)}>{children}</div>;
}

// A plain index card.
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx(CARD, className)}>{children}</div>;
}

// A confirmation, on an index card over the dimmed page. Clicking outside closes it.
export function Dialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center" onClick={onClose}>
      <div role="dialog" aria-modal aria-label={title} className={cx("anim-in w-full max-w-[380px] p-5", CARD)} onClick={(e) => e.stopPropagation()}>
        <h2 className="font-hand text-[24px] leading-[1.2] text-pen">{title}</h2>
        {children}
      </div>
    </div>
  );
}

// The manila panel that sits under a row of folder tabs (see Segmented).
export function FolderPanel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx(PANEL, "px-3.5 py-4 lg:px-5 lg:py-5", className)}>{children}</div>;
}

// A manila folder with one labeled tab, such as "Today". tabClassName replaces the tab's manila fill.
// Give it a height (h-full in a grid row, say) and the panel stretches to fill it.
export function Folder({ tab, children, className, tabClassName }: { tab: ReactNode; children: ReactNode; className?: string; tabClassName?: string }) {
  return (
    <section className={cx("relative flex flex-col pt-[25px] lg:pt-[27px]", className)}>
      <p className={cx("absolute top-0 left-0 flex h-[26px] items-center px-[22px] lg:h-7 lg:px-[26px]", TAB, tabClassName ?? "bg-manila font-hand text-[16px] text-folder-text lg:text-[17px]")}>{tab}</p>
      <div className={cx(PANEL, "flex-1 px-5 pt-5 pb-4 lg:rounded-[0_16px_16px_16px] lg:px-8 lg:pt-7 lg:pb-[30px]")}>{children}</div>
    </section>
  );
}

// The one sticky note a screen may have, for the streak. `large` is the desktop size.
export function StickyNote({ children, className, large }: { children: ReactNode; className?: string; large?: boolean }) {
  return (
    <div className={cx("relative bg-sticky", large ? "-rotate-[1.5deg] px-[22px] pt-[26px] pb-5 shadow-[0_16px_22px_-18px_rgba(91,72,0,0.75)]" : "-rotate-2 px-3.5 pt-[18px] pb-3.5 shadow-[0_14px_18px_-14px_rgba(91,72,0,0.7)]", className)}>
      <span aria-hidden className={cx("absolute bg-white/60", large ? "-top-2.5 left-1/2 -ml-9 h-5 w-[72px] rotate-[3deg]" : "-top-[9px] left-10 h-[18px] w-14 rotate-[4deg]")} />
      {children}
    </div>
  );
}

export function Bar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cx("h-1.5 overflow-hidden rounded-[2px] bg-pen/15", className)} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-[2px] bg-pen transition-[width] duration-250 ease-out" style={{ width: `${value}%` }} />
    </div>
  );
}

// Folder tabs. Put a FolderPanel right under them. `small` is the print version for toggles that have no panel.
export function Segmented<T extends string>({ options, value, onChange, className, small }: { options: { id: T; label: string }[]; value: T; onChange: (v: T) => void; className?: string; small?: boolean }) {
  return (
    <div role="tablist" className={cx("flex items-end gap-1", !small && "pl-1.5", className)}>
      {options.map((o) => {
        const on = o.id === value;
        return (
          <button
            key={o.id}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.id)}
            // The ::after stretches the tap target up to 44px without changing the tab's shape.
            className={cx(
              "relative isolate whitespace-nowrap after:absolute after:inset-x-0 after:-top-2.5 after:bottom-0",
              on ? "h-10" : "h-[34px]",
              small ? "text-[16px] font-bold" : "font-hand",
              small ? (on ? "px-[22px] text-ink" : "px-5 text-ink-muted") : on ? "px-6 text-[17px] text-pen max-[359px]:px-[18px]" : "px-[22px] text-[16px] text-folder-text max-[359px]:px-4",
            )}
          >
            {/* The shape is a separate layer so the focus ring on the button is not clipped. */}
            <span aria-hidden className={cx("absolute inset-0 -z-10", TAB, on ? "bg-manila" : small ? "bg-[#ece3c9]" : "bg-manila-shade")} />
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// An index card for a study item: a handwritten label on the red line, a bold title, then details as a sentence.
export function Row({ label, title, meta, onClick }: { label?: ReactNode; title: ReactNode; meta?: ReactNode; onClick?: () => void }) {
  const body = (
    <>
      <span className="flex h-7 items-center justify-between gap-3">
        <span className="font-hand text-[15px] text-ink-muted">{label}</span>
        {onClick && <ChevronRight size={20} strokeWidth={2} className="shrink-0 text-ink-muted" aria-hidden />}
      </span>
      <span className="mt-2 block font-bold">{title}</span>
      {meta && <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[15px] text-ink-muted">{meta}</span>}
    </>
  );
  const cls = cx("block w-full px-3.5 pt-1 pb-3 text-left", CARD, CARD_LINE);
  return onClick ? <button onClick={onClick} className={cls}>{body}</button> : <div className={cls}>{body}</div>;
}

// A field is a line to write on.
export function Field({ label, type = "text", placeholder, helper, error, defaultValue, trailing }: { label: string; type?: string; placeholder?: string; helper?: string; error?: string; defaultValue?: string; trailing?: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[16px] font-bold">{label}</span>
      <span className="relative block">
        <input
          type={type}
          placeholder={placeholder}
          defaultValue={defaultValue}
          aria-invalid={!!error}
          className={cx(
            "block h-11 w-full rounded-none border-0 border-b-2 bg-transparent px-0.5 pt-1.5 pb-0.5 text-[18px] text-ink placeholder:text-[#6e7fa6]",
            error ? "border-redpen" : "border-field-line",
            !!trailing && "pr-12",
          )}
        />
        {trailing && <span className="absolute right-0 bottom-0.5">{trailing}</span>}
      </span>
      {(error || helper) && <span className={cx("mt-1 block text-[15px]", error ? "text-redpen" : "text-ink-muted")}>{error ?? helper}</span>}
    </label>
  );
}

// The phone header. It sits in the plain band at the top of the paper; desktop uses the sidebar instead.
export function AppBar({ back, onClose, title, right }: { back?: Screen; onClose?: () => void; title?: ReactNode; right?: ReactNode }) {
  const { go, openDrawer } = useNav();
  const big = { size: 24, strokeWidth: 2 };
  return (
    <header className="paper-band safe-top sticky top-0 z-20 lg:hidden">
      <div className="safe-row flex items-center gap-1.5 pr-5 pl-11">
        {onClose ? (
          <IconBtn label="Close" onClick={onClose}><X {...big} /></IconBtn>
        ) : back ? (
          <IconBtn label="Back" onClick={() => go(back)}><ChevronLeft {...big} /></IconBtn>
        ) : (
          <IconBtn label="Open menu" onClick={openDrawer} className="-ml-2.5"><Menu {...big} /></IconBtn>
        )}
        <div className="min-w-0 flex-1 truncate font-hand text-[18px] text-ink-muted">{title ?? (back || onClose ? null : <Wordmark />)}</div>
        {right ?? <Avatar onClick={() => go("settings")} />}
      </div>
    </header>
  );
}

export function Avatar({ size = 44, onClick }: { size?: number; onClick?: () => void }) {
  const el = (
    <span className="grid shrink-0 place-items-center rounded-full bg-pen font-bold text-white" style={{ width: size, height: size, fontSize: Math.round(size * 0.34) }}>
      MC
    </span>
  );
  return onClick ? (
    <button aria-label="Settings" onClick={onClick} className="grid shrink-0 place-items-center rounded-full">{el}</button>
  ) : el;
}

// The content of a screen, placed on the paper's sheet (see .paper in globals.css).
// `sheet` asks for a narrower sheet, for a form or a page of reading; the paper centers it on wide screens.
// `fill` stretches a short page to the height of the screen, so a StickyBottom at its end sits at the bottom.
export function Page({ children, className, fill, sheet }: { children: ReactNode; className?: string; fill?: boolean; sheet?: 560 | 640 }) {
  return (
    <main data-sheet={sheet} className={cx("page-x anim-in w-full flex-1 lg:pt-10 lg:pb-16", fill ? "flex flex-col" : "pb-12", className)}>
      {children}
    </main>
  );
}

// Handwritten headings. Never add a bold class: Architects Daughter has one weight.
const TITLE = {
  page: "text-[34px] leading-[1.2] lg:text-[52px] lg:leading-[1.15]",
  class: "text-[38px] leading-[1.15] lg:text-[44px]",
  form: "text-[30px] leading-[1.2] lg:text-[36px]",
};
export function Title({ children, className, size = "page" }: { children: ReactNode; className?: string; size?: keyof typeof TITLE }) {
  return <h1 className={cx("font-hand text-pen", TITLE[size], className)}>{children}</h1>;
}
export function H2({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cx("font-hand text-[22px] leading-[1.15] text-pen lg:text-[30px]", className)}>{children}</h2>;
}

// The main action, kept in reach at the bottom of a phone screen. It needs a parent that is a flex column
// as tall as the screen (Page with `fill`), and then sits at the bottom even when the page is short.
// On desktop it is an ordinary block after the content.
export function StickyBottom({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-10 mt-auto -mr-5 -ml-11 border-t border-rule pt-5 pr-5 pb-[max(24px,env(safe-area-inset-bottom))] pl-11 max-lg:paper-band lg:static lg:mx-0 lg:mt-8 lg:border-0 lg:p-0">
      {children}
    </div>
  );
}

// Seven days: an ink check for a day that was studied, a circle around today.
export function StreakStrip({ days, muted, className }: { days: DayState[]; muted?: boolean; className?: string }) {
  const L = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <ol className={cx("grid grid-cols-7 gap-1 text-center", className)} aria-label="This week">
      {days.map((d, i) => (
        <li key={i} className="flex flex-col items-center gap-0.5 text-[14px]">
          <span>{L[i]}</span>
          <span className="relative grid size-5 place-items-center text-pen">
            {d === "done" && !muted && <Mark kind="check" />}
            {d === "today" && <MarkOver kind="circle" size={34} />}
            {(d === "missed" || d === "future" || (d === "done" && muted)) && <span className={cx("h-0.5 rounded-full bg-ink-muted", d === "missed" ? "w-2.5" : "w-1 opacity-50")} />}
          </span>
          <span className="sr-only">{d}</span>
        </li>
      ))}
    </ol>
  );
}

// A number in handwriting over its label. Put Stats inside a <dl>.
export function Stat({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="flex flex-col-reverse">
      <dt className="text-[15px] text-ink-muted">{label}</dt>
      <dd className="font-hand text-[29px] leading-[1.1] text-pen lg:text-[38px]">{value}</dd>
    </div>
  );
}

// iMessage previews keep the real bubble colors, because they show the real channel.
export function Bubble({ from, children }: { from: "me" | "them"; children: ReactNode }) {
  return (
    <div className={cx("flex", from === "me" ? "justify-end" : "justify-start")}>
      <p
        className={cx(
          "max-w-[78%] px-3.5 py-2 text-[15px] leading-[20px] rounded-[18px] font-[system-ui,-apple-system,sans-serif]",
          from === "me" ? "bg-bubble-blue text-white rounded-br-[6px]" : "bg-bubble-gray text-ink rounded-bl-[6px]",
        )}
      >
        {children}
      </p>
    </div>
  );
}
