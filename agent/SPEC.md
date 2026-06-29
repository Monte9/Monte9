# SPEC — "Learn" micro-learning feed

Derived from `agent/GOAL.md`. Detailed enough to hand to the planner to produce
an ordered `agent/BACKLOG.md` of small, evaluable sprints, and to the evaluator
(criteria alignment + verdicts). Concrete on architecture, data contract, and
acceptance — but prescribes no more implementation than necessary.

---

## 1. The experience

`/` (the site root, first tab "Learn") is a **card feed**:

1. On load, a **session** of `N` cards (default 5) is fetched (live or mock).
2. Cards are shown one at a time (a swipe/tap stack or a vertical snap feed —
   builder's call, must feel native on mobile).
3. Per card the user **answers or reads** (~20s), then sees an **instant reveal**:
   the answer + a short **"why"** (the teaching moment). No card is a dead end.
4. After the last card → **"session complete"**: this session's score + the
   running **streak**, and a primary **"New set →"** action.
5. **Pull-to-refresh** (mobile) and the **"New set"** button both start a fresh
   session. Refreshing as often as desired is the core loop.

**Variable reward:** each session mixes **type, topic, and difficulty**
unpredictably; no two consecutive sessions feel the same; an occasional "rare"
card (a harder or bigger one) adds variance. Never repeat a card within the
locally-tracked recent set (seen-ids in `localStorage`).

**Streak & state (localStorage only):** day-streak (consecutive calendar days
with ≥1 completed session), per-session score, seen-card-ids (ring buffer, ~last
100), and topic preferences. No backend, no accounts.

**Dynamic tab title:** `document.title` reflects an external trigger — e.g.
`🔥 4-day streak · Learn` on load, `New set ready · Learn` after completing one.
Restore a sane title when navigating away.

## 2. Content types (v1 = Quiz + Trivia + News; rest are fast-follow)

A **Card** is a discriminated union. The function returns validated cards; the
client renders by `type`. Pure types live in a client-safe module (no server
imports) so both the function and the UI/mock share them.

```ts
type Topic = string;            // e.g. "AI", "History", "Finance"
type Difficulty = "easy" | "medium" | "hard";

type BaseCard = { id: string; type: string; topic: Topic; difficulty: Difficulty };

type QuizCard = BaseCard & {
  type: "quiz";
  question: string;
  options: string[];            // 2–4 options
  correctIndex: number;         // server truth; fine to send to client (no grading service)
  explanation: string;          // the "why" — the chain of facts to the answer
};

type TriviaCard = BaseCard & {
  type: "trivia";               // did-you-know
  fact: string;
  why: string;                  // why it's interesting / matters
};

type NewsCard = BaseCard & {
  type: "news";
  headline: string;
  summary: string;              // ≤2 sentences
  why: string;                  // the "so what" for Monte
  source?: { name: string; url: string };
};

// Fast-follow types (spec now, build later): flashcard {term,definition},
// thisday {year,event,why}, bigq {prompt}  (think-prompt, no grading).

type Card = QuizCard | TriviaCard | NewsCard /* | ... */;
type LearnSession = { cards: Card[]; generatedAt: string; mode: "live" | "mock" };
```

Quality bar per card: factually correct, self-contained, teaches one thing, and
the "why"/explanation is the payoff. Quiz options are plausible (no throwaways).

## 3. Architecture (LOCKED with Monte)

- **Live serverless function holds the API key and generates on demand.** This
  is the source of dynamism — pull-to-refresh hits the function, the function
  calls Claude (key from server env), returns a fresh validated session. It is
  **independent of the hourly Creator routine** (not a pre-generated pool).
- **The frontend is mockable.** A mock provider returns canned fixture cards so
  UI + content can be developed/tested with no function and no key. Toggle via
  `?mock=1` (and/or `NEXT_PUBLIC_LEARN_MOCK=1`). The data contract is identical
  in both modes, so the UI never knows the difference.
- **This requires leaving pure static export.** `next.config.ts` currently sets
  `output: "export"`, which disables server route handlers. The build must
  switch to a **standard Next.js app on Vercel** so `app/api/learn/route.ts`
  runs as a serverless function. Everything else (pages, the WebGL apps, posts)
  keeps working — they're already client components.
- **Ripple to the Creator routine (must be handled, not ignored):** the
  `creator` workflow's verify/ship stages currently build a static export and
  screenshot by serving `out/`. Without `output:"export"` there is no `out/`.
  Update those stages to serve the built app another way (e.g. `next start` on a
  port, or `next build` + a local server) so the routine's green-gate +
  screenshots still work. The green-gate stays `pnpm build` exit 0.

## 4. API contract

- **Endpoint:** `GET /api/learn` (route handler).
- **Query:** `n` (default 5, cap 8), `topics` (comma list; omit = use a default
  interest set + discover), `seen` (comma id list to avoid repeats), optional
  `seed`.
- **Response 200:** `LearnSession` JSON (validated with Zod against the Card
  union; drop/repair any card that fails rather than 500-ing the whole set).
- **Errors:** if the model/key is unavailable, return a clear JSON error +
  status; the client falls back to mock cards with a small "offline sample"
  note rather than a blank screen.
- **Cost/perf:** target first cards visible quickly — stream or return fast
  (use a small/fast model tier for quiz/trivia; news may be slower). Light
  per-IP rate limiting is acceptable. No PII, no logging of content.
- **Server-only secrets:** `ANTHROPIC_API_KEY` (Vercel env). Never shipped to
  client. News sourcing (if used) may fetch a public feed server-side.

## 5. Navigation change

- **Tabs become: `Learn` (first, →`/`) · Posts · Apps · Travel · About.** The
  **Home tab is removed.** Update `MobileTabBar`, `DesktopNav`, `HeaderBrand`
  (mobile title "Learn" at `/`; the desktop wordmark still links to `/`), and
  `src/lib/nav.ts`.
- **Root `/` renders the Learn feed.** Move the current homepage hero/bio
  ("Hi, I'm Monte" + recent posts/apps) into `/about` (or fold sensibly) so the
  intro isn't lost.
- Pick a fitting tab icon for Learn (e.g. a spark / cap / bolt from lucide).

## 6. Personalization

Default interest set = Monte's actual `quiz-me` seed (editable, stored in
localStorage): **Porsche / cars, Roman history, Indian mythology, systems
engineering, data structures (L5), algorithms (L5), pickleball, geography, the
Moon, Mars, startups & product**, plus recents (opera history, medieval
architecture, medieval weaponry) — and the broader set (AI, startups, finance,
health/fitness, space, science). The L5 data-structures/algorithms topics map to
his "interview-ready by Dec 2026" goal — lean into interview-prep flavored cards
there. Two lanes mirror quiz-me: **random** (within his topics) and **discover**
(occasionally serves a topic outside the set for serendipity).

## 7. Mock mode

A committed `learn` fixtures module (~12–15 cards spanning every v1 type and a
few topics) drives mock mode. Used by: local UI dev, the mockable frontend, the
evaluator's UI checks, and the live error-fallback. Fixtures are realistic and
correct (they double as examples for the generation prompt).

## 8. Non-goals (v1)

Accounts, DB, public portfolio/sharing, leaderboards, multi-user, audio, native
app. Spaced-repetition scheduling. Pool/routine integration.

## 9. Acceptance / retention rubric (north-star: "would Monte refresh again?")

Beyond the global hard gates in `agent/RUBRIC.md` (build exits 0, zero console
errors, no 390px overflow, themes intact, no regressions), a sprint that touches
Learn should be graded on:

1. **Fast:** a 5-card session is completable in ≤ ~3 minutes; first card is
   interactive quickly after load (no long blank wait).
2. **Fresh:** two consecutive "New set" sessions differ (different cards/mix);
   no within-session repeats; seen-ids prevent immediate repeats across refresh.
3. **Educational:** every card shows a clear answer + a "why"/explanation; quiz
   grading is instant and correct; nothing is a dead end.
4. **Variable:** a session visibly mixes content types and topics, not a
   monotype run.
5. **Loop closes:** session-complete shows score + streak; "New set" and
   pull-to-refresh both start a fresh session; streak persists across reloads.
6. **Mockable:** `?mock=1` renders a full session with zero network/key; the
   live path returns validated cards and degrades to mock on error (no blank).
7. **Mobile-first feel:** the card stack reads and interacts well at 390px;
   tab title updates; theme-aware in light/dark/sunset.

## 10. Risks & decisions

- **Static-export removal** is the biggest change; sequence it first and verify
  Vercel deploy + the Creator-routine build/screenshot fix before layering UI.
- **LLM latency/cost** on every refresh — mitigate with fast model tiers, small
  N, and snappy loading states; mock keeps dev free.
- **Content correctness** — Zod-validate; prefer the model's high-confidence,
  self-contained facts; news cites a source; hedge/skip rather than assert when
  unsure.

## 11. Env

`ANTHROPIC_API_KEY` (server, Vercel env). Optional `NEXT_PUBLIC_LEARN_MOCK` for
forced mock. No new client-exposed secrets.
