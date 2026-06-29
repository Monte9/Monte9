# GOAL — "Learn": a 2–3 minute variable-reward learning feed

Build a **Learn** experience that makes **Monte** want to come back, daily, to
**learn and grow** — in quick 2–3 minute sessions, where every pull-to-refresh
delivers something **new** and **a little unpredictable** (the variable reward).

It is the simplified, diversified descendant of Monte's `quiz-me`
(github.com/Monte9/quiz-me): keep the soul (an AI quizmaster that asks fresh,
interest-scoped questions and teaches you the *why*), drop the machinery
(no Postgres, no accounts, no multi-user portfolio), and **widen the content**
beyond quizzes into a mixed feed (quiz, trivia/did-you-know, news, more).

## North star (the only metric that matters)

> Would Monte **pull to refresh again** — today, and tomorrow?

Every decision optimizes for that return: fast (a full session ≤ 3 min), always
fresh (no repeats, a different mix each time), genuinely educational (every card
teaches something with a short "why"), and delightful (you don't know what
you'll get next).

## Must have

- **Learn is the first tab and the site's landing** (`/`). There is **no Home
  tab** anymore. (Monte's bio moves to `/about`.)
- **A session is a short stack of cards** (~5, ≈2–3 min): open → card → answer or
  read (~20s) → instant reveal + the "why" → next → "session complete" with a
  **streak**. **Pull-to-refresh / "new set" starts a fresh session.**
- **Diverse, mixed content** — at minimum Quiz (multiple-choice, instant grade),
  Trivia / Did-you-know, and News (current, summarized + "so what"). The mix of
  *type, topic, and difficulty* is the variable reward.
- **Live, on-demand generation via a Vercel serverless function** holding the
  Anthropic API key — so Monte can pull-to-refresh for new content **as often as
  he wants**, NOT gated on the hourly Creator routine.
- **Mockable frontend** — a mock mode returns canned cards so the UI/content can
  be iterated and tested without the function or a key.
- **Interest-scoped** to Monte (AI, startups, history, finance, health/fitness,
  space, science, sports/pickleball…) plus a "discover" lane for serendipity.
- **Dynamic tab title** as the external trigger (e.g. streak / "new set ready").
- Keep the site shell (sticky header, tab bar, themes, reduce-motion).

## Must not

- No accounts, login, or backend database. State (streak, score, seen-ids,
  topic prefs) lives in `localStorage`.
- No API key in the browser — generation happens server-side in the function.
- Not slow, not long: never make a session feel like homework.

## Out of scope (later, not now)

- Per-card social/sharing, public history/portfolio, leaderboards.
- Tying the deck to the hourly Creator routine (explicitly rejected — live is
  the point).

This goal is handed to the planner to expand into `agent/SPEC.md` detail and an
ordered `agent/BACKLOG.md` of small, evaluable sprints.
