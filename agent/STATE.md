# STATE

phase: idle
sprint: -
attempts: 0

## Notes

Harness re-ported from history-stories (2026-06-27) with the ALIGN → BUILD →
EVALUATE flow and a two-mode evaluator. Playwright browsers are available at
`/opt/pw-browsers` (module at `/opt/node22/lib/node_modules`); the evaluator
drives real headless Chromium.

/travel GOAL is complete: the interactive 3D globe shipped and passed the
evaluator on all 9 hard gates. Backlog is empty (all sprints done). Next goal
needs a new GOAL.md + planner run.

## History

| date | sprint | result | notes |
|------|--------|--------|-------|
| 2026-06-12 | bootstrap | shipped | site v1 + first harness port |
| 2026-06-27 | harness-report | shipped | re-ported current harness; new /travel goal |
| 2026-06-27 | sprints 1-4 | PASS | /travel 3D globe; evaluator PASS, verdict 20260627-024642 |
| 2026-06-27 | travel polish | shipped | stronger active-pin emphasis; globe occludes far-side pin picking; deselect on ocean click. Self-verified w/ Playwright (front pins activate, ocean=0 false hits, no console errors) |
| 2026-06-27 | mobile polish | shipped | removed Travel section from /about; FitCamera so globe fits narrow viewports (no side clipping); native-style sticky bottom tab bar on mobile (top nav hidden < sm). Self-verified at 390/1280 (overflow=0, tab bar shows mobile/hides desktop) |
