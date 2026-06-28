# STATE

phase: idle
sprint: -
attempts: 0

## Notes

NEXT-GOAL EXPLORATION (2026-06-28): built 3 throwaway MVP prototypes under
`/lab` to decide the next direction (user: "build multiple MVP ideas to figure
out what lands"). All 3 compile in one static export, zero console errors, work
light/dark/sunset + mobile/desktop:
  - `/lab/built-by-agents` — animated harness-loop diagram + scroll-revealed
    sprint timeline, from the real STATE.md history. (data: src/data/buildlog.ts)
  - `/lab/journey` — scrollytelling globe that flies Bangalore→SF→Austin→LA as
    you scroll, marker pulses on the active city. (data: src/data/journey.ts)
  - `/lab/field` — interactive domain-warped GLSL flow-field shader, theme-tinted.
Awaiting user pick of the winner to productionize via the harness. These are
prototypes (rough edges expected); the chosen one gets a real GOAL/BACKLOG.

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
