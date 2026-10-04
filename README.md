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
