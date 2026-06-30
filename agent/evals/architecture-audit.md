# Architecture & Maintainability Audit — montethakkar.com

Date: 2026-06-30 (UTC)
Scope: `src/app`, `src/components`, `src/lib`, `src/data`, root config.
Constraint: **Backwards-compatible only.** No behavior, route, DOM, or UI change.
Every fix below is a mechanical move + re-export shim, an extraction, a rename
with a forwarding alias, or a dead-code deletion of an unreferenced path. No
code was changed; this is analysis only.

Stack confirmed from config: Next.js 16 App Router, React 19, Tailwind v4,
`@/*` -> `./src/*` path alias, **NOT** static export (`next.config.ts` has only
`trailingSlash: true`; route handlers run as serverless functions).

---

## TL;DR — prioritized

| # | Finding | Area | Priority | Fix risk |
|---|---------|------|----------|----------|
| 1 | `LearnFeed.tsx` is a 927-line monolith (UI + persistence + level logic + 9 sub-components) | Learn | **High** | Low–Med |
| 2 | No feature-folder boundary; Learn logic split across 7 files in 4 dirs with no `features/learn` home | Org | **High** | Low |
| 3 | `mockSession` duplicated verbatim in `learn-client.ts` and `api/learn/route.ts` | Duplication / boundary | **High** | Low |
| 4 | Flat `src/components/` mixes shared chrome + Travel cluster + a lone Posts file; inconsistent with `learn/` & `apps/` subfolders | Org | **High** | Low |
| 5 | `localStorage` keys, persistence helpers, and the persisted-shape type live inline in the view | Learn / boundary | **High** | Low |
| 6 | Globe duplication: `Globe.tsx` (Travel) and `JourneyGlobe.tsx` (Apps) re-implement `CAMERA_PROPS` + `FitCamera` | Duplication | **Med** | Low–Med |
| 7 | `formatDate` (`lib/format.ts`) and `formatAppDate` (`data/apps.ts`) are the same algorithm twice | Duplication | **Med** | Low |
| 8 | Full-bleed stage wrapper className duplicated across 4 app pages + Travel | Duplication | **Med** | Low |
| 9 | Stale comments assert "static export" / `output: export` that no longer exists | Correctness of docs | **Med** | Trivial |
| 10 | `data/apps.ts` carries a `formatAppDate` *function* — data file mixing logic | Placement | **Med** | Low |
| 11 | Learn CSS animations live in global `globals.css`, decoupled from the only consumer | Colocation | **Low** | Low |
| 12 | `/labs` legacy redirect routes — candidate for eventual removal, keep for now | Dead/legacy | **Low** | Low |
| 13 | Nav link lists (`DesktopNav`, `MobileTabBar`) duplicate the same 5 routes | Duplication | **Low** | Low |
| 14 | `lib/` flat-bucket will not scale; no `lib/learn/` grouping | Org | **Low** | Low |

---

## What is already GOOD — preserve these

These are deliberate, load-bearing decisions. Do not "tidy" them away.

- **`@/*` path alias** (`tsconfig.json`). Every import uses it; keeps moves cheap
  because consumers reference module names, not relative depth. Any reorg below
  is feasible *because* of this.
- **Graceful degrade chain for Learn.** `getSession` (client) falls back to
  `mockSession` on any fetch error and flags `degraded`; `api/learn/route.ts`
  serves the mock deck on no-key, rate-limit trip, daily-cap trip, bad JSON, Zod
  failure, or empty result. The feed is never blank. This is excellent defensive
  design — keep the layering intact when extracting.
- **`rate-limit.ts` design.** `readEnv` via computed key (defeats Turbopack
  build-time inlining of "Sensitive" env vars), Redis-or-in-memory dual path that
  fails *open*, opportunistic map cleanup, no extra dependency (plain fetch to
  Upstash REST). The comments explaining *why* are valuable — preserve them.
- **Zod validation + hallucination guards** in `api/learn/route.ts`: discriminated
  union, `correctIndex` bounds check, news-source URL must match a fetched
  headline. This is the right server-trust boundary.
- **Just-extracted shared `Sheet.tsx`.** Already consumed by both `CountryInfo`
  (Travel) and `SetupModal` (Learn) — proof the shared-component pattern works.
  Use it as the template for further extraction.
- **`data/` separation.** `apps.ts`, `travel.ts`, `journey.ts`, `buildlog.ts`,
  `boarding-pass.ts`, `learn-fixtures.ts` are clean, well-commented, typed data
  modules. Each has a header comment naming its consumer. Keep this discipline.
- **`learn-types.ts` is client-safe and shared** by UI, fixtures, and the API +
  its Zod schema. Single source of truth for the card shapes — exactly right.
- **`format.ts` is explicitly client-safe** (no `fs`) so server and client can
  both import it; `posts.ts` re-exports it. Good boundary awareness.
- **Thin route pages.** Almost every `src/app/**/page.tsx` is a tiny shell that
  imports one component and sets `metadata`. Routes stay declarative; logic lives
  in components. Keep this — it makes the component reorg safe.
- **`LIVE` seam + `?mock=1`** in `learn-client.ts`: a real source-swap seam and a
  manual mock override for evaluation. Keep.
- **No-FOUC theme script** (`theme.ts` `NO_FOUC_SCRIPT`) + `ThemeProvider`
  mirroring `data-*` attributes into React state. Correct SSR-safe theme handling.

---

## High priority

### 1. `LearnFeed.tsx` is a 927-line monolith

**File:** `src/components/learn/LearnFeed.tsx`

**Problem.** One file holds: the top-level state machine (`phase`/`view`,
~14 `useState`/`useRef`), all localStorage persistence (6 keys, `readJSON`/
`writeJSON`, the restore + persist effects), the level/XP system (`LEVELS`,
`levelFor`), session loading (`load`), and **nine** presentational sub-components
(`SetupModal`, `CardChrome`, `HistoryFeed`, `QuizReview`, `Complete`, `Burst`,
`CardBody`, `NonQuizContent`, `Quote`, `QuizView`). These are cohesive *units*
glued into a single module.

**Why it hurts as it grows.** Learn is the most actively developed feature. Every
new card type, every persistence tweak, every animation touches this one file ->
merge-conflict magnet, hard to test any unit in isolation, and a reader must hold
the whole thing in their head to change the quiz view. Adding a 6th card type
today means editing the union (types), the API schema, the fixtures, AND hunting
through ~150 lines of `NonQuizContent`/`CardBody` in the monolith.

**Backwards-compatible fix.** Split by cohesion into a `learn/` subtree. All are
pure mechanical extractions — the default export stays `LearnFeed` so `app/page.tsx`
is untouched.

- `learn/components/SetupModal.tsx` — the new-set sheet (already uses shared `Sheet`).
- `learn/components/cards/` — `CardChrome.tsx`, `Quote.tsx`, `QuizView.tsx`,
  `QuizReview.tsx`, `NonQuizContent.tsx`, `CardBody.tsx`. These are the pieces
  that grow per card type; isolating them means a new type is a new file + a
  switch arm, not surgery on the monolith.
- `learn/components/Complete.tsx` + `Burst.tsx` — completion celebration.
- `learn/components/HistoryFeed.tsx` — read-only history list.
- `learn/levels.ts` — `LEVELS` + `levelFor` (pure, trivially unit-testable).
- `learn/storage.ts` — the keys, `readJSON`/`writeJSON`, `dedupeById`, `fmtSeen`,
  and a typed `CurrentSet` shape + `loadCurrent`/`saveCurrent`/`loadHistory`/
  `saveHistory`/`loadPrefs`/`savePrefs` accessors (see #5).
- `learn/LearnFeed.tsx` — keeps only the state machine + layout, importing the above.

Do it in small commits (extract one leaf component, build, repeat). Risk is
**low–med**: pure moves, no prop changes; the only care needed is keeping the
shared `Burst`/`Quote` imports wired. Verify the page renders identically (same
DOM, same classNames) after each step.

### 2. No feature-folder boundary — Learn is smeared across 4 directories

**Files:** `components/learn/LearnFeed.tsx`, `lib/learn-client.ts`,
`lib/learn-types.ts`, `lib/rate-limit.ts`, `data/learn-fixtures.ts`,
`app/api/learn/route.ts`, `app/api/learn/stats/route.ts`.

**Problem.** To understand or change Learn you must visit `components/`, `lib/`
(3 files), `data/`, and `app/api/learn/` (2 files). Nothing names "this is the
Learn feature"; the cohesion is implicit in the `learn-` filename prefix.

**Why it hurts.** As Learn keeps growing (the stated assumption) the cognitive
cost of "where does this live?" compounds. New contributors (human or agent)
can't grep one folder. The `learn-` prefix convention is a smell that the files
*want* to be a folder.

**Backwards-compatible fix.** Two viable shapes; pick one and apply consistently:

- *Minimum, lowest-risk:* group within existing buckets — move the three
  `lib/learn-*.ts` into `lib/learn/` (`client.ts`, `types.ts`) and keep
  `rate-limit.ts` near the route or in `lib/learn/`. Leave **re-export shims** at
  the old `lib/learn-client.ts` / `lib/learn-types.ts` paths
  (`export * from "./learn/client"`) so no import breaks; delete shims later.
- *Stronger, recommended for the most-developed feature:* a `src/features/learn/`
  module (`ui/`, `client.ts`, `types.ts`, `levels.ts`, `storage.ts`, `fixtures.ts`).
  Route files (`app/page.tsx`, `app/api/learn/*`) stay thin and import from it.
  `rate-limit.ts` is arguably cross-cutting (any future paid endpoint reuses it),
  so it can stay in `lib/` — but document that choice.

Either way the API route stays at `app/api/learn/route.ts` (Next routing is
path-bound) but imports its helpers from the feature module. Risk **low** with
re-export shims; the alias makes the moves trivial.

### 3. `mockSession` duplicated verbatim in two files

**Files:** `lib/learn-client.ts` (lines 49–64) and `app/api/learn/route.ts`
(lines 109–127).

**Problem.** The same fixtures-filter + dedupe-against-seen + shuffle + slice
logic exists twice (the client version also exports a reusable `shuffle`; the
server inlines the Fisher–Yates). They can — and will — drift: change the
"never empty the deck" fallback rule in one place and the client/server mock
decks diverge.

**Why it hurts.** Both are the graceful-fallback path that must behave identically
for the UX to be coherent (offline-sample on the client mirrors degraded-sample
from the server). Divergence is a silent correctness bug in exactly the path you
can't easily observe.

**Backwards-compatible fix.** Extract one pure `buildMockSession(n, seen, types)`
into a *client-safe* module both can import (e.g. `lib/learn/mock.ts` or inside
the feature module from #2). It depends only on `learn-fixtures` + `learn-types`
+ `Math.random` — no `fs`, no Node — so the server route can import the same
function. Keep `learn-client.ts`'s `getSession`/`SessionOpts` as the public
client surface; have it call the shared builder. Risk **low**: identical output,
single definition.

### 4. Flat `components/` mixes three concerns

**Files:** `components/` root holds shared chrome (`ThemeProvider`, `Sheet`,
`SiteMenu`, `DesktopNav`, `MobileTabBar`, `HeaderBrand`, `SettingsPanel`,
`Redirect`) **plus** a Travel cluster (`TravelGlobe`, `Globe`, `CountryInfo`,
`globe-utils.ts`) **plus** one orphan Posts file (`PostsList.tsx`) — while
`learn/` and `apps/` already have their own subfolders.

**Problem.** Inconsistent: two features are foldered, two (Travel, Posts) are
loose in the shared bucket. A reader can't tell shared-chrome from
feature-component by location. Travel's four files have no home.

**Why it hurts.** The flat root grows without structure; "is this shared or
Travel-specific?" requires opening the file. Adding a second Posts component or a
new globe view has no obvious destination. The asymmetry signals the conventions
were never finished.

**Backwards-compatible fix.** Establish the convention already half-present:

- `components/travel/` <- `TravelGlobe.tsx`, `Globe.tsx`, `CountryInfo.tsx`,
  `globe-utils.ts` (note `globe-utils` is *also* imported by `apps/JourneyGlobe`
  — see #6; promote it to a shared `lib/globe.ts` instead of burying it under
  Travel).
- `components/posts/` <- `PostsList.tsx`.
- Keep shared chrome at `components/` root (or formalize as `components/chrome/`
  / `components/ui/`). `Sheet.tsx` is genuinely shared (Travel + Learn) — keep it
  shared, e.g. `components/ui/Sheet.tsx`.

All consumers import via `@/components/...`; update those import paths (mechanical)
or leave thin re-export shims at the old paths. Risk **low**.

### 5. localStorage keys, helpers, and the persisted shape live inside the view

**File:** `LearnFeed.tsx` lines 18–88, 118–137, 195–235.

**Problem.** Six string keys (`SEEN_KEY`, `TOPICS_KEY`, `SETS_KEY`,
`HISTORY_KEY`, `CURRENT_KEY`, `CARD_TYPES_KEY`), the `readJSON`/`writeJSON`
guards, the seen-ring-buffer cap (60), the history cap (80), and the *shape* of
the persisted "current set" (an inline anonymous type in the restore effect) all
live in the component. Persistence is interleaved with rendering in effects.

**Why it hurts.** No single place owns the storage schema. A migration (e.g.
versioning the keys, or changing the seen-buffer size) means editing scattered
effect bodies. The persisted-set type is duplicated implicitly between the
`writeJSON(CURRENT_KEY, {...})` call and the `readJSON<{...}>(CURRENT_KEY)` call —
they can drift. Testing persistence requires mounting the whole feed.

**Backwards-compatible fix.** Extract `learn/storage.ts` (see #1): export the key
constants, `readJSON`/`writeJSON`, a `PersistedSet` type used by both read and
write, and small typed accessors. The component calls `loadCurrent()` /
`saveCurrent(state)` instead of inlining JSON shapes. **Keep the exact same key
strings and value shapes** so existing users' localStorage keeps working — this
is the one place a careless rename would break real persisted state. Risk **low**
*if* the literals are preserved byte-for-byte.

---

## Medium priority

### 6. Globe duplication between Travel and Apps/Journey

**Files:** `components/Globe.tsx` (Travel) and `components/apps/JourneyGlobe.tsx`.

**Problem.** Both define an identical `GLOBE_RADIUS = 1`, the same stable
`CAMERA_PROPS` (`position [0,0,2.6]`, `fov 45`), and a near-identical `FitCamera`
that frames the globe by adjusting only distance (Travel uses `margin 1.1`,
Journey `1.25`). Both import `globe-utils` (`latLngToVec3`, `buildBorderPositions`)
and `GLOBE_COLORS`. The shared 3D-globe scaffolding is copy-pasted.

**Why it hurts.** Any fix to camera framing, aspect handling, or the projection
math must be made twice and kept in sync. A third globe (plausible, given Travel
+ Journey already exist) triples the cost.

**Backwards-compatible fix.** Two parts:
- Promote `globe-utils.ts` out of `components/` to `lib/globe.ts` (it's pure
  math/geometry, already imported across feature folders) — leave a re-export
  shim at `components/globe-utils.ts`.
- Extract the shared `FitCamera` + `CAMERA_PROPS` + `GLOBE_RADIUS` into a small
  shared module (e.g. `lib/globe.ts` or `components/globe/shared.tsx`), keeping a
  `margin` prop so each globe passes its own value (1.1 vs 1.25) — preserving
  current framing exactly. The two scene components keep their distinct behavior
  (auto-rotate + picking vs scroll-driven orientation).

Risk **low–med**: `FitCamera` is small and self-contained, but it's WebGL so
verify both globes still frame and orient identically (the evaluator's
before/after screenshot pass covers this).

### 7. `formatDate` and `formatAppDate` are the same algorithm twice

**Files:** `lib/format.ts` (`formatDate`) and `data/apps.ts` (`formatAppDate`,
lines 95–112).

**Problem.** Both define a `MONTHS` array and the identical "ISO datetime ->
`Mon D, YYYY · h:mm AM`" formatter (same TZ-naive, time-optional logic).
`formatAppDate` is a near-exact copy of `formatDate`.

**Why it hurts.** Two date formatters that *look* the same invite "fix it once,
forget the other" bugs (e.g. a locale or AM/PM tweak). It also muddies which is
canonical.

**Backwards-compatible fix.** `AppsList` should import `formatDate` from
`lib/format.ts` (verify output is byte-identical for the app `date` strings —
they're the same `yyyy-mm-ddThh:mm` format `formatDate` already handles). Delete
`formatAppDate` (or make it a one-line re-export for safety:
`export const formatAppDate = formatDate`). This also fixes #10. Risk **low** —
confirm a couple of app dates render the same string before/after.

### 8. Full-bleed stage wrapper duplicated across pages

**Files:** `app/apps/field/page.tsx`, `rope-type/page.tsx`,
`ascii-engine/page.tsx`, `shatter-type/page.tsx`, `weather-pixels/page.tsx`, and
`components/TravelGlobe.tsx` — all repeat the exact wrapper:
`relative -mx-5 -mt-10 -mb-28 h-[calc(100svh-8.5rem)] sm:-mb-12 sm:h-[calc(100svh-4.5rem)]`
with an `absolute inset-0` child.

**Problem.** The magic offsets (`-mx-5 -mt-10 -mb-28`, `8.5rem`/`4.5rem`) encode
the layout's header/tab-bar heights. They're copy-pasted 6×. If the header height
changes, all six must change together or full-bleed apps clip.

**Why it hurts.** Every new WebGL/canvas app adds another copy. The offsets are
implicitly coupled to `layout.tsx`'s `h-16` header and `pb-28` — a change there
silently breaks the stages.

**Backwards-compatible fix.** Extract a `FullBleedStage` wrapper component (e.g.
`components/ui/FullBleedStage.tsx`) that renders the wrapper div + `absolute
inset-0` slot. Each app page becomes `<FullBleedStage><Field /></FullBleedStage>`.
Identical DOM/classes -> identical rendering. Risk **low**.

### 9. Stale "static export" comments contradict the actual config

**Files:**
- `lib/nav.ts` line 17: "Static export uses trailing-slash paths" — it's
  `trailingSlash: true`, not static export.
- `components/Redirect.tsx` lines 5–6: "for the static export (no server
  redirects under `output: export`)" and `app/labs/*` comments lean on this.
- `AGENTS.md` and `README` still say "Next.js static export" in places.

**Problem.** The config is explicitly *not* static export (`next.config.ts`
comment even says so). These comments will mislead the next person into thinking
server redirects/route handlers are unavailable — which would block the obvious
*real* fix for `/labs` (see #12).

**Why it hurts.** Wrong mental model -> wrong decisions. Someone may avoid a
server-side redirect or middleware because a comment told them they can't.

**Backwards-compatible fix.** Comment-only edits: correct the three stale notes
to say "App Router on Vercel with `trailingSlash: true` (route handlers run as
serverless functions)." Trivial risk. (Strictly a doc fix; included because it
materially affects future maintainability decisions.)

### 10. `data/apps.ts` mixes data with formatting logic

**File:** `data/apps.ts` lines 95–112 (`MONTHS`, `formatAppDate`).

**Problem.** The `data/` convention is "typed, documented data + light derived
constants" (e.g. `ALL_APP_TAGS`). `formatAppDate` is presentation logic that
doesn't belong in a data module.

**Backwards-compatible fix.** Subsumed by #7 — move formatting to `lib/format.ts`,
leaving `apps.ts` as pure data + the `ALL_APP_TAGS` derivation. Risk **low**.

---

## Low priority

### 11. Learn animations live in global CSS, far from their consumer

**File:** `app/globals.css` lines 158–191 — six `@keyframes learn-*` +
`.learn-*` classes used *only* by `LearnFeed.tsx`.

**Problem.** Feature-specific animations sit in the global stylesheet, decoupled
from the component that owns them. A reader changing the burst/pop animation must
know to look in `globals.css`. As more features add bespoke animations, the
global file becomes a junk drawer.

**Why it hurts (mildly).** Lower than the rest because Tailwind v4 + a global
sheet is a reasonable place for keyframes, and there's no duplication. But the
locality cost grows with each feature's animations.

**Backwards-compatible fix.** Optional. Either (a) leave them but add a `/* Learn
feature */` section header and keep all `learn-*` rules contiguous, or (b) if you
adopt CSS Modules / a per-feature CSS entry, colocate as `learn/learn.css`
imported by the feed. Keep class names identical. Risk **low**; mostly a
judgment call — fine to defer.

### 12. `/labs` legacy redirect routes

**Files:** `app/labs/page.tsx`, `app/labs/[slug]/page.tsx`, and the
`Redirect.tsx` client component they use.

**Problem.** `/labs` was renamed to `/apps`; these are client-side redirect stubs
kept for old inbound links. They're correct and small, but they're dead weight
that will linger indefinitely, and `Redirect.tsx` carries a stale "static export"
rationale (#9) — under the *actual* config a server redirect is cleaner.

**Why it hurts (low).** Minor surface area + a misleading comment. Not urgent.

**Backwards-compatible fix.** Keep the routes (don't break old links). Two
options, both preserving the redirect behavior:
- *No-change-now:* just fix the stale comment (#9).
- *Cleaner later:* because this is **not** a static export, replace the
  client-`Redirect` stubs with `redirect("/apps...")` in the route (server
  redirect) or a `next.config.ts` `redirects()` / middleware rule, then delete
  `Redirect.tsx` if nothing else uses it (it's only used by `/labs`). This is a
  behavior-equivalent improvement, but verify the redirect target + trailing
  slash match exactly. Defer unless you're already touching this area. Risk
  **low**.

### 13. Nav link lists duplicated

**Files:** `components/DesktopNav.tsx` (`LINKS`) and
`components/MobileTabBar.tsx` (`TABS`) — both hardcode the same 5 routes
(`/`, `/posts`, `/apps`, `/travel`, `/about`) with labels.

**Problem.** Adding/removing/reordering a primary nav item means editing two
arrays in lockstep (TabBar additionally carries icons). They can drift (desktop
shows a link mobile doesn't).

**Backwards-compatible fix.** Define the primary nav once (e.g. `lib/nav.ts`
already exists and is the natural home) as `PRIMARY_NAV = [{ href, label, Icon }]`
and have both components map over it. `lib/nav.ts` is already the route-metadata
module, so this is cohesive. Risk **low** — verify icons + active-state logic
(note the two use slightly different "active" rules: TabBar `startsWith(href)`
vs DesktopNav `href + "/"`; preserve each component's rule when sharing only the
list, not the active logic).

### 14. `lib/` will not scale as a flat bucket

**File:** `lib/` holds `format.ts`, `nav.ts`, `posts.ts`, `theme.ts`,
`learn-client.ts`, `learn-types.ts`, `rate-limit.ts`.

**Problem.** Mixed granularity: genuinely shared utils (`format`, `theme`, `nav`)
next to feature internals (`learn-*`) and a feature-ish cross-cutting concern
(`rate-limit`). As features add libs, the prefix-naming (`learn-*`) is doing the
job a folder should.

**Backwards-compatible fix.** Covered by #2 (group `learn-*` into `lib/learn/` or
the feature module). Keep truly shared utils flat in `lib/`. Risk **low** with
re-export shims.

---

## Suggested sequencing (lowest-risk first)

1. **#9** stale comments (trivial, unblocks correct thinking about #12).
2. **#7 / #10** dedupe date formatting (small, high clarity win).
3. **#3** extract shared `buildMockSession` (kills a real drift risk).
4. **#5** extract `learn/storage.ts` (preserve key literals exactly).
5. **#1** split `LearnFeed` sub-components (one leaf at a time, build between).
6. **#2 / #14** introduce the Learn feature folder / `lib/learn/` with shims.
7. **#4** folder the Travel + Posts components; promote `Sheet` to `ui/`.
8. **#8** `FullBleedStage`; **#6** shared globe scaffolding; **#13** shared nav list.
9. **#11 / #12** optional polish, defer freely.

Each step is independently shippable and verifiable by confirming the rendered
DOM + classNames are unchanged. The `@/*` alias + re-export shims make every move
non-breaking for importers.
