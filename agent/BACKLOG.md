# BACKLOG — Settings, Theming, and Nav Tidy

Ordered sprints toward `agent/GOAL.md`, building on `agent/SPEC.md`. Each sprint
is buildable AND evaluable in a single run, keeps `pnpm build` (static export)
green, never touches `README.md`, and every acceptance criterion is verifiable
by interacting with the running site (Playwright-checkable).

Acceptance criteria below are **DRAFT** — finalized at sprint start via
builder/evaluator alignment (per `agent/RUBRIC.md`) and recorded as "aligned" in
this file and in `agent/evals/<ts>-sprint-N-criteria.md` before feature code is
written.

Status legend: `todo` / `in progress` / `done` / `blocked`. Never delete
done/blocked history; mark it.

Ordering rationale: the theme engine + site-wide token migration must land first
(everything else assumes semantic utilities and a working provider). The
settings page, reduce-motion, and nav changes then sit on top. Three sprints.

---

## Sprint 1 — Theme engine + no-FOUC + site-wide token migration [todo]

**GOAL:** Establish the three-theme system (semantic CSS vars + Tailwind v4
`@theme inline` tokens), a `ThemeProvider` with localStorage persistence and an
OS-default + no-FOUC inline `<head>` script, and migrate every component/page off
literal colors so all three themes apply across the entire site — with no
settings UI yet (theme set via `localStorage`/`data-theme` for evaluation).

**DRAFT acceptance criteria**

1. Setting `<html data-theme>` to `light` / `dark` / `sunset` (or seeding
   `localStorage.theme` then reloading) visibly re-colors the **whole site** —
   header, hamburger menu, mobile tab bar, home, about, posts, a post page,
   travel + the globe label/legend: `getComputedStyle(body).backgroundColor` and
   key text/border colors differ across the three themes on each page.
2. **No FOUC:** with `localStorage.theme="dark"` set before load, the first
   painted frame already shows the dark background (the inline head script set
   `data-theme="dark"` before paint) — verified by reading `data-theme` on
   `document.documentElement` immediately and by a screenshot showing no white
   flash.
3. **OS default + persistence:** with no stored theme and the emulated OS color
   scheme = dark, the site renders dark; selecting a theme via the provider API
   and reloading keeps it (localStorage `theme` honored across reload and
   navigation between two pages).
4. **Legibility:** on home, about, and travel, body and muted text are clearly
   readable against the background in all three themes (no near-invisible text —
   computed text vs background contrast is comfortable, or screenshot review
   confirms), and the globe is legible (sphere/pins/borders visible) in dark and
   sunset, not just light.
5. **No regressions:** globe still auto-rotates and is draggable, sticky header
   still sticks, no horizontal overflow at 390px on every page, zero console /
   page errors, and `pnpm build` exits 0 (static export succeeds).

---

## Sprint 2 — Settings page + reduce-motion [todo]

**GOAL:** Add the `/settings` page with a theme picker (showing the active theme)
and a persisted reduce-motion toggle wired to the provider, so users can switch
themes from the UI with an immediate site-wide update and stop the globe
auto-rotating.

**DRAFT acceptance criteria**

1. `/settings` returns 200, renders a `Settings` heading styled like other
   pages, a **theme picker with three options** (Light/Dark/Sunset, each with a
   swatch/preview), and a **reduce-motion toggle** — legible in all three themes,
   no overflow at 390px.
2. Clicking a theme option **immediately** re-colors the whole site (no reload),
   the picker clearly marks the **active** theme (visual + `aria` selected
   state), and the choice **persists across reload** and navigation away and
   back to `/settings`.
3. Turning the **reduce-motion toggle on** sets `data-reduce-motion="true"` and
   the globe on `/travel` **stops auto-rotating** (two screenshots ~1s apart with
   no input are ~identical in the globe region); turning it off resumes
   auto-rotation. The setting persists across reload.
4. With reduce-motion on, manual globe interaction still works (a drag rotates
   the globe; a pin tap still selects and reveals its country name + date), i.e.
   only the ambient auto-spin is suppressed.
5. The settings controls are keyboard-operable with visible focus (theme options
   focusable + selectable via keyboard; toggle has `role="switch"` +
   `aria-checked` that flips), and focus is not trapped.
6. No console / page errors on `/settings` or `/travel`; `pnpm build` exits 0.

---

## Sprint 3 — Nav tidy (hamburger + 5th Settings tab + desktop primary nav) [todo]

**GOAL:** Trim the hamburger to secondary links only, add Settings as the 5th
far-right gear tab in the bottom bar, and give desktop a path to the primary
pages (header text links per SPEC §2 default), without regressing any existing
behavior.

**DRAFT acceptance criteria**

1. The **bottom tab bar** has exactly 5 items in order Home, Posts, Travel,
   About, **Settings**; the Settings tab is far-right with a gear icon and
   navigates to `/settings`; its active state shows on `/settings`. Still no
   horizontal overflow at 390px.
2. The **hamburger menu** contains only secondary links — Résumé, GitHub, X,
   LinkedIn, Email (Settings allowed as an extra) — and **no longer** contains
   Home / Posts / Travel / About. Click-outside and Escape still close it.
3. On **desktop (1280px)** every primary page (Home, Posts, Travel, About) is
   reachable from the header without the tab bar (per SPEC default: header text
   links; active link emphasized with the accent color), and these links work.
4. The nav fully respects the active theme (tab bar, hamburger, and desktop
   links use semantic tokens; active = accent in all three themes) and remains
   legible in each.
5. **No regressions:** globe interactivity, sticky header, reduce-motion, and
   theme persistence all still work; homepage + at least one existing page render
   correctly at 1280px and 390px; zero console / page errors; `pnpm build` exits
   0.

---

## Done / Blocked history

- Prior goal (/travel interactive 3D globe): Sprints 1–4 shipped and evaluator
  PASS. Closed. Verdict: `agent/evals/20260627-024642-sprint-1-4.md`. The
  SPEC/BACKLOG above supersede that work item.
