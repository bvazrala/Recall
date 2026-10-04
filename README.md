# Recall

Spaced repetition that enhances study methods through text messages. A student gets about one text a day with a review question, replies with an answer, and Recall grades it and schedules the next review using the [FSRS](https://github.com/open-spaced-repetition/ts-fsrs) algorithm.

> **Status:** early scaffold. Scheduling logic, the study-day API and the web app's Home, Flashcards and Study screens work against the real server. The rest of the web UI (classes, quizzes, uploads, settings, auth) is built to the design but runs on placeholder data. Grading, inbound message handling, the agent and Photon integration are not built yet.

## Tech stack

| Area | Choice |
|---|---|
| Language | TypeScript (strict, ES modules) |
| Monorepo | pnpm workspaces |
| Frontend | Next.js (App Router), React, Tailwind CSS |
| Backend | [Mastra](https://mastra.ai) server (Hono under the hood) with custom API routes |
| Database | Postgres on [Neon](https://neon.tech), via Drizzle ORM and drizzle-kit |
| Scheduling | `ts-fsrs` |
| Tests | Vitest |
| Planned | Photon (iMessage), Better Auth, Zod |

## Getting started

**Prerequisites:** Node 22.13 or newer (`.nvmrc` pins 24) and pnpm. The exact pnpm version is in `packageManager` in the root `package.json`; `corepack enable` will pick it up.

```bash
pnpm install

# Mastra server  -> http://localhost:4111
cp apps/server/.env.example apps/server/.env
pnpm --filter @recall/server dev

# Web app (in a second terminal)  -> http://localhost:3000
cp apps/web/.env.example apps/web/.env.local
pnpm --filter @recall/web dev
```

Open http://localhost:3000 for the landing page, or http://localhost:3000/home for the dashboard. The data-backed screens (Home, Flashcards, Study, the Topics tab of a class) call the Mastra server, so it must be running with a working `DATABASE_URL`.

**Pick a student for the web app.** There is no sign-in yet, so the web app acts as a single student chosen by `NEXT_PUBLIC_STUDENT_ID` in `apps/web/.env.local`. It must be a real `students.id` **UUID** (the server returns `400` for anything else, e.g. `1`). Find one with `select id from students;`. A student with no topics sees the empty Home state; add topics and flashcards through the API (see below) to see the full dashboard. Restart the web dev server after changing the variable, since `NEXT_PUBLIC_` values are read at startup.

Mastra's Studio (a dev UI for agents) is served at http://localhost:4111.

### Database

Only needed when working on `packages/db`.

```bash
cp packages/db/.env.example packages/db/.env   # paste your Neon connection string
pnpm db:migrate                                # apply migrations
pnpm db:check                                  # insert, read back and delete a test student
```

### Study-day API

Students study **topics**, each with flashcards. Every topic has a confidence level (`red` < `yellow` < `green` < `star`) backed by a 0-100 score. At the start of each day the 5 lowest-confidence topics are suggested and frozen for that day. Confidence is how likely the student is to remember a topic right now, so it rises when they review and falls as days pass without studying (see below). At the end of the day the student can override levels, then the day number advances.

Set `DATABASE_URL` in `apps/server/.env` first. There is no auth yet: routes take `studentId` in the path.

**Conventions**
- All ids are UUIDs; a malformed id returns `400`.
- Request bodies are JSON and are validated by the Zod schemas in [packages/core/src/schemas/index.ts](packages/core/src/schemas/index.ts).
- Errors are `{ "error": "message" }`. A `400` from validation also has `issues`. Statuses used: `400` bad input, `404` not found, `409` conflict.
- Timestamps are ISO 8601 strings, on the student's clock (see `nowFor` in `core/clock.ts`).
- Levels are `"red" | "yellow" | "green" | "star"`. Score bands: red 0-24, yellow 25-49, green 50-74, star 75-100. Ratings are `1` Again, `2` Hard, `3` Good, `4` Easy. Score bands live in `packages/core/src/confidence/levels.ts`; how a score is computed lives in `score.ts` beside it.

Shapes used below:

```ts
Topic     = { id, studentId, name, description: string | null, confidenceScore: number,
              confidenceLevel: Level, lastStudiedAt: string | null, archived: boolean, createdAt: string }
Flashcard = { id, topicId, questionId, question: string, answer: string,
              due: string, state: number, reps: number, lapses: number, createdAt: string }
DayTopic  = { topicId, name, position: number,            // 1 = lowest confidence
              scoreBefore, levelBefore,                    // when the day opened
              scoreNow, levelNow,                          // current
              scoreAfter: number | null, levelAfter: Level | null, // set when the day closes
              overridden: boolean }
```

#### Topics

| Route | Body / query | Success response |
|---|---|---|
| `GET /students/:studentId/topics` | `?includeArchived=true` (optional) | `200` `{ topics: (Topic & { flashcardCount })[] }`, lowest confidence first |
| `POST /students/:studentId/topics` | `{ name: string (1-120), description?: string (max 500) }` | `201` `{ topic: Topic }`. `409` if the name already exists for this student |
| `PATCH /topics/:topicId` | any of `{ name, description (string or null), archived }`, at least one | `200` `{ topic: Topic }`. `409` on a duplicate name |
| `DELETE /topics/:topicId` | none | `204`. Also deletes the topic's flashcards and its history in past days |

#### Flashcards

| Route | Body / query | Success response |
|---|---|---|
| `GET /topics/:topicId/flashcards` | none | `200` `{ flashcards: Flashcard[] }`, oldest first |
| `POST /topics/:topicId/flashcards` | `{ question: string (1-2000), answer: string (1-4000) }` | `201` `{ flashcard: Flashcard }` |
| `PATCH /flashcards/:cardId` | `{ question?, answer? }`, at least one | `200` `{ flashcard: Flashcard }` |
| `DELETE /flashcards/:cardId` | none | `204` |

#### Daily loop

| Route | Body / query | Success response |
|---|---|---|
| `GET /students/:studentId/day` | none | `200` `{ day: { number, status: "open" \| "closed", startedAt }, topics: DayTopic[] }`. The first call of a day picks and freezes the 5 topics (fewer if the student has fewer); later calls return the same list with current scores |
| `GET /students/:studentId/day/flashcards` | `?topicId=` (required, must be one of today's topics) | `200` `{ flashcards: { id, question, answer, due, state, reps, lapses }[] }`, earliest due first. `409` if the day hasn't been opened, `404` if the topic isn't in today's list |
| `POST /flashcards/:cardId/review` | `{ rating: 1 \| 2 \| 3 \| 4 }` | `200` `{ card: { id, due, state, reps, lapses }, topic: { id, previousLevel, score, level } }`. `409` if the card's topic isn't in the open day |
| `POST /students/:studentId/day/close` | `{ dayNumber?: number, overrides?: { topicId, level }[] }` | `200` `{ closed: { number, topics: DayTopic[] }, next: { number, topics: DayTopic[] } }`. Closing also opens the next day |
| `GET /students/:studentId/history` | none | `200` `{ currentDay: number, days: { number, status, startedAt, closedAt: string \| null, topics: DayTopic[] }[] }`, oldest first |

#### How confidence works

A topic's score is the stability-weighted mean of its flashcards' FSRS recall chance (0-100). Cards that have never been reviewed count as 0, suspended cards are ignored, and a topic with no cards scores 0. A review of one card changes its stability, so well-learned cards both score higher and fade more slowly.

The score is stored once per student-local calendar date in `topic_confidence_days` (`topicId, date, score, overridden`). That table is the only place confidence is stored; levels are always derived from the score.
- Anything that changes a topic's cards (a review, adding or deleting a flashcard, creating the topic) writes that day's row.
- Every read that shows confidence first fills in the days nothing happened (up to 365), so decay shows up in the history without a nightly job. Moving a demo student's clock forward and reading again produces the decayed days.
- A manual override in "close day" changes that date's cell only. It is kept until the topic's cards next change; the following day's score comes from the cards again.

#### Confidence grid

| Route | Body / query | Success response |
|---|---|---|
| `GET /students/:studentId/confidence-grid` | `?days=30` (1-365), `?includeArchived=true` (optional) | `200` `{ dates: string[], topics: { id, name, archived, current: { score, level }, cells: ({ score, level, overridden } \| null)[] }[] }` |

`dates` are the student's local calendar dates (`YYYY-MM-DD`), oldest first, ending today. `cells` has one entry per date; `null` means the topic did not exist yet. Topics are ordered lowest confidence first.

Notes on closing a day:
- Always send `dayNumber` (the day you think you are closing). If it isn't the current day, the server returns `409` instead of closing the next day, so a double click or a retry is safe.
- An override to a different level sets the score to the middle of that level's band (red 12, yellow 37, green 62, star 87) and marks the topic `overridden`. An override to the level a topic already has changes nothing.
- A topic in `overrides` that isn't part of the day returns `400`.

Example, one day end to end:

```bash
curl localhost:4111/students/$SID/day
curl -X POST localhost:4111/flashcards/$CARD/review -H 'content-type: application/json' -d '{"rating":3}'
curl -X POST localhost:4111/students/$SID/day/close -H 'content-type: application/json' \
  -d '{"dayNumber":1,"overrides":[{"topicId":"'$TOPIC'","level":"green"}]}'
```

### Everyday commands

```bash
pnpm test           # Vitest, in packages that define tests (currently core)
pnpm typecheck      # tsc across every workspace package
pnpm db:generate    # generate a migration after changing the schema
pnpm --filter @recall/web build   # production build of the web app (also type-checks it)
```

Try the API without the frontend:

```bash
curl http://localhost:4111/example
# {"message":"Example endpoint"}
```

## Where things live

```
apps/
  server/                 Mastra server (the backend)
    src/mastra/index.ts     Mastra config: port, CORS, and the list of API routes
    src/mastra/routes/      One file per custom API route
  web/                    Next.js web app
    src/app/                Routes (App Router). Each page.tsx is a thin wrapper around a screen
      (app)/                  Pages inside the sidebar/drawer shell: home, classes, quizzes, flashcards, settings
      (bare)/                 Full-bleed pages with no shell: landing, login, signup, flashcards/study, quizzes/take
    src/screens/            The screen components, one file per area (home, flashcards, study, classes, quizzes, settings, public)
    src/components/         ui.tsx (design primitives: Button, Card, Chip, Bar, ...), app-shell.tsx, day-context.tsx, load-state.tsx
    src/lib/api.ts          fetch helper, useLoad hook, and the student id (NEXT_PUBLIC_STUDENT_ID)
    src/lib/types.ts        Response shapes of the server routes the web app uses
    src/lib/day-data.ts     Loads today's day plus each topic's flashcards
    src/lib/stats.ts        Streak and retention series from /history and /confidence-grid
    src/lib/nav.tsx         Screen name -> URL map (ROUTES) and the useNav() hook
    src/lib/mock.ts         Placeholder data for screens with no backend yet
    src/app/globals.css     Design tokens (colors, radii, fonts) in a Tailwind @theme block
photon/                   Spectrum (iMessage) integration; has its own README and is not part of the pnpm workspace apps
packages/
  core/                   Pure logic with no database or network code (@recall/core)
    src/fsrs/               Scheduling: grade + confidence -> rating, review a card, retrievability
    src/clock.ts            The only source of "now" (supports the demo clock offset)
    src/{inbound,grade,verify,schedule,dsa,math,schemas}/   Stubs, each with a comment describing its job
  db/                     Drizzle schema, client and migrations (@recall/db)
    src/schema/             One file per table, re-exported from index.ts
    migrations/             Generated SQL. Do not edit by hand.
```

### Web screens: real data vs placeholders

| Screen | Route | Data |
|---|---|---|
| Home | `/home` | Real: `/day`, `/history`, `/confidence-grid`, `/topics`. The chart's Reviews tab, the "next text" time and the user's name are placeholders |
| Flashcards | `/flashcards` | Real: today's topics and their cards |
| Study | `/flashcards/study` (`?topic=<id>` for one topic) | Real: posts each rating to `/flashcards/:id/review` |
| Class detail, Topics tab | `/classes/<class>` | Real: `/topics` |
| Classes, add class, upload and confirm flow, Week and Files tabs, study guide | `/classes/...` | Placeholder. Needs a classes entity and syllabus upload/extraction |
| Quizzes | `/quizzes/...` | Placeholder. Needs quiz routes (the `quiz_sessions` table exists) |
| Settings | `/settings` | Placeholder, local state only |
| Landing, login, signup | `/`, `/login`, `/signup` | Static. Auth is not wired; the forms go straight to `/home` |

Placeholder content is all in [apps/web/src/lib/mock.ts](apps/web/src/lib/mock.ts), with a comment on the backend each piece is waiting for. When a route is added, replace the mock import with a call to it.

The visual design comes from a Figma Make file. Colors, fonts, radii and spacing are defined once in `globals.css` and used through Tailwind classes (`bg-paper`, `text-ink-muted`, `rounded-card`, `font-serif`, ...), so match those rather than hard-coding values.

### How the pieces fit

- **Keep logic in `packages/core`.** Grading, scheduling and FSRS decisions are deterministic code. The LLM agent can generate and phrase things, but it should never decide a grade or a due date.
- **Routes stay thin.** A route in `apps/server` should parse the request, call into `core` and `db`, and return JSON.
- **The web app never touches the database.** It depends on `@recall/core` for shared types and helpers and talks to data through the server API.
- **Time goes through `nowFor()`** in `core/clock.ts`, so demo accounts can fast-forward days.

## Adding things

**An API route.** Copy [apps/server/src/mastra/routes/example.ts](apps/server/src/mastra/routes/example.ts), change the path and handler, then add it to `apiRoutes` in [apps/server/src/mastra/index.ts](apps/server/src/mastra/index.ts). Custom routes are served at the server root (`/example`), not under `/api`; that prefix is for Mastra's built-in endpoints. Set `requiresAuth` explicitly on every route.

**A page.** Build the screen in `apps/web/src/screens/` and add a folder under `apps/web/src/app/` with a `page.tsx` that renders it. Put it in `(app)/` to get the sidebar and drawer, or `(bare)/` for a full-bleed page. To link to it by name, add it to `ROUTES` in `src/lib/nav.tsx`. Load data with `useLoad(() => api(forStudent("/your-route")))` from `src/lib/api.ts`, and use the primitives in `src/components/ui.tsx` instead of restyling.

**A database table.**
1. Add `packages/db/src/schema/<table>.ts`.
2. Re-export it from `packages/db/src/schema/index.ts`.
3. Run `pnpm db:generate` and commit the new migration.
4. Run `pnpm db:migrate` to apply it.

## Contributing

1. Branch from `main`. Don't commit directly to it.
2. Make your change, and add tests for logic in `packages/core` (`*.test.ts` next to the file).
3. Before opening a PR, run `pnpm typecheck` and `pnpm test`, and run `pnpm --filter @recall/web build` if you touched the web app.
4. Open a pull request against `main` describing what changed and why.

Conventions:
- Pin exact dependency versions, as the existing `package.json` files do.
- Never commit secrets. `.env` files are gitignored; add new variables to the matching `.env.example`.
- Commit generated migrations, but never hand-edit them.
- Use the lockfile that matches the package manager: `pnpm-lock.yaml`. Don't run `npm install` or commit a `package-lock.json`.
