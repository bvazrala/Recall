"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Check, ChevronLeft, ChevronRight, Loader2, Menu, X } from "lucide-react";
import { ICON, cx, useNav, type DayState, type Screen } from "@/lib/nav";

export function Wordmark({ className = "text-[22px]" }: { className?: string }) {
  return (
    <span className={cx("font-serif font-semibold tracking-tight leading-none", className)}>
      Recall<span className="text-accent">.</span>
    </span>
  );
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "text" | "danger" | "black";
  loading?: boolean;
  full?: boolean;
};
export function Button({ variant = "primary", loading, full, className, children, disabled, ...rest }: BtnProps) {
  const base =
    "inline-flex items-center justify-center gap-2 h-12 rounded-ctl text-[16px] font-semibold transition-[background,color,transform,opacity] duration-150 ease-out active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100 select-none";
  const v = {
    primary: "bg-accent text-surface px-5 active:bg-[#a82e1a]",
    secondary: "border border-ink text-ink px-5 active:bg-ink/5",
    black: "bg-ink text-paper px-5 active:bg-black",
    text: "text-ink px-3 underline-offset-4 hover:underline min-h-11",
    danger: "text-accent-text px-3 min-h-11",
  }[variant];
  return (
    <button className={cx(base, v, full && "w-full", className)} disabled={disabled || loading} {...rest}>
      {loading && <Loader2 {...ICON} className="animate-spin" />}
      {children}
    </button>
  );
}

export function IconBtn({ label, onClick, children }: { label: string; onClick?: () => void; children: ReactNode }) {
  return (
    <button aria-label={label} onClick={onClick} className="size-11 grid place-items-center rounded-ctl active:bg-ink/5 -mx-2.5">
      {children}
    </button>
  );
}

export function Chip({ children, tone = "line", className }: { children: ReactNode; tone?: "line" | "ink" | "good" | "accent" | "marker"; className?: string }) {
  const t = {
    line: "border border-line text-ink bg-surface",
    ink: "bg-ink text-paper",
    good: "border border-good/40 text-good bg-surface",
    accent: "border border-accent/40 text-accent-text bg-surface",
    marker: "bg-marker text-ink",
  }[tone];
  return <span className={cx("inline-flex items-center h-6 px-2 rounded-chip text-[12px] font-medium whitespace-nowrap", t, className)}>{children}</span>;
}
export const CodeChip = ({ code }: { code: string }) => <Chip className="mono !text-[12px] tracking-tight">{code}</Chip>;
export const SourceChip = ({ children }: { children: ReactNode }) => (
  <span className="inline-flex items-center h-6 px-2 rounded-chip text-[12px] text-ink-muted bg-ink/[0.05]">{children}</span>
);

export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("label text-ink-muted", className)}>{children}</div>;
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("bg-surface border border-line rounded-card", className)}>{children}</div>;
}

export function Bar({ value, tone = "ink", className }: { value: number; tone?: "ink" | "good" | "accent"; className?: string }) {
  const c = { ink: "bg-ink", good: "bg-good", accent: "bg-accent" }[tone];
  return (
    <div className={cx("h-1 rounded-chip bg-ink/10 overflow-hidden", className)} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className={cx("h-full rounded-chip transition-[width] duration-250 ease-out", c)} style={{ width: `${value}%` }} />
    </div>
  );
}

export function Segmented<T extends string>({ options, value, onChange, className }: { options: { id: T; label: string }[]; value: T; onChange: (v: T) => void; className?: string }) {
  return (
    <div role="tablist" className={cx("flex p-1 rounded-ctl bg-ink/[0.06]", className)}>
      {options.map((o) => (
        <button
          key={o.id}
          role="tab"
          aria-selected={o.id === value}
          onClick={() => onChange(o.id)}
          className={cx(
            "flex-1 h-9 rounded-[6px] text-[14px] font-medium transition-colors duration-150",
            o.id === value ? "bg-surface text-ink border border-line" : "text-ink-muted",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Row({ title, meta, onClick, right, lead }: { title: ReactNode; meta?: ReactNode; onClick?: () => void; right?: ReactNode; lead?: ReactNode }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 py-3.5 min-h-14 text-left active:bg-ink/[0.03]">
      {lead}
      <div className="flex-1 min-w-0">
        <div className="text-[16px] leading-6">{title}</div>
        {meta && <div className="mono text-[13px] text-ink-muted mt-0.5">{meta}</div>}
      </div>
      {right}
      {onClick && <ChevronRight {...ICON} className="text-ink-muted shrink-0" />}
    </button>
  );
}

export function Field({ label, type = "text", placeholder, helper, error, defaultValue, trailing }: { label: string; type?: string; placeholder?: string; helper?: string; error?: string; defaultValue?: string; trailing?: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[14px] font-medium mb-1.5">{label}</span>
      <span className="relative block">
        <input
          type={type}
          placeholder={placeholder}
          defaultValue={defaultValue}
          aria-invalid={!!error}
          className={cx(
            "w-full h-12 px-3.5 rounded-ctl bg-surface text-[16px] border outline-none transition-colors duration-150 placeholder:text-ink-muted/70",
            error ? "border-accent border-2" : "border-line focus:border-ink focus:border-2",
            !!trailing && "pr-16",
          )}
        />
        {trailing && <span className="absolute right-1 top-1/2 -translate-y-1/2">{trailing}</span>}
      </span>
      {(error || helper) && <span className={cx("block text-[14px] mt-1.5", error ? "text-accent-text" : "text-ink-muted")}>{error ?? helper}</span>}
    </label>
  );
}

export function AppBar({ back, onClose, title, right }: { back?: Screen; onClose?: () => void; title?: ReactNode; right?: ReactNode }) {
  const { go, openDrawer } = useNav();
  return (
    <header className="sticky top-0 z-20 bg-paper border-b border-line lg:hidden safe-top">
      <div className="safe-row px-5 flex items-center gap-3">
        {onClose ? (
          <IconBtn label="Close" onClick={onClose}><X {...ICON} /></IconBtn>
        ) : back ? (
          <IconBtn label="Back" onClick={() => go(back)}><ChevronLeft {...ICON} /></IconBtn>
        ) : (
          <IconBtn label="Open menu" onClick={openDrawer}><Menu {...ICON} /></IconBtn>
        )}
        <div className="flex-1 min-w-0 flex items-center pl-1 truncate">{title ?? <Wordmark />}</div>
        {right ?? <Avatar size={32} onClick={() => go("settings")} />}
      </div>
    </header>
  );
}

export function Avatar({ size = 40, onClick }: { size?: number; onClick?: () => void }) {
  const el = (
    <span className="grid place-items-center rounded-full bg-ink text-paper font-semibold" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      MC
    </span>
  );
  return onClick ? (
    <button aria-label="Settings" onClick={onClick} className="size-11 grid place-items-center -mx-1.5">{el}</button>
  ) : el;
}

export function Page({ children, className, wide }: { children: ReactNode; className?: string; wide?: boolean }) {
  return <main className={cx("px-5 pt-8 pb-12 mx-auto w-full anim-in", wide ? "lg:max-w-[1040px] lg:px-10 lg:pt-10" : "max-w-[560px] lg:pt-10", className)}>{children}</main>;
}

export function Title({ children, className }: { children: ReactNode; className?: string }) {
  return <h1 className={cx("font-serif font-medium text-[28px] leading-8 tracking-[-0.01em]", className)}>{children}</h1>;
}
export function H2({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cx("font-serif font-medium text-[20px] leading-[26px]", className)}>{children}</h2>;
}

export function StickyBottom({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-10 -mx-5 px-5 pt-3 pb-[max(16px,env(safe-area-inset-bottom))] bg-paper border-t border-line mt-8 lg:mx-0 lg:px-0 lg:border-0 lg:bg-transparent">
      {children}
    </div>
  );
}

export function StreakStrip({ days, muted }: { days: DayState[]; muted?: boolean }) {
  const L = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <ol className="flex justify-between" aria-label="This week">
      {days.map((d, i) => (
        <li key={i} className="flex flex-col items-center gap-1.5">
          <span className="text-[12px] text-ink-muted font-medium">{L[i]}</span>
          <span className={cx("relative grid place-items-center size-9", d === "today" && "before:absolute before:inset-x-[-4px] before:inset-y-1 before:bg-marker before:rounded-chip before:-rotate-2")}>
            <span
              className={cx(
                "relative grid place-items-center size-8 rounded-full",
                d === "done" && (muted ? "border border-line" : "bg-ink text-paper"),
                d === "missed" && "border-[1.5px] border-ink/40",
                d === "today" && "border-[1.5px] border-dashed border-ink",
                d === "future" && "border border-line",
              )}
            >
              {d === "done" && !muted && <Check size={16} strokeWidth={2} />}
            </span>
          </span>
          <span className="sr-only">{d}</span>
        </li>
      ))}
    </ol>
  );
}

export function Stat({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="flex-1 py-3">
      <div className="font-serif font-medium text-[28px] leading-8">{value}</div>
      <div className="text-[13px] text-ink-muted mt-0.5">{label}</div>
    </div>
  );
}

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
