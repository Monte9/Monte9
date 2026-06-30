# ARCHITECTURE — montethakkar.com

The structural source of truth for the site: how the code is organized, the
conventions that keep it maintainable, the invariants you must not break, and a
log of the decisions (with rationale) that got us here.

**Owned by the `architect` agent** (`.claude/agents/architect.md`). When the
structure changes, the architect updates this file in the same change — so this
doc never drifts from `src/`. Consult the architect before any cross-cutting
move (new top-level dir, a new feature, a shared abstraction, a dependency, a
data-model or routing change). See "When to consult the architect" at the end.

> Scope note: this file is about the **site** (`src/`, routing, build). The
> autonomous build/creator/labs harness lives in `agent/` and `.claude/` and is
> documented in `AGENTS.md` + each routine's README. The profile `README.md` is
> NOT part of the site.

---

## Stack (current — authoritative)

- **Next.js 16, App Router** — a standard Next app on **Vercel**, **NOT** a
  static export. `next.config.ts` sets only `trailingSlash: true`. Route
  handlers (`src/app/api/**`) run as **serverless functions**; pages without
  dynamic data are still statically optimized.
- **React 19**, **TypeScript** (strict), **Tailwind v4** (`@tailwindcss/postcss`).
- **pnpm**. Build/gate: `pnpm build` (look for "Compiled successfully"). Serve a
  prod build with `pnpm start`; dev with `pnpm dev` (`localhost:3000`).
- **Path alias:** `@/*` → `./src/*` (`tsconfig.json`). Every import uses it —
  this is load-bearing: it makes file moves cheap (consumers reference module
  names, not relative depth). Keep using it; avoid `../` relative imports.
- Content: markdown posts in `content/posts/` (frontmatter: title, date,
  description; filename = slug). 3D via `three` + `@react-three/fiber`/`drei`.
  Validation via `zod`. Generation via `@anthropic-ai/sdk`.

> History: the site began as `output: "export"`. It was switched OFF static
> export (ADR-0001) so Learn's live generation can run behind a server-held API
> key. Any doc or comment still asserting "static export" / `output: export` for
> the *current* site is stale — fix it (and tell the architect).

---

## Directory map

```
src/
  app/                      # Next App Router — routing only (thin)
    page.tsx                #   "/" = the Learn feed (the landing; there is no Home tab)
    layout.tsx, globals.css #   shell: header, tab bar, theme, global keyframes
    about/ settings/ travel/ posts/ posts/[slug]/ apps/ apps/<slug>/
    labs/ labs/[slug]/      #   legacy → /apps client redirects (keep for old links)
    api/
      health/route.ts
      learn/route.ts        #   thin adapter → features/learn/server/generate
      learn/stats/route.ts  #   thin adapter → features/learn/server/stats

  components/               # SHARED, cross-feature UI only
    chrome/                 #   DesktopNav, MobileTabBar, HeaderBrand, SiteMenu
    theme/                  #   ThemeProvider, SettingsPanel
    ui/                     #   primitives: Sheet, FullBleedStage, Redirect

  features/<feature>/       # one self-contained slice per product area
    apps/                   #   the /apps experiments (WebGL/canvas demos + registry)
    learn/                  #   the Learn feed (most actively developed)
    posts/                  #   the blog
    travel/                 #   the globe

  lib/                      # CROSS-feature utilities (no feature internals here)
    format.ts  nav.ts  theme.ts  globe-utils.ts
```

A feature owns everything specific to it, under predictable subfolders (use the
ones it needs):

```
features/learn/
  components/   # React components (LearnFeed orchestrator + cards/ leaves)
  hooks/        # useLearnSession, useLearnPrefs ("use client")
  client/       # client-side seam: learn-client (getSession), storage (localStorage)
  server/       # serverless logic: generate, stats, rate-limit (server-only)
  data/         # typed, documented data (learn-fixtures)
  types.ts      # client-safe shared types (UI + fixtures + server + zod all import)
  levels.ts     # pure domain logic (LEVELS + levelFor)
  mock-session.ts  # shared, non-"use client" mock deck builder (client + server)
```

**Where does X go? (the decision rule)**
- Used by **one feature** → `features/<that-feature>/…`.
- **Shared chrome / primitive** (nav, theme, Sheet, a generic wrapper) →
  `components/{chrome,theme,ui}`.
- **Pure cross-feature utility** (date format, route metadata, geometry math) →
  `lib/`. If it's only used by one feature, it belongs in that feature, not `lib/`.
- A new **page/route** → a thin `app/**/page.tsx` that imports a feature component.

---

## Conventions (the rules that keep this maintainable)

1. **Feature-first.** Group by product area, not by file type. Adding a card type
   to Learn should touch `features/learn/*` and (almost) nothing else. Don't
   scatter a feature across `components/`, `lib/`, `data/` again — that's the
   smell this layout fixed (ADR-0002).

2. **Thin routes.** `app/**/page.tsx` is a shell: import one feature component,
   set `metadata`. No business logic in route files. Keeps routing declarative
   and the component reorg safe.

3. **Route-handler adapter pattern.** Put the handler's real logic in
   `features/<f>/server/<name>.ts` (exports `GET`/`POST`). The file at the route
   path (`app/api/<f>/route.ts`) is a 3-line adapter:
   ```ts
   export { GET } from "@/features/<f>/server/<name>";
   export const runtime = "nodejs";
   export const dynamic = "force-dynamic";
   ```
   **Route segment config (`runtime`, `dynamic`) MUST be declared inline in the
   route file — Next cannot statically read it through a re-export.** Re-export
   only `GET`/`POST` from the feature module.

4. **Client/server boundary discipline.**
   - A **server route cannot import a value from a `"use client"` module** — the
     import becomes a client reference and breaks. Shared logic both sides need
     (e.g. `mock-session.ts`) lives in a **non-`"use client"`** module.
   - Mark `"use client"` only at the real boundary: the component/hook that uses
     state, effects, or browser APIs. Pure presentational leaves don't need the
     directive — they join the client bundle automatically when a client parent
     imports them. Keep the boundary as low in the tree as practical.
   - Types are erased, so a client-safe `types.ts` can be imported from anywhere
     (UI, fixtures, server, zod). Keep shared shapes there — one source of truth.

5. **Data modules hold data, not logic.** `features/*/data/*.ts` = typed,
   header-commented data + light derived constants (e.g. `ALL_APP_TAGS`).
   Presentation/formatting belongs in `lib/` or a component (date formatting →
   `lib/format.ts`). Don't put functions like a date formatter in a data file.

6. **Decompose growing components.** When a component accretes state +
   persistence + domain logic + many sub-views (LearnFeed hit 927 lines), split:
   - a thin **orchestrator** that wires state to layout,
   - **hooks** for stateful logic (`useLearnSession` = deck lifecycle/persistence;
     `useLearnPrefs` = user prefs),
   - **leaf components** for each view (`cards/*`, `CardStage`, `CompleteScreen`…),
   - **pure modules** for domain logic + storage (`levels.ts`, `client/storage.ts`).
   Extract leaves first, build between steps, keep the DOM byte-identical.

7. **Share fragile/duplicated UI as a primitive.** When the same markup or magic
   numbers appear 3+ times, extract to `components/ui/`:
   - `Sheet` — bottom-sheet (mobile) / centered dialog (desktop); `z-[60]` above
     the tab bar. Used by Learn `SetupSheet` + Travel `CountryInfo`.
   - `FullBleedStage` — the immersive canvas/globe stage sizing (the header/
     tab-bar offset calc). One source instead of six copies.
   Share **data**, keep behavior local: `PRIMARY_NAV` (`lib/nav.ts`) is the one
   nav list for desktop + mobile, but each keeps its own active-state rule.

8. **Defensive server boundary + graceful degradation (Learn) — preserve this.**
   - `getSession` (client) falls back to the mock deck on any fetch error and
     flags `degraded`; the server (`generate.ts`) serves the mock deck on no-key,
     rate-limit trip, daily-cap trip, bad JSON, zod failure, or empty result.
     **The feed is never blank.** Keep both layers when editing.
   - Server trust boundary: zod discriminated-union validation, `correctIndex`
     bounds check, news-source URL must match a fetched headline (drop
     hallucinated news). Don't trust model output into the UI unvalidated.

9. **Env + rate-limit handling.** Secrets (`ANTHROPIC_API_KEY`,
   `LEARN_STATS_TOKEN`, Upstash creds) live in **Vercel env only — never in the
   browser.** Read them via `rate-limit.ts`'s `readEnv` (a **computed-key**
   lookup that defeats Turbopack's build-time inlining of "sensitive" vars). The
   rate limiter is Redis-or-in-memory and **fails open**. Preserve the comments
   explaining *why* — they're load-bearing.

10. **Theme is no-FOUC + SSR-safe.** `theme.ts` `NO_FOUC_SCRIPT` sets `data-*`
    before paint; `ThemeProvider` mirrors those attributes into React state.
    Three themes (light/dark/sunset) + reduce-motion. Don't introduce a
    paint-flash by reading theme in an effect.

---

## Invariants (do not break without an ADR)

- **Backwards-compatible refactors keep routes, DOM, and behavior identical.**
  Verify with `pnpm build` + a Playwright smoke (all routes 200 + render, the
  Learn full flow, zero console errors) before pushing.
- **`localStorage` keys are a public contract** with real users' saved state.
  Exact strings: `learn-seen`, `learn-topics`, `learn-sets`, `learn-history`,
  `learn-current`, `learn-card-types`. Never rename without a migration.
- **No API key (or any secret) in the client bundle.** Generation is server-side.
- **No accounts / no database.** All user state is `localStorage` (per GOAL).
- **Green-gate:** never push unless `pnpm build` exits 0.
- **Don't touch the profile `README.md`** as part of site work.
- **Standing git policy:** push committed, build-green work directly to `main`
  (one push per work stream — Vercel deploys cost). See `AGENTS.md`.

---

## ADR log (decisions + rationale, newest first)

Append a short entry whenever a decision changes the structure or a convention.
Format: ID · date · decision · why · consequences. Don't rewrite old entries.

### ADR-0006 · 2026-06-30 · Shared UI primitives + dedup
`FullBleedStage` (stage sizing, 6 copies → 1), `PRIMARY_NAV` in `lib/nav.ts`
(one nav list for desktop + mobile), and date formatting consolidated into
`lib/format.ts` (dropped the duplicate `formatAppDate`). **Why:** kill fragile
duplication so a header-height or nav change is a one-line edit.
**Consequence:** new full-bleed apps wrap in `FullBleedStage`; data files hold no
formatting.

### ADR-0005 · 2026-06-30 · Decompose LearnFeed into orchestrator + hooks + leaves
927-line monolith → ~180-line `LearnFeed` orchestrator + `useLearnSession`/
`useLearnPrefs` hooks + `levels.ts` + `client/storage.ts` + leaf components
(`CardStage`, `CompleteScreen`, `HistoryFeed`, `SetupSheet`, `cards/*`).
**Why:** Learn is the most-developed feature; the monolith was a merge magnet and
untestable. **Consequence:** this is the template for decomposing any feature
component that grows past readability.

### ADR-0004 · 2026-06-30 · Single shared mock-deck builder
`features/learn/mock-session.ts` (non-`"use client"`) is imported by both the
client fallback (`learn-client.ts`) and the server route (`generate.ts`).
**Why:** the mock deck was copy-pasted in two places and could silently drift —
and it's exactly the offline/degraded path you can't easily observe.

### ADR-0003 · 2026-06-30 · API logic in features/<f>/server; thin route adapters
Handlers moved to `features/learn/server/{generate,stats}.ts`; `app/api/learn/*`
re-export `GET` and declare `runtime`/`dynamic` inline. **Why:** keep logic in
the feature; Next can't read segment config through a re-export, so it stays in
the route file. **Consequence:** the adapter pattern in Convention #3.

### ADR-0002 · 2026-06-30 · Feature-first `src/features/` layout
Reorganized by product area: each feature owns its components/hooks/client/
server/data/types; shared chrome → `components/{chrome,theme,ui}`; cross-feature
utils → `lib/`. **Why:** maintainability + extensibility — Learn was smeared
across 4 directories with a `learn-` filename prefix doing a folder's job.
**Alternatives considered:** keep flat / group `learn-*` within `lib/` (rejected:
doesn't scale, weaker boundary). **Chosen by Monte.** Done via `git mv` +
import rewrites, build-gated, behavior-identical.

### ADR-0001 · 2026-06-28 · Drop static export → standard Next on Vercel
Removed `output: "export"` (kept `trailingSlash: true`). **Why:** Learn needs
live, on-demand generation behind a server-held API key — impossible under a pure
static export. **Consequence:** route handlers run as serverless functions; there
is no `out/` dir; the creator/labs routines verify by serving `next start`, not
`out/`. This is the single biggest mental-model shift — see the Stack note.

### Pre-existing load-bearing decisions (captured retroactively)
- **Learn is the landing (`/`); no Home tab** (bio → `/about`). Per GOAL.
- **All user state in `localStorage`; no DB/accounts.** Per GOAL.
- **No-FOUC theme** + reduce-motion across 3 themes.
- **`@/*` path alias** everywhere (enables cheap moves).
- **Thin route pages** + typed, header-commented `data/` modules.

---

## Known tech debt / deferred (architect's backlog)

Low-priority items from the 2026-06-30 audit, deliberately deferred. Pick up when
you're already in the area; don't gold-plate.

- **Globe camera duplication** (med): `lib/globe-utils.ts` already holds the
  shared geometry (`latLngToVec3`, `buildBorderPositions`, `buildCountryFill`),
  but `travel/Globe.tsx` and `apps/JourneyGlobe.tsx` still each re-implement
  `CAMERA_PROPS` + `FitCamera` (margin 1.1 vs 1.25). Lift those into
  `lib/globe-utils.ts` behind a `margin` prop. WebGL → verify framing/orientation
  unchanged before/after.
- **Learn animations in `globals.css`** (low): six `@keyframes learn-*` live in
  the global sheet, away from their only consumer. Fine for now; colocate if a
  per-feature CSS strategy is adopted. Keep class names identical.
- **`/labs` legacy redirects** (low): client-side `Redirect` stubs. Since the
  site is no longer static-export, these *could* become server `redirect()` /
  `next.config` `redirects()` and `Redirect.tsx` deleted. Keep old links working;
  defer unless touching the area.

Full point-in-time analysis: `agent/evals/architecture-audit.md` (2026-06-30).

---

## When to consult the architect

Tap the `architect` agent (ask: "get the architect to review/decide X") for:
- **Reviews:** "does this change fit the architecture?" — before merging a
  feature, a refactor, or anything cross-cutting.
- **Decisions:** where a new feature/module/dir should live; whether to add a
  dependency; how to split a growing component; a data-model or routing change.
- **Memory:** "why is it this way?" — the architect reads this file (especially
  the ADR log) and answers, then keeps it current.

The architect gives guidance, reviews, and maintains this doc + the architecture
sections of `AGENTS.md`. It does **not** write feature code — it hands a concrete
plan back to the builder (the main session or the build-sprint harness).
