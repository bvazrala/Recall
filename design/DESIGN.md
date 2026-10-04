# Recall design: the notebook

This folder is the source of truth for how the web app looks. The reference screens in `design/screens/` open in any browser, and their inline CSS is the exact spec. If the app and this folder disagree about visuals, this folder wins. Behavior, routes, and data stay as they are in `apps/web`.

Recall looks like a student's notebook. Ruled paper is the ground. What a student would write by hand (headings, numbers, notes) is in blue ink. What Recall prints (questions, answers, forms, buttons) is in a clean print typeface. Buttons and sections are manila folders with colored tabs, and a teacher's red pen marks mistakes.

## Reference screens

| File | What it shows |
|---|---|
| `screens/brand-sheet.html` | Colors, type, and every component |
| `screens/desktop-home.html` | Desktop home: binder nav, today's folder, reviews chart, streak |
| `screens/phone-home.html` | Phone home |
| `screens/phone-class.html` | Class page: class tab, folder tabs, week strip, index cards |
| `screens/phone-quiz.html` | Quiz question after grading |
| `screens/phone-signup.html` | Create account |

## Rules

1. **Ink blue is the main action.** Each screen has at most one ink-blue folder button. Other actions are manila folders or underlined ink links.
2. **Red pen marks mistakes only:** wrong answers, "Not quite." notes, form errors, and the destructive "Delete my data" link. Never use it for buttons, decoration, or charts.
3. **Each class keeps one tab color everywhere.** Assign in order: green, purple, orange.
4. **The highlighter marks one thing that needs attention**, such as the active nav item or today's count.
5. **One sticky note per screen at most**, used for the streak.
6. **Handwriting vs. print.** Architects Daughter is for headings, dates, big numbers, tab labels, and margin notes. Atkinson Hyperlegible is for everything someone must read quickly: questions, answer choices, body text, forms, and buttons.
7. **Never bold the handwriting.** Architects Daughter has one weight (400). Bold classes on it make the browser fake a heavier version, which looks smudged.
8. **No AI-template tells:** no all-caps labels above headings, no monospace labels, no "A · B · C" metadata strings. Write a sentence instead: "14 cards and 1 quiz, about 12 minutes."
9. **Icons are lucide-react at stroke width 2**, in graphite or pencil gray. Grading marks use the hand-drawn SVG paths at the end of this file.
10. **Keep demo numbers consistent across screens.** A 12-day streak means every day in the week strip is checked, due counts add up across classes, and exam countdowns match the dates.

## Tokens

Replace the `@theme` block in `apps/web/src/app/globals.css` with this one. The names `paper`, `surface`, `ink`, `ink-muted`, `line`, and `marker` are kept so existing classes keep working. Their values change.

```css
@theme {
  --color-paper: #fdfcf8;        /* ruled notebook paper */
  --color-surface: #ffffff;      /* index cards, the printed quiz sheet */
  --color-rule: #d6e2f3;         /* ruled lines */
  --color-margin: #efa3a3;       /* red margin line */
  --color-pen: #1e3f96;          /* ballpoint blue: handwriting and the main action */
  --color-pen-dark: #142b66;
  --color-ink: #23272e;          /* graphite: body text */
  --color-ink-muted: #5b616b;    /* pencil: secondary text */
  --color-line: #e3e6ec;         /* dividers on white cards */
  --color-redpen: #c9302c;       /* mistakes only */
  --color-marker: #ffe96b;       /* highlighter */
  --color-sticky: #ffe873;
  --color-manila: #f2dca5;
  --color-manila-shade: #e4c886; /* inactive folder tabs */
  --color-manila-edge: #d9be7c;
  --color-folder-text: #4a3f1e;
  --color-field-line: #6f86b8;   /* underline of text fields */
  --color-class-green: #2b7a4b;
  --color-class-purple: #6a4aa0;
  --color-class-orange: #a85a16;
  --color-bubble-blue: #0b84fe;  /* only for iMessage previews */
  --color-bubble-gray: #e9e9eb;
}

@theme inline {
  --font-hand: var(--font-architects-daughter), cursive;
  --font-sans: var(--font-atkinson), ui-sans-serif, system-ui, sans-serif;
}
```

How the old tokens move:

| Old usage | New usage |
|---|---|
| `font-serif` (headings) | `font-hand`, and drop any `font-semibold` or `font-bold` on it |
| `font-mono` (small labels) | `font-sans` in sentence case, or `font-hand` for a margin note |
| `bg-ink` on buttons | Folder button in `bg-pen` (see components) |
| `bg-ink` on the avatar | `bg-pen` |
| `bg-accent`, `text-accent*`, `border-accent` | `pen` for actions and emphasis; `redpen` only for mistakes |
| `text-good`, `bg-good` | `pen` for correct marks. Green is reserved for class tabs. |
| `rounded-card` | Index cards use `rounded-[3px]`. Folders use `rounded-[0_14px_14px_14px]`, square at the top left under the tab. |
| `shadow-card` | Each object's own shadow (see components) |

Contrast on paper, all checked: ink 14.6:1, pen 9.3:1, pencil 6.1:1, redpen 5.2:1. White text on pen is 9.5:1, on class green 5.3:1, on class purple 6.8:1, and on class orange 5.1:1.

## Fonts

In `apps/web/src/app/layout.tsx`, replace Newsreader, Instrument Sans, and IBM Plex Mono with:

```ts
import { Architects_Daughter, Atkinson_Hyperlegible } from "next/font/google";

const hand = Architects_Daughter({ subsets: ["latin"], weight: "400", variable: "--font-architects-daughter" });
const print = Atkinson_Hyperlegible({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-atkinson" });

// <html lang="en" className={`${hand.variable} ${print.variable}`}>
```

Type scale, taken from the reference screens:

| Role | Phone | Desktop |
|---|---|---|
| Greeting or page title (hand) | 34px, line-height 1.2 | 52px, 1.15 |
| Class name (hand) | 38px | 44px |
| Form title (hand) | 30px | 36px |
| Section heading (hand) | 22 to 24px | 30 to 35px |
| Big number on a sticky note (hand) | 42px | 62px |
| Stat number (hand) | 29px | 38px |
| Folder tab label (hand) | 16 to 17px | 17px |
| Card label or margin note (hand) | 15px | 15px |
| Body (print) | 17px, line-height 1.5 | 17px |
| Secondary text (print) | 15px | 15px |
| Button (print, bold) | 17px | 18px |

## Components

These are the shared pieces in `apps/web/src/components/ui.tsx`, restyled. The CSS below is copied from the reference screens.

### Ruled paper (`Page` background)

```css
background:
  linear-gradient(90deg, transparent 27px, var(--color-margin) 27px 29px, transparent 29px),
  linear-gradient(var(--color-paper), var(--color-paper)) 0 0 / 100% 88px no-repeat,
  repeating-linear-gradient(180deg, transparent 0 31px, var(--color-rule) 31px 32px) 0 88px / 100% 100% no-repeat,
  var(--color-paper);
```

- **Phone:** the margin line sits at 28px and content starts at 44px from the left. The top 88px is plain paper, for the header.
- **Desktop main area:** the margin line sits at 64px, content starts at 96px, and the plain top band is 40px.

### Folder button (`Button`)

- **Primary:** an ink-blue folder.
  - Body: `relative min-h-[52px] rounded-[0_10px_10px_10px] bg-pen px-5 py-3.5 font-bold text-white shadow-[0_3px_0_rgba(17,30,66,0.4)]`
  - Tab: an inner `<span aria-hidden>` with `absolute left-0 -top-[11px] h-3 w-24 bg-pen [clip-path:polygon(0_100%,12%_0,88%_0,100%_100%)]`
  - Leave at least 12px of space above the button for the tab.
- **Secondary:** the same shape in `bg-manila` with `text-ink` and `shadow-[0_3px_0_var(--color-manila-edge)]`. The tab is also `bg-manila`.
- **Link:** `font-bold text-pen underline decoration-2 underline-offset-[5px]`, with a minimum 44px tap height.
- **Loading or disabled:** keep the folder shape at 50% opacity. Never turn the button gray.

### Folder tabs (`Segmented`)

- **Tab row:** `flex items-end gap-1 pl-1.5`, with `role="tablist"` and `aria-selected` on each tab.
- **Active tab:** `h-10 px-6 bg-manila font-hand text-[17px] text-pen [clip-path:polygon(0_100%,10%_0,90%_0,100%_100%)]`
- **Inactive tab:** `h-[34px] px-[22px] bg-manila-shade font-hand text-[16px] text-folder-text` with the same clip-path.
- **Panel under the tabs:** `rounded-[0_14px_14px_14px] bg-manila p-4 shadow-[0_2px_0_var(--color-manila-edge),0_16px_26px_-22px_rgba(74,56,14,0.75)]`
- **Small toggles,** like Reviews and Retention on the chart, use the same tabs without a panel.

### Folder (a container such as "Today")

Use a tab label above a manila panel.

- **Tab:** `absolute left-0 -top-[25px] h-[26px] px-[22px] bg-manila font-hand text-[16px] text-folder-text`, with the clip-path above.
- **Panel:** the same as the folder-tabs panel.

### Class tab (`CodeChip`)

`inline-flex h-7 items-center px-[18px] text-sm font-bold text-white [clip-path:polygon(0_100%,10%_0,90%_0,100%_100%)]`, with the background set to that class's color.

### Index card (`Card` and `Row` for study items)

- **Card:** `rounded-[3px] bg-surface px-3.5 pt-1 pb-3 shadow-[0_1px_0_var(--color-line),0_8px_16px_-12px_rgba(30,63,150,0.55)]`
- **Red top line:** `background-image: linear-gradient(180deg, transparent 0 32px, #ee9a9a 32px 33.5px, transparent 33.5px)`
- **Label on the top line:** `font-hand text-[15px] text-ink-muted`, such as "Study guide", "Flashcards", or "Quiz".
- **Title:** print, bold.
- **Details:** print 15px pencil gray. Write them as a sentence: "About 6 minutes. Not started yet."
- **`SourceChip`:** a lucide `Paperclip` icon at 16px plus the filename, in pencil gray. It shows where the content came from.

### Sticky note (streak)

- **Note:** `relative -rotate-2 bg-sticky px-4 pt-5 pb-4 shadow-[0_14px_18px_-14px_rgba(91,72,0,0.7)]`
- **Tape:** `absolute -top-[9px] left-10 h-[18px] w-14 rotate-[4deg] bg-white/60`
- **Number:** `font-hand text-[42px] leading-none text-pen`
- **Label:** `font-hand text-[18px] text-[#3b3418]`

### Text field (`Field`)

- **Label:** print bold 16px.
- **Input:** `h-11 w-full border-0 border-b-2 border-field-line bg-transparent px-0.5 text-[18px] text-ink`, meaning you write on a line. Keep the visible focus ring.
- **Help text:** 15px pencil gray.
- **Error text:** 15px `text-redpen`.

### Highlighter

`bg-[linear-gradient(180deg,transparent_40%,var(--color-marker)_40%,var(--color-marker)_92%,transparent_92%)] px-1`

### Navigation (`AppShell`)

- **Desktop sidebar:** `bg-manila` with an inset right edge, `shadow-[inset_-2px_0_0_var(--color-manila-edge)]`.
  - Items are print bold 17px in `text-folder-text`.
  - The active item is a paper tab joined to the page (`bg-paper rounded-l-[10px]`) with the highlighter on its label.
  - Counts are `font-hand text-[19px] text-pen`.
  - The wordmark is `font-hand text-[36px] text-pen`, followed by a red-pen period.
- **Phone drawer:** the same list on manila.
- **Phone header:** menu button, wordmark, and avatar, inside the plain top band of the paper.

### Charts and progress (`Bar`, the reviews chart)

- **Bars:** `bg-pen` with 3px rounded tops, and a 2px graphite baseline.
- **Today's bar:** hatched, `repeating-linear-gradient(135deg, var(--color-pen) 0 3px, transparent 3px 7px)`, with an inset 2px pen outline. Its count sits above it in hand writing with the highlighter.
- **Axis labels:** print 14px pencil gray.
- **Never use red in a chart.**

### Grading (quiz feedback)

- **The question sheet:** an index card without the red line.
- **Answer choices:** print 17px, divided by `border-line`.
- **The correct choice:** a hand-drawn ink circle around its letter, plus an ink check at the right.
- **A wrong choice the student picked:** a red X over its letter, plus "your answer" in `font-hand text-[15px] text-redpen`.
- **Feedback under the sheet:**
  - "Not quite." in `font-hand text-[25px] text-redpen`
  - Why the right answer is right, in print
  - Why their choice is wrong, in print
  - A source line: a paperclip icon plus "From your notes: Lecture 5, slide 14"
- **Correct and wrong must also differ in shape and text, not only color.**

Hand-drawn marks. All use `fill="none"` with `stroke-linecap="round"`:

| Mark | viewBox | Stroke width | Path |
|---|---|---|---|
| Check | `0 0 24 24` | 2.6 | `M4.5 13.2c2 1.6 3.4 3.3 4.6 5.3C11.8 12.6 15.4 8 20 4.6` |
| Circle | `0 0 40 38` | 2 | `M21 3.2C30.6 2.8 37.6 9 37.2 18.6 36.8 28.2 29.2 34.8 19.8 34.6 10.4 34.4 2.8 27.6 3 18.6 3.2 9.6 10.4 3.4 19.6 4.2` |
| X | `0 0 24 24` | 2.4 | `M5 4.6c4.6 4.4 9.2 9.6 14 14.8M18.8 4.8C13.6 9.4 9.2 14.2 4.6 19.4` |

## Screens

| Route in `apps/web` | Reference |
|---|---|
| `(bare)/signup`, `(bare)/login` | `phone-signup.html` |
| `(app)/home` | `phone-home.html`, `desktop-home.html` |
| `(app)/classes/[classId]` | `phone-class.html` |
| `(bare)/quizzes/take` | `phone-quiz.html` |

These routes have no reference screen yet. Build them from the components and rules above.

- `(bare)/` (landing): a handwritten headline on ruled paper. iMessage previews keep the iMessage bubble colors, because they show the real channel.
- `(app)/classes` (list): one manila folder per class, each with its class tab, name, and next exam date.
- `(app)/classes/new` (upload): a dashed ink-outlined drop area on the paper, a secondary folder button labeled "Choose file", and the main action "Build my plan".
- `(app)/classes/new/processing`: the steps as a handwritten checklist, with ink checks as each step finishes.
- `(app)/classes/new/confirm`: topics as an index-card list with ink checkboxes and small manila week tabs. The main action is "Looks right, build my plan".
- `(app)/classes/[classId]/[topicId]`: a study guide on an index card, with its source chips.
- `(app)/flashcards` and `(bare)/flashcards/study`:
  - Each card is a literal index card. Tap to see the back.
  - The rating choices are manila folder buttons.
- `(app)/quizzes`, `(app)/quizzes/results`, and `(app)/quizzes/review`:
  - Results are a graded sheet: the score in hand writing, with red-pen marks only on misses.
  - Review uses the grading pattern above.
- `(app)/settings`:
  - Each section (Daily text, Quiet hours, Classes, Account) is a manila folder.
  - Text inputs are line fields.
  - "Delete my data" is a red-pen text link that asks for confirmation.
- Empty states: a short handwritten note in pencil gray, plus one folder button that says what to do next, such as "Upload a syllabus".
