# AGENTS.md - Monte9/Monte9

For AI agents working in this repo.

## What this is

This repo does two jobs:

1. **GitHub profile README** — `README.md` at the root renders on
   github.com/Monte9. It is hand-curated. Never modify it as part of site
   work; only touch it when Monte explicitly asks for profile changes.
2. **montethakkar.com** — a personal site: **Next.js 16 App Router on Vercel
   (NOT static export)**, React 19, Tailwind 4, markdown blog, with serverless
   route handlers (e.g. `/api/learn`). See `agent/GOAL.md` for the current
   product north star and **`agent/ARCHITECTURE.md` for how the code is
   structured and why** (read it before any cross-cutting change).

## Agents & skills roster

**Subagents** (`.claude/agents/`, spawned via the Agent tool for fresh context):

- **`architect`** — keeper of how the site is structured and why. Tap it to
  review whether a change fits, decide where new code/features/deps should live,
  plan a refactor or a component split, or answer "why is it this way?". Owns
  `agent/ARCHITECTURE.md`. Does not write feature code — returns guidance + a
  plan.
- **`planner`** — expands `agent/GOAL.md` into `SPEC.md` + an ordered
  `BACKLOG.md` of small, evaluable sprints. Used by the build-sprint harness.
- **`evaluator`** — fresh-context judge: agrees acceptance criteria pre-build,
  then drives the running site with Playwright and issues a PASS/FAIL verdict
  against `agent/RUBRIC.md`. Used by the build-sprint harness.

**Skills** (`.claude/skills/`, invokable routines):

- **`build-sprint`** — the autonomous build harness (planner → builder →
  evaluator) that drives `agent/GOAL.md` to done, one sprint at a time.
- **`creator`** — picks the most interesting next thing (an `/apps` experiment or
  a `/posts` note) and ships one to `main` (green/grounding-gated).
- **`labs-auto`** — the app-only predecessor of `creator` (generate 3 web-dev
  prototypes, judge with evolving taste, ship 1 to `/apps`). **Superseded by
  `creator`** (the scheduled routine); kept runnable for manual app-only runs.

Routine memory lives in `agent/{apps,posts,creator}/` (JOURNAL/TASTE/IDEAS/…);
each routine has a README.

## Repo conventions

**Stack:** Next.js 16 (App Router on Vercel, **not** static export — route
handlers run as serverless functions), React 19, TypeScript (strict), Tailwind 4,
markdown posts with frontmatter, pnpm. `@/*` → `./src/*` path alias (use it; no
`../` relative imports). Full detail + the decision log: `agent/ARCHITECTURE.md`.

**Code layout (feature-first):**

- `src/app/` — routing only; thin `page.tsx` shells + `api/**` route adapters
- `src/components/{chrome,theme,ui}/` — shared, cross-feature UI + primitives
- `src/features/<feature>/` — self-contained slices (`learn`, `apps`, `posts`,
  `travel`); each owns its `components/hooks/client/server/data/types`
- `src/lib/` — cross-feature utilities only (`format`, `nav`, `theme`, `globe-utils`)

**Content paths:**

- `content/posts/` - blog posts (markdown + frontmatter: title, date,
  description). Filename = slug. Loaded by `src/features/posts/server/posts.ts`.
- `public/resume.pdf` - Monte's resume; the Résumé nav link appears
  automatically when this file exists
- `agent/` - harness state (GOAL, SPEC, BACKLOG, STATE, RUBRIC, **ARCHITECTURE**,
  evals)

**Git workflow:**

- Standing permission: push committed work directly to main
  (`git push origin HEAD:main`). Batch a work stream into one push — Vercel
  deploys cost.
- `pnpm build` must pass before any push that touches the site.
- Commit prefixes: `site:` (site changes), `post:` (new blog post),
  `refactor(...):` (structure/no-behavior-change), `feat(sprint-N):` (harness
  sprint), `profile:` (README changes).

## Environment notes

- Playwright browsers are pre-installed at `/opt/pw-browsers`; the module
  resolves via `NODE_PATH=/opt/node22/lib/node_modules`. The evaluator drives a
  real headless Chromium (screenshots + interaction). The Playwright CDN is
  blocked, so never run `playwright install` — the browsers are already there.
- npm registry access works; `pnpm install` is fine.
- Secrets (`ANTHROPIC_API_KEY`, `LEARN_STATS_TOKEN`, Upstash creds) live in
  **Vercel env only — never in the browser**; read them via `rate-limit.ts`'s
  `readEnv`.
- `git push origin HEAD:main` works from cloud sessions. If a push is rejected
  because the remote moved, fetch and rebase, then push again.
