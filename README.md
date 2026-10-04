# Recall

Spaced repetition that enhances study methods through text messages. A student gets about one text a day with a review question, replies with an answer, and Recall grades it and schedules the next review using the [FSRS](https://github.com/open-spaced-repetition/ts-fsrs) algorithm.

> **Status:** early scaffold. Scheduling logic, the `students` table, the Mastra server and a placeholder dashboard work. Grading, inbound message handling, the agent and Photon integration are not built yet.

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

Open http://localhost:3000/dashboard. It fetches `/example` from the Mastra server, so the server must be running or the page will error.

Mastra's Studio (a dev UI for agents) is served at http://localhost:4111.

### Database

Only needed when working on `packages/db`.

```bash
cp packages/db/.env.example packages/db/.env   # paste your Neon connection string
pnpm db:migrate                                # apply migrations
pnpm db:check                                  # insert, read back and delete a test student
```

### Study-day API

Students study **topics**, each with flashcards. Every topic has a confidence level (`red` < `yellow` < `green` < `star`) backed by a 0-100 score. At the start of each day the 5 lowest-confidence topics are suggested and frozen for that day. Self-rating flashcards raises confidence. At the end of the day the student can override levels, then the day number advances.

Set `DATABASE_URL` in `apps/server/.env` first. There is no auth yet: routes take `studentId` in the path.

**Conventions**
- All ids are UUIDs; a malformed id returns `400`.
- Request bodies are JSON and are validated by the Zod schemas in [packages/core/src/schemas/index.ts](packages/core/src/schemas/index.ts).
- Errors are `{ "error": "message" }`. A `400` from validation also has `issues`. Statuses used: `400` bad input, `404` not found, `409` conflict.
- Timestamps are ISO 8601 strings, on the student's clock (see `nowFor` in `core/clock.ts`).
- Levels are `"red" | "yellow" | "green" | "star"`. Score bands: red 0-24, yellow 25-49, green 50-74, star 75-100. Ratings are `1` Again, `2` Hard, `3` Good, `4` Easy. Scores and per-rating changes live in `packages/core/src/confidence/levels.ts`.

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
| `GET /students/:studentId/day/flashcards` | `?topicId=` (required, must be one of today's topics) | `200` `{ flashcards: { id, question, answer, due, reps, lapses }[] }`, earliest due first. `409` if the day hasn't been opened, `404` if the topic isn't in today's list |
| `POST /flashcards/:cardId/review` | `{ rating: 1 \| 2 \| 3 \| 4 }` | `200` `{ card: { id, due, state, reps, lapses }, topic: { id, previousLevel, score, level } }`. `409` if the card's topic isn't in the open day |
| `POST /students/:studentId/day/close` | `{ dayNumber?: number, overrides?: { topicId, level }[] }` | `200` `{ closed: { number, topics: DayTopic[] }, next: { number, topics: DayTopic[] } }`. Closing also opens the next day |
| `GET /students/:studentId/history` | none | `200` `{ currentDay: number, days: { number, status, startedAt, closedAt: string \| null, topics: DayTopic[] }[] }`, oldest first |

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
  web/                    Next.js dashboard
    src/app/                Pages (App Router)
    src/lib/api.ts          Helper for calling the Mastra server
packages/
  core/                   Pure logic with no database or network code (@recall/core)
    src/fsrs/               Scheduling: grade + confidence -> rating, review a card, retrievability
    src/clock.ts            The only source of "now" (supports the demo clock offset)
    src/{inbound,grade,verify,schedule,dsa,math,schemas}/   Stubs, each with a comment describing its job
  db/                     Drizzle schema, client and migrations (@recall/db)
    src/schema/             One file per table, re-exported from index.ts
    migrations/             Generated SQL. Do not edit by hand.
```

### How the pieces fit

- **Keep logic in `packages/core`.** Grading, scheduling and FSRS decisions are deterministic code. The LLM agent can generate and phrase things, but it should never decide a grade or a due date.
- **Routes stay thin.** A route in `apps/server` should parse the request, call into `core` and `db`, and return JSON.
- **The web app never touches the database.** It depends on `@recall/core` for shared types and helpers and talks to data through the server API.
- **Time goes through `nowFor()`** in `core/clock.ts`, so demo accounts can fast-forward days.

## Adding things

**An API route.** Copy [apps/server/src/mastra/routes/example.ts](apps/server/src/mastra/routes/example.ts), change the path and handler, then add it to `apiRoutes` in [apps/server/src/mastra/index.ts](apps/server/src/mastra/index.ts). Custom routes are served at the server root (`/example`), not under `/api`; that prefix is for Mastra's built-in endpoints. Set `requiresAuth` explicitly on every route.

**A page.** Add a folder under `apps/web/src/app/` with a `page.tsx`. Call the server with `api("/your-route")` from `src/lib/api.ts`.

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
