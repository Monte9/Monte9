# RUBRIC

Evaluator criteria for montethakkar.com. Hard gates fail the sprint
outright; soft criteria inform fix instructions.

## Hard gates

1. `pnpm build` exits 0 (static export, no errors)
2. Every route in the sprint's scope serves over HTTP with status 200
   and contains its expected content (heading, nav, post body)
3. No internal link on a page in scope resolves to 404 (check both the
   dev server and the `out/` export)
4. Every acceptance criterion of the sprint demonstrably holds, with
   evidence (curl output, file listing, HTML excerpt)
5. `README.md` (GitHub profile page) is unmodified by the sprint

## Soft criteria

- Pages render sensible HTML without client-side JS (static-first)
- Posts index and home agree on post titles/dates
- Metadata: every page has a meaningful `<title>`
- Design stays minimal per GOAL.md: system fonts, one accent color

## Evidence protocol

Write verdicts to `agent/evals/sprint-NN-verdict.md`:

- Date, sprint number, overall PASS/FAIL
- Per-gate result with the evidence captured (commands + relevant output)
- Per-criterion result with what was exercised and observed
- On FAIL: fix instructions ordered by severity, each specific enough to
  act on without re-investigation (file, element, expected vs observed)

## Environment note

This repo's cloud environment has no Playwright browsers (CDN blocked).
Verify over HTTP (`curl`) and via the `out/` export. If browsers become
available (`/opt/pw-browsers`), add: console-error capture, image
`naturalWidth` checks, 390px overflow check, and screenshots to
`agent/evals/shots/`.
