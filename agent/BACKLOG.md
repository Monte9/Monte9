# BACKLOG — /travel interactive 3D globe

Ordered sprints toward `agent/GOAL.md`. Each sprint is buildable AND evaluable
in a single run, keeps `pnpm build` (static export) green, never touches
`README.md`, and every acceptance criterion is verifiable by interacting with
the running site (Playwright-checkable).

Acceptance criteria below are **DRAFT** — they are finalized at sprint start via
builder/evaluator alignment (per `agent/RUBRIC.md`) and recorded as "aligned" in
this file and in `agent/evals/<ts>-sprint-N-criteria.md` before feature code is
written.

Status legend: `todo` / `in progress` / `done` / `blocked`. Never delete
done/blocked history; mark it.

---

## Sprint 1 — Route, data, nav, and a sized client globe mount (scaffold) [done]

**GOAL:** Stand up `/travel` with the Travel nav link, the visited-countries
data module, and a dynamically-imported (`ssr: false`) `'use client'` Three.js
canvas that renders a plain rotating sphere — proving static export survives
WebGL.

**DRAFT acceptance criteria**

1. Navigating to `/travel` returns 200 and renders an `h1` containing "Travel";
   a Travel link in the header nav (in `src/app/layout.tsx`, beside
   Posts/About) resolves from `/about` (or `/`) to `/travel`.
2. A `<canvas>` is present inside the globe container with non-zero rendered
   width and height at both 1280px and 390px viewports.
3. `src/data/travel.ts` exports all seven countries (Italy, France, Japan,
   Croatia, Tanzania, Costa Rica, Turkey) with `name`, `lat`, `lng`, and
   `visited` fields; the page surfaces this (e.g. a static list) so all seven
   country names appear in the DOM.
4. `pnpm build` exits 0 (static export succeeds) and the globe component is
   loaded via `next/dynamic` with `{ ssr: false }` (no WebGL at prerender).
5. No console errors / page errors on `/travel` or the homepage; no horizontal
   overflow at 390px on `/travel`.

---

## Sprint 2 — Recognizable Earth + auto-rotation [done]

**GOAL:** Turn the bare sphere into a recognizable, minimal Earth (vendored
`world-atlas` country outlines as line geometry; lat/long graticule fallback)
that auto-rotates on load with no user input, matching the site's quiet
aesthetic.

**DRAFT acceptance criteria**

1. The globe reads as Earth: country-outline lines (or, fallback, a clear
   lat/long graticule) are visible over the sphere in a 1280px screenshot, in
   muted styling consistent with the site.
2. Any geo data/asset used is vendored into the repo (committed under `src/` or
   `public/`); there are no runtime external network requests from `/travel`
   (verifiable: no failed/blocked external fetches in the console/network log).
3. The globe auto-rotates on load with no user input: two screenshots ~1s apart
   (no interaction) differ in the globe region.
4. `pnpm build` exits 0; no console errors / page errors on `/travel`.
5. No horizontal overflow at 390px; the globe still fills its container and the
   canvas has non-zero size at 390px.

---

## Sprint 3 — Pins + drag-to-rotate + pause-on-interact + labels [done]

**GOAL:** Place an accent-colored pin at each of the seven countries, let the
user drag to spin the globe (pausing auto-rotation during interaction), and
reveal a country's name + visit date on hover/click.

**DRAFT acceptance criteria**

1. Seven pins render at the correct approximate locations (each visited country
   has one pin near its landmass); Italy and France remain individually
   distinguishable/selectable rather than merged into one target.
2. Dragging across the canvas rotates the globe: the rendered view after a drag
   differs from the pre-drag frame (pixels differ).
3. Auto-rotation pauses while the user interacts (during/right after a drag the
   globe is not auto-spinning) and resumes after interaction ends — observable
   by frame comparison before, during, and after a drag.
4. Hovering or clicking a pin reveals DOM-readable text with that country's name
   and its visit date (e.g. "Japan — May 2024") for at least one country, and
   the active pin is visually emphasized (color/scale change).
5. `pnpm build` exits 0; no console errors / page errors on `/travel`; no
   horizontal overflow at 390px (pin interaction works at mobile width via tap).

---

## Sprint 4 — Mobile polish, legend, and resilience [done]

**GOAL:** Final pass — responsive composition, a static newest-first country
legend that doubles as the no-WebGL fallback, and smooth/quiet motion that fits
the site.

**DRAFT acceptance criteria**

1. A static legend lists all seven countries with visit dates, ordered
   newest-first (Italy/France 2025 → Turkey 2013); the same `src/data/travel.ts`
   drives both the legend and the pins (single source of truth).
2. At 390px the page has no horizontal overflow, the globe and legend stack
   cleanly, the canvas is non-zero and interactive (tap a pin selects it), and
   labels remain legible.
3. At 1280px the globe is well-composed within the `max-w-2xl` column, motion
   (auto-rotate) is smooth/not janky, and the active-country label is clearly
   readable (no near-invisible text); accent color matches the site.
4. Regression check: homepage and `/about` (or `/posts`) still render correctly
   at 1280px and 390px with no console errors.
5. `pnpm build` exits 0; no console errors / page errors on `/travel`; if WebGL
   is unavailable the legend still conveys the seven countries + dates (page
   degrades gracefully, no crash).

---

## Done / Blocked history

- 2026-06-27: Sprints 1–4 built together in one pass and verified as a single
  feature. Evaluator PASS on all 9 hard gates (real Playwright interaction):
  build green, canvas sized at 1280/390, recognizable vector Earth,
  auto-rotate on load, drag-to-rotate, pause-then-resume, pins reveal
  name+date (Italy/France separable), seven countries server-rendered, no
  regressions. Verdict: `agent/evals/20260627-024642-sprint-1-4.md`.
