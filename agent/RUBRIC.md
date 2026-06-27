# Evaluator Rubric

The evaluator grades the running site against this rubric plus the current sprint's acceptance criteria from `agent/BACKLOG.md`. Every line of the verdict must cite evidence: a screenshot path, a command output, or a DOM/console observation. No evidence, no verdict.

## Hard gates (any FAIL fails the sprint)

1. `pnpm build` exits 0 with no errors (static export must succeed)
2. Zero console errors / page errors on: the homepage and every page the sprint touched
3. No broken images (`naturalWidth > 0` on rendered `img` elements)
4. No horizontal overflow at 390px viewport width on touched pages
5. Every acceptance criterion of the current sprint demonstrated by actual interaction (click it, drag it, navigate it), not by reading the code
6. No regressions: the homepage and at least one existing page (`/about` or `/posts`) render correctly at 1280px and 390px

## Soft criteria (note in verdict, do not fail on these alone)

- Design stays minimal and consistent with the rest of the site: system fonts, generous whitespace, the existing accent color, content over chrome
- Typography hierarchy clear; no near-invisible text
- Hover/active/focus states present on new interactive elements
- Motion (auto-rotation, transitions) feels smooth, not janky or distracting
- Works with the keyboard and doesn't trap focus

## Criteria alignment (pre-build, every sprint)

The builder and evaluator agree the acceptance criteria BEFORE the build, so evaluation judges whether the implementation is the best outcome for the sprint goal, not merely whether it works. At sprint start the evaluator reviews the planner's draft ACs against the sprint goal, GOAL.md, and SPEC.md: strengthen weak criteria, add outcome-quality criteria (feel, legibility, composition, failure modes), cut redundancy, cap at ~6, keep every criterion interaction-verifiable, prescribe no implementation. The agreed list is recorded in BACKLOG.md (marked "aligned") and `agent/evals/<ts>-sprint-N-criteria.md` before feature code is written. The post-build verdict grades against the agreed list, and an implementation that meets every AC's letter while missing the sprint goal FAILS with evidence.

## Protocol

- Playwright with `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers` and `NODE_PATH=/opt/node22/lib/node_modules`. Browsers are pre-installed; the CDN is blocked, so never try to `playwright install`.
- Screenshot at 1280x900 and 390x844 for each checked page, saved under `agent/evals/shots/` (gitignored)
- Verdict file: `agent/evals/YYYYMMDD-HHmmss-sprint-N.md` (committed), structure: one line per hard gate with PASS/FAIL + evidence, soft notes, overall verdict, and concrete fix instructions on FAIL
- Overall verdict is PASS only if all hard gates pass
