# STATE

phase: planning
sprint: -
attempts: 0

## Notes

ACTIVE GOAL (2026-06-28): "Learn" — a 2–3 min variable-reward micro-learning
feed (quiz + trivia + news), the simplified/diversified descendant of quiz-me.
Live generation via a Vercel serverless function (Anthropic key in env),
mockable frontend, Learn as the first tab + site root (Home tab removed).
GOAL.md + SPEC.md written; planner is producing BACKLOG sprints. North star:
"would Monte pull-to-refresh again?" NOTE: this drops `output: export` (route
handlers need a real Next server) — ripples into the Creator routine's
build/screenshot (serve via next start, not out/).

## Notes

LABS GALLERY SHIPPED (2026-06-28): the prototype exploration became a permanent
`/labs` section — a growing gallery of agentic web-dev experiments (user: "keep
all 3 as MVPs and ship under /labs, make it a nav tab"). All compile in one
static export, zero console errors, work light/dark/sunset + mobile/desktop.
  - `/labs` hub — sortable (Recent/Oldest) + tag-filterable list of experiments,
    driven by a registry at `src/data/labs.ts` (add new prototypes there).
    Hub page = server (metadata) → `LabsList` client component (sort/filter).
  - `/labs/built-by-agents` — animated harness-loop diagram + scroll-revealed
    sprint timeline, from the real STATE.md history. (data: src/data/buildlog.ts)
  - `/labs/journey` — scrollytelling globe that flies Bangalore→SF→Austin→LA as
    you scroll, marker pulses on the active city. (data: src/data/journey.ts)
  - `/labs/field` — interactive domain-warped GLSL flow-field shader, theme-tinted.
  Nav: desktop = Posts·Travel·Labs·About; mobile tab bar = Home·Posts·Travel·
  Labs·About (Labs flask replaced the Settings tab; Settings now lives in the
  hamburger SiteMenu). Components live in `src/components/labs/`.
  Known polish backlog (not blocking): Field's bottom hint text has low contrast
  over the bright shader; the 3 experiments share today's date so Recent/Oldest
  look identical until more land. Future prototypes: append to src/data/labs.ts
  + add a page under src/app/labs/<slug>/.

/travel globe-first revamp is COMPLETE — all 3 sprints shipped and passed the
evaluator (static export, 3 themes, both viewports). Backlog empty.

The travel page is now globe-first: filled country regions by category
(India=Home, US=Lived, 7=Visited; theme-aware colors), tap/hover for rich
info (bottom sheet on mobile, dialog on desktop), overlaid legend + hint,
no static list. Globe fills below header to tab bar, drag + auto-rotate +
reduce-motion intact. Geometry: world-atlas polygons triangulated via
THREE.ShapeUtils.triangulateShape + longest-edge subdivision, projected to
the sphere (src/components/globe-utils.ts buildCountryFill).

## History

| date | sprint | result | notes |
|------|--------|--------|-------|
| 2026-06-12 | bootstrap | shipped | site v1 + first harness port |
| 2026-06-27 | /travel globe v1 | PASS | 3D globe + pins + polish |
| 2026-06-27 | nav/hamburger | shipped | sticky bar, hamburger |
| 2026-06-27 | settings+themes | PASS | theme engine, /settings, reduce-motion |
| 2026-06-27 | nav refinements | shipped | desktop links, lucide icons, page-title header, toggle |
| 2026-06-27 | travel-v2 s1 | PASS | filled per-category country polygons |
| 2026-06-27 | travel-v2 s2 | PASS | rich info: bottom sheet / dialog |
| 2026-06-27 | travel-v2 s3 | PASS | globe-first layout + legend; list removed |
| 2026-06-27 | travel fix | shipped | globe no longer resets view on select (stable Canvas camera prop + orientation-preserving FitCamera). Self-verified: dragged orientation held through select+close |
