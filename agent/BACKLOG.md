# BACKLOG — "Learn": a 2–3 minute variable-reward learning feed

Ordered sprints toward `agent/GOAL.md`, building on `agent/SPEC.md`. Each sprint
is buildable AND evaluable in a single run, keeps `pnpm build` green and the site
deployable on Vercel, never touches `README.md`, and every acceptance criterion
is verifiable by interacting with the running site (Playwright-checkable).

Acceptance criteria below are **DRAFT** — finalized at sprint start via
builder/evaluator alignment (per `agent/RUBRIC.md`) and recorded as "aligned" in
this file and in `agent/evals/<ts>-sprint-N-criteria.md` before feature code is
written. The evaluator may strengthen, add, or cut to the ~6 cap, but every
criterion stays interaction-verifiable.

Status legend: `todo` / `in progress` / `done` / `blocked`. Never delete
done/blocked history; mark it.

**Note on the build gate:** RUBRIC hard-gate #1 currently reads "static export
must succeed". From Sprint 1 onward the site is a standard Next.js app on Vercel,
NOT a static export — the green-gate is `pnpm build` exits 0 (which also produces
the serverless build). The evaluator should read hard-gate #1 as "`pnpm build`
exits 0" for this backlog; there is no `out/` after Sprint 1.

**Ordering rationale:** the value chain is gated by one foundational, risky
change, so it goes first: (1) drop `output: "export"` so a route handler can run
as a Vercel serverless function, and in the same sprint fix the Creator routine's
verify/ship stages (which serve `out/`) to serve `next start` instead — proving
the whole site still builds, deploys, and renders before any feature lands. Then
(2) the pure-UI nav + root change (Learn → `/`, Home tab removed, bio → `/about`),
which is independent of any LLM and evaluable immediately. Then (3) the entire
Learn feed UX driven by committed MOCK fixtures, so the full session loop —
stack, reveal+why, instant quiz grading, session-complete, streak, new-set,
pull-to-refresh, dynamic title — is shippable and evaluable with NO function and
NO key. Then (4) the live serverless `GET /api/learn` wired behind the exact same
data contract, so the UI is unchanged but content is now live + fresh, degrading
to mock on error. Then (5) News cards and (6) the fast-follow content types +
personalization/discover that widen the variable reward. Each sprint keeps the
site shippable and is verified by interacting with the running site. Six sprints.

---

## Sprint 1 — Drop static export → serverless-ready app; fix the Creator routine [done]
_Done 2026-06-28: removed `output:"export"`; `/api/health` returns 200 JSON under `next start`; automated regression swept all pages + 8 apps + the globe at 1280/390 — zero console errors, no overflow, every WebGL/canvas piece mounts (built-by-agents is SVG/DOM by design). Creator routine verify/ship now serve via `next start`, not `out/`._

**GOAL:** Switch the site off pure static export so server route handlers can run
as Vercel serverless functions, WITHOUT regressing any existing page, and update
the `creator` workflow's verify/ship stages so they no longer depend on `out/`
(serve the built app via `next start` for screenshots) — keeping `pnpm build`
green and the routine functional. No Learn feature code this sprint; this is the
foundation everything else stands on.

**DRAFT acceptance criteria**

1. `next.config.ts` no longer sets `output: "export"`; `pnpm build` exits 0 and
   produces a standard Next build (a server/serverless target, not an `out/`
   static export) — verifiable from build output and the absence of `out/`.
2. A trivial **smoke route handler exists and responds at runtime**: with the app
   served by `next start`, `GET /api/health` (or equivalent) returns a 200 JSON
   body — proving route handlers run server-side now (the capability the whole
   GOAL depends on). The endpoint takes no secrets and is safe to keep.
3. **No regressions across the existing site:** the homepage, `/posts` (+ one
   post detail), `/apps` (+ one WebGL app detail e.g. `/apps/field`), `/travel`,
   `/about`, and `/settings` all render correctly with **zero console/page
   errors** at 1280px and 390px when served by `next start` — verified by
   screenshots of each.
4. The **WebGL/Canvas apps and the globe still mount and animate** under the
   non-export build (e.g. `/apps/field` and `/travel` show their live frame, not
   a stuck "Loading…") — confirmed by screenshots ~1s apart differing in the
   canvas region with reduce-motion off.
5. The **Creator routine no longer references `out/`**: `.claude/workflows/creator.js`
   verify/ship stages serve the built app via `next start` (or equivalent local
   server of the real build) on a port and screenshot from there; the green-gate
   remains `pnpm build` exit 0. Demonstrated by a dry-run of the verify serving
   command producing a reachable URL + a screenshot of an existing `/apps` page.
6. **Gates:** no horizontal overflow at 390px on the homepage and one touched
   page; the sticky header + tab bar still work; `pnpm build` exits 0.

_Note: `output: "export"` + `trailingSlash: true` interact with internal links
and `routeInfo()`'s trailing-slash handling — verify nav/active-state still works
after the switch. Adding `zod`/`@anthropic-ai/sdk` is NOT part of this sprint
(the smoke route needs neither); keep the diff minimal and reversible._

---

## Sprint 2 — Nav + root change: Learn becomes `/`, Home tab removed, bio → `/about` [done]
_Done 2026-06-28: Learn is the first tab (mobile + desktop) and the site root `/`; Home tab removed; the bio already lives in full at `/about` (the old home recents were redundant with the Posts/Apps tabs and were dropped). HeaderBrand shows "Learn" at `/`._

**GOAL:** Make the site land on a Learn placeholder at `/`, remove the Home tab,
add Learn as the first tab (with a fitting lucide icon), and relocate the current
homepage hero/bio + recent posts/apps into `/about` so nothing is lost. Pure UI,
no LLM, no serverless — fully evaluable on its own. The Learn page this sprint may
be a minimal placeholder ("Learn — coming next") since the real feed lands in
Sprint 3; the value here is the IA change.

**DRAFT acceptance criteria**

1. **Tabs are `Learn · Posts · Apps · Travel · About`** with Learn first and a
   fitting Learn icon (e.g. spark/bolt/cap from lucide); there is **no Home tab**
   anywhere in `MobileTabBar` or `DesktopNav` — verified in screenshots at 390px
   (tab bar) and 1280px (desktop nav).
2. **`/` renders the Learn page** (placeholder is fine this sprint), the Learn tab
   shows active (`aria-current="page"`) when on `/`, and the desktop wordmark +
   mobile header title resolve correctly for `/` (the mobile header reads "Learn",
   the wordmark still links to `/`).
3. **The homepage bio is relocated to `/about`**: visiting `/about` shows the "Hi,
   I'm Monte" intro (or a sensibly folded version) AND the recent Posts/Apps
   sections that used to be on the homepage, with all their links working — the
   intro/content is NOT lost or orphaned.
4. **Navigation works end-to-end:** clicking each of the 5 tabs navigates to the
   right route and sets the active state; `routeInfo()`/`HeaderBrand` give the
   right title per route (no "Monte Thakkar" fallback where a real title exists),
   verified by clicking through all tabs at 390px.
5. **No regressions:** `/posts`, `/apps`, `/travel` still render at 1280px and
   390px with zero console errors; the SiteMenu hamburger still opens; themes
   (light/dark/sunset) still apply on `/` and `/about`.
6. **Gates:** no horizontal overflow at 390px on `/`, `/about`, and one other
   touched page; `pnpm build` exits 0.

_Note: SPEC §5 fixes the tab set to Learn · Posts · Apps · Travel · About;
`/labs` pages remain reachable but stay out of the primary nav (unchanged from
today). Update `MobileTabBar`, `DesktopNav`, `HeaderBrand`, and `src/lib/nav.ts`
(home→learn kind/title) together._

---

## Sprint 3 — The Learn feed: full session loop on MOCK data [done]
_Done 2026-06-28: 5-card session from a committed mock deck (quiz/trivia/news across Monte's topics) behind a `getSession` seam (`src/lib/learn-client.ts`, LIVE=false), shared `learn-types`. Card stack with progress dots, instant quiz grading + explanation, trivia/news reveal-the-why, gated Next, session-complete with score + 🔥 day-streak (localStorage), New-set, dynamic tab title, `?mock=1`, mobile-first + theme-aware. Verified under `next start`: zero console errors, no overflow._

**GOAL:** Build the complete Learn experience driven entirely by committed mock
fixtures and the shared `Card` types — the card stack, per-card answer/reveal +
"why", instant quiz grading, session-complete with score + streak (localStorage),
"New set" + pull-to-refresh, dynamic tab title, mobile-first and theme-aware.
**Fully shippable and evaluable with NO serverless function and NO API key.** The
data is sourced through a provider seam so Sprint 4 can swap in live data with
zero UI change. Quiz + Trivia card types render this sprint.

**DRAFT acceptance criteria**

1. **Session loop runs end-to-end on mock data:** loading `/` shows a stack of ~5
   cards one at a time; a **quiz card grades instantly and correctly** on tap
   (right vs wrong visibly distinguished) and every card reveals an **answer + a
   "why"/explanation** (no dead ends); advancing through all cards reaches a
   **"session complete"** screen showing this session's **score**. Verified by
   playing a full session at 390px.
2. **Streak + state persist in localStorage:** completing a session sets/advances
   a **day-streak** and it survives a page reload (visible on the
   session-complete or a header/title indicator); seen-card ids are recorded so
   refreshes avoid immediate repeats. Verified by completing a session, reloading,
   and observing the persisted streak.
3. **The loop closes via "New set" AND pull-to-refresh:** the primary "New set →"
   button starts a fresh session, and a pull-to-refresh gesture at the top of the
   feed (at 390px) also starts a fresh session; two consecutive sessions are
   **not identical** (different cards/order from the fixture pool, not a repeat of
   the same five). Verified by triggering both and comparing the served cards.
4. **Variable + educational feel:** a session visibly **mixes content types**
   (at least quiz + trivia) and topics — not a monotype run of five quizzes;
   fixtures span every v1 type and several topics. Verified by inspecting one
   session's card types/topics in the DOM.
5. **Dynamic tab title + theme-aware mobile-first feel:** `document.title`
   reflects an external trigger (e.g. `🔥 N-day streak · Learn` on load, "New set
   ready · Learn" after completing one) and restores a sane title when navigating
   away; the card stack reads and interacts well at 390px and is legible in
   light/dark/sunset. Verified by observing `document.title` transitions and
   theme screenshots.
6. **Gates:** the first card is interactive quickly (no long blank wait), a full
   5-card session is completable in ≤ ~3 minutes, no horizontal overflow at 390px,
   zero console/page errors on `/`, `pnpm build` exits 0.

_Note: introduce the client-safe `Card` union + `LearnSession` types module (no
server imports), the committed `learn` fixtures (~12–15 cards, every v1 type,
realistic + correct — they double as live-prompt examples), and a data-provider
seam that returns a session; mock mode is the only path this sprint. `?mock=1`
toggling is exercised more in Sprint 4 — here mock is the default/only source._

---

## Sprint 4 — Live serverless `GET /api/learn` behind the same contract [done]
_Done 2026-06-28: `src/app/api/learn/route.ts` (Node runtime) generates quiz+trivia via Claude Haiku, Zod-validates the discriminated union (drops/repairs bad cards, checks correctIndex bounds), returns a LearnSession. No `ANTHROPIC_API_KEY` → returns mock; any model error → returns mock (never blank). Client `LIVE=true` now hits `/api/learn`; UI unchanged. Verified under `next start` (no key → mock session JSON, feed renders, zero errors). **Action for Monte: add `ANTHROPIC_API_KEY` in Vercel env to switch on live generation.**_

**GOAL:** Add the Vercel serverless route handler that generates a fresh,
Zod-validated session on demand via the Anthropic API (key from server env),
wired behind the identical data contract so the Sprint-3 UI is unchanged but
content is now live and fresh on every refresh. Quiz + Trivia first. Graceful
degradation: on error/missing key the client falls back to mock with a small
"offline sample" note — never a blank screen. `?mock=1` forces the mock path.

**DRAFT acceptance criteria**

1. **Live generation works on demand:** with `ANTHROPIC_API_KEY` set and the app
   served by `next start`, `GET /api/learn` returns a 200 `LearnSession` of
   quiz+trivia cards; loading `/` (mock OFF) renders a live session, and "New
   set" / pull-to-refresh fetches a **different** live session (no within-session
   repeats; respects the `seen` param). Verified by two refreshes returning
   different cards.
2. **Validated + safe contract:** the response is Zod-validated against the Card
   union; a card that fails validation is **dropped/repaired rather than 500-ing
   the whole set** (verified by inspecting the endpoint's behavior on a forced bad
   card), and the endpoint exposes **no secret to the client** (network panel /
   page source contain no API key). Query params `n` (cap), `topics`, `seen` are
   honored.
3. **Graceful degradation, never blank:** with the key unavailable (or the
   endpoint forced to error), the client **falls back to mock cards** with a
   visible small "offline sample" note and a still-playable session — verified by
   simulating the failure and confirming a full session still runs with the note.
4. **`?mock=1` forces mock with zero network/key:** appending `?mock=1` (and/or
   `NEXT_PUBLIC_LEARN_MOCK=1`) renders a full session using fixtures with **no
   request to `/api/learn`** — verified by an empty/absent learn request in the
   network panel while a full session still plays.
5. **UI is unchanged by the data source:** the exact same Sprint-3 session loop
   (stack, instant quiz grade, reveal+why, session-complete, streak, new-set,
   dynamic title) works identically against live data — verified by playing a
   full live session and confirming the same interactions as Sprint 3.
6. **Gates:** first cards appear reasonably quickly (snappy loading state, no long
   blank wait); no horizontal overflow at 390px on `/`; zero console/page errors
   on `/` in both live and mock modes; `pnpm build` exits 0 with the route handler
   present.

_Note: adds `zod` and an Anthropic client as deps; route at `src/app/api/learn/route.ts`.
Use a small/fast model tier for quiz/trivia. Light per-IP rate limiting is
acceptable; no PII, no logging of content. The fixtures from Sprint 3 are the
prompt's worked examples. Confirm Vercel deploy with the env var as part of
alignment if the evaluator can reach a preview; otherwise verify locally via
`next start` + the key._

---

## Sprint 5 — News cards: fresh server-side sourcing + summary + "so what" [done]
_Done 2026-06-28: route fetches fresh real headlines from the public Hacker News API (no key), passes them to Claude to write summary + so-what as `news` cards (headline + source.url copied verbatim; hallucinated URLs dropped via a fetched-URL allowlist). News added to the Zod union + the mock fixtures; the NewsCard renderer (headline → summary → "So what?" reveal + source link) already shipped in Sprint 3. Best-effort: if HN fetch fails, the session is just quiz/trivia. Build green._

**GOAL:** Add the News card type — current, summarized headlines with a short
"so what" for Monte, sourced server-side and cited — into the live `/api/learn`
mix and the mock fixtures, so a session can surface timely news alongside quiz +
trivia. News deepens the variable reward (timeliness) and rounds out the v1
content set.

**DRAFT acceptance criteria**

1. **News cards render with the full shape:** a News card shows a **headline, a
   ≤2-sentence summary, and a "so what"/why**, plus a source name/link when
   present; the source link is clickable and points off-site. Verified in both
   mock (`?mock=1`) and live modes via the DOM/screenshot.
2. **News is current + server-sourced:** in live mode the route handler sources
   recent news server-side (e.g. a public feed/search) and the resulting cards
   reference **recent** events with a real, checkable source — verified by
   inspecting a live News card's content + source URL (not an obviously stale or
   fabricated source).
3. **News joins the mix:** a live session can include News alongside quiz +
   trivia (the mix is variable, not all-news and not never-news), and News cards
   are **read-only** (answer/reveal pattern: read → "so what", no grading dead
   end). Verified by observing a session that contains a News card played to
   completion.
4. **Degrades gracefully:** if news sourcing fails or returns nothing, the
   session still completes with the other card types (or the offline-sample mock),
   **never a blank or broken card** — verified by simulating a news-source
   failure and confirming a full session still plays.
5. **Mock fixtures include News:** committed fixtures gain realistic News cards
   so `?mock=1` and the error-fallback render News with no network — verified by
   a `?mock=1` session containing a well-formed News card.
6. **Gates:** News cards are theme-aware and legible at 390px in light/dark/sunset
   with no overflow; zero console/page errors on `/`; `pnpm build` exits 0.

_Note: News may be slower than quiz/trivia — keep loading snappy (e.g. fill the
stack with fast types first, or cap news per session). Zod-validate the News
shape; hedge/skip rather than assert when unsure; cite a real source. No content
logging._

---

## Sprint 6 — Fast-follow content types + personalization + discover lane [todo]

**GOAL:** Widen the variable reward: add the fast-follow card types (flashcard,
this-day-in-history, big-question think-prompt) to types/fixtures/generation, and
add lightweight personalization — a small settings affordance to pick interest
topics (stored in localStorage, passed to `/api/learn` via `topics`) plus a
"discover" lane that occasionally serves a topic outside the set for serendipity.

**DRAFT acceptance criteria**

1. **New card types render and reveal correctly:** flashcard (term → definition
   reveal), this-day (year + event + why), and big-question (think-prompt, no
   grading) each render with their reveal/"why" pattern and are not dead ends —
   verified in `?mock=1` (fixtures present) and, where generated, in live mode.
2. **Topic preferences work and persist:** a small settings affordance lets Monte
   pick/edit interest topics; the selection **persists in localStorage** across
   reloads and is reflected in subsequent sessions (live sessions pass the chosen
   `topics` to `/api/learn`; mock biases toward them) — verified by changing
   topics, reloading, and observing the session/topic mix shift.
3. **Discover lane adds serendipity:** sessions occasionally include a card whose
   topic is **outside** the selected interest set (a visibly "discover" / rare
   card), so the feed isn't a closed loop of the same topics — verified across a
   couple of sessions surfacing an off-set topic.
4. **Variable reward is richer:** a session can now mix across more than the v1
   three types and across in-set + discover topics, and two consecutive sessions
   differ in type/topic mix — verified by inspecting two sessions' card
   types/topics.
5. **Degrades + stays correct:** new types are Zod-validated (live) and drop
   rather than break a session on bad data; with personalization unset, sensible
   default interests still drive a good session — verified by playing a session
   with no saved prefs and one with custom prefs.
6. **Gates:** new types + the settings affordance are theme-aware and legible at
   390px with no overflow; zero console/page errors on `/` and the settings
   affordance; `pnpm build` exits 0.

_Note: types added to the client-safe `Card` union (flashcard {term,definition},
thisday {year,event,why}, bigq {prompt}); fixtures gain examples of each; the
generation prompt + Zod schema extend to cover them. The settings affordance can
live inline on Learn or in `/settings` — builder's call at alignment._

---

## Done / Blocked history

- **Travel: Globe-First Interactive Map** (prior GOAL) — Sprints 1–3 shipped and
  evaluator PASS, plus a follow-up stability fix. **Closed/superseded** by this
  backlog. Verdicts: `agent/evals/20260627-140334-sprint-1.md`,
  `agent/evals/20260627-142718-sprint-2.md`,
  `agent/evals/20260627-145608-sprint-3.md`. The `/travel` page (filled
  per-category country polygons, rich info sheet/dialog, overlaid legend, globe
  geometry in `src/components/globe-utils.ts`) remains live and is a page this
  backlog must not regress.
- **Labs gallery** (`/labs`, intervening GOAL) — shipped per STATE.md (the `/labs`
  hub + `built-by-agents`, `journey`, `field` experiments). **Closed/superseded**
  by this backlog; `/labs` pages remain reachable but stay out of the primary nav
  (consistent with the current site). Do not re-do or remove them.
- **Settings, Theming, and Nav Tidy** (earlier GOAL) — shipped + PASS; the theme
  engine (`ThemeProvider`/`useTheme`, semantic tokens, reduce-motion) and the
  sticky-header tab nav are infrastructure this backlog builds on. Do not re-do.
