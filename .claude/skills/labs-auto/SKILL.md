---
name: labs-auto
description: Run the autonomous Labs routine for montethakkar.com — generate 3 web-dev prototypes, judge them with evolving taste, and ship exactly 1 to /labs on main (green-gated). Use when asked to run the labs routine, the hourly prototype loop, build/ship a new lab experiment, or when fired by the hourly schedule.
---

# Labs Auto

An autonomous loop that ships one new `/labs` prototype per run and gets better
at it over time. Full design + memory map: `agent/labs/README.md`.

## What one run does

`Ideate (3 new concepts) → Build (3 parallel agents) → Verify (pnpm build green +
screenshot) → Judge (taste-driven, picks 1) → Ship (keep winner, drop losers,
update memory, commit + push main)`. Orchestrated deterministically by
`.claude/workflows/labs-auto.js`.

## How to run it

1. **Sync to main** (the routine ships to production so it deploys):
   ```
   cd /home/user/Monte9
   git fetch origin main
   git checkout main && git pull --ff-only origin main
   ```
   (Resolve to a clean `main` working tree before starting.)
2. **Invoke the workflow** — this is the whole routine:
   ```
   Workflow({ name: "labs-auto" })
   ```
   It runs in the background and self-ships. Watch progress with `/workflows`.
3. **Report** the result: read its return value (or the top of
   `agent/labs/JOURNAL.md`) and tell the user the winner slug, why it won, and
   the commit — or that it was a no-ship round.

Do nothing else — the workflow owns building, judging, memory, and the push.

## Invariants (the workflow enforces these; don't bypass)

- **Green-gate:** never commit/push unless `pnpm build` exits 0. No green → ship
  nothing, log a no-ship round.
- **Isolation:** each prototype is a self-contained `/labs/<slug>` page + its own
  component(s). The only shared file the routine edits is the registry
  (`src/data/labs.ts`), appended once by the ship stage. A weak prototype can
  never break the rest of the site.
- **Ship exactly one** per run; losers' files are removed before the commit.
- **Memory is the point:** every run reads `agent/labs/{IDEAS,JOURNAL,TASTE}.md`
  to avoid repeats and to apply + refine taste. Keep these append-only and
  greppable.
- **No new deps; don't touch the repo profile `README.md` or other routes.**

## Memory (search before/after a run)

- `agent/labs/JOURNAL.md` — every run: candidates, scores, winner, commit.
- `agent/labs/TASTE.md` — the judge's evolving rubric (a Lesson per run).
- `agent/labs/IDEAS.md` — concept ledger (dedupe source).
- `src/data/labs.ts` — the live registry of shipped experiments.

## Scheduling

Runs on a schedule via a **Claude Code Routine** (Anthropic-managed cloud, so it
survives container reclaim). The Routine clones `main`, runs this skill, and
ships the winner. Exact config (prompt, environment, schedule, branch-push
permission) lives in `agent/labs/ROUTINE.md`. Manage it at
https://claude.ai/code/routines or with the `/schedule` CLI.
