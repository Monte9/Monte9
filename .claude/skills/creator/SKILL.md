---
name: creator
description: Run the unified autonomous Creator routine for montethakkar.com — a router picks the most interesting next thing (an /apps experiment or a /posts research note) and ships exactly one to main (green/grounding-gated). Use when asked to run the creator, the site routine, ship the next app or post, or when fired by the schedule.
---

# Creator

One routine that grows the site on two streams — **apps** (`/apps`) and **posts**
(`/posts`) — choosing the most interesting next thing each run. Supersedes the
app-only `labs-auto`. Full design + memory map: `agent/creator/DIRECTION.md`.

## What one run does

`Route (app vs post, by editorial taste) → Ideate 3 candidates → Make (apps:
build 3 in parallel · posts: draft 3 with web research) → Judge (apps: visual
TASTE · posts: grounding RUBRIC) → Ship 1 to main`. Orchestrated by
`.claude/workflows/creator.js`.

## How to run it

1. **Sync to main** (the routine ships to production):
   ```
   cd /home/user/Monte9 && git fetch origin main && git checkout main && git pull --ff-only origin main
   ```
2. **Invoke the workflow** — the whole routine:
   ```
   Workflow({ name: "creator" })
   ```
   It runs in the background and self-ships. Watch with `/workflows`.
3. **Report** the result: kind + winner slug + commit (or no-ship reason). The
   spine is `agent/creator/JOURNAL.md`.

## Taste lives in two layers
- **Editorial / routing** (shared): `agent/creator/DIRECTION.md` — decides app vs
  post and which pitch is most interesting (novelty, payoff, balance, feasibility).
- **Execution** (per-kind): `agent/apps/TASTE.md` (visual) and
  `agent/posts/RUBRIC.md` (grounding, ported from stuck-problems-agent). Lessons
  roll up into DIRECTION.

## Invariants
- **Quality gate:** apps must pass `pnpm build`; posts must pass the grounding
  rubric (real sources, no invented stats). A weak winner is a **no-ship**.
- **Ship exactly one** per run; losers' files are removed/deleted before commit.
- **Isolation:** apps are self-contained `/apps/<slug>`; the only shared app file
  edited is the registry (`src/data/apps.ts`). Posts are single `.md` files.
- **Posts auto-publish with `aiGenerated: true`** → an "AI-generated" badge +
  disclosure. Each app winner also writes a bespoke `motif` (thumbnail) into the
  registry.
- **Memory is the point:** every run reads + updates the IDEAS ledgers, JOURNALs,
  and rubrics so it never repeats and gets sharper.
- **No new deps; never touch the repo profile `README.md`.**

## Memory
- `agent/creator/{DIRECTION,JOURNAL}.md` — routing taste + run spine.
- `agent/apps/{IDEAS,JOURNAL,TASTE}.md` + `src/data/apps.ts` — app stream.
- `agent/posts/{IDEAS,JOURNAL,RUBRIC}.md` + `content/posts/` — post stream.

## Scheduling
A Claude Code Routine (cloud) invokes this. Config: `agent/creator/ROUTINE.md`.
(Replaces the old `labs-auto` routine — swap the routine's prompt to invoke
`creator`.)
