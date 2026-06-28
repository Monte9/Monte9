# ROUTINE — Claude Code Routine config for labs-auto

The hourly-ish loop is scheduled as a **Claude Code Routine** (runs on
Anthropic-managed cloud, so it keeps going when no session/container is open).
Docs: https://code.claude.com/docs/en/routines

Routines are created in the web UI / `/schedule` CLI — not from a repo file — so
this doc is the source of truth for what to enter. Manage at
https://claude.ai/code/routines.

## Settings

- **Name:** `labs-auto — prototype shipper`
- **Model:** Claude Opus (latest)
- **Repository:** `monte9/monte9` (cloned from `main`, the default branch)
- **Environment:** Default ("Trusted" network is enough — npm + git push go
  through Anthropic). **Setup script:** `pnpm install`
- **Trigger → Scheduled:** custom cron **`17 6-19 * * *`** → **14 runs/day**
  (06:17–19:17 local; shift the `6-19` window to taste). Maxes out the Max plan's
  15/day cap with 1 run of headroom. Set via `/schedule update` (the UI presets
  only offer hourly/daily/weekly). If you'd rather not use the CLI, pick the
  **Hourly** preset and the daily cap will stop it around 14–15/day.
- **Permissions:** **"Allow unrestricted branch pushes" = ON** (so it can push
  `main` and auto-deploy). Keep the **GitHub** connector; others can be removed.

## Prompt (paste verbatim)

```
Run the labs-auto routine for montethakkar.com. Follow
.claude/skills/labs-auto/SKILL.md exactly: ensure a clean, up-to-date `main`
working tree, then invoke the labs-auto workflow (the Workflow tool, name
"labs-auto") and let it run to completion. It generates 3 web-dev prototypes,
judges them with the evolving taste in agent/apps/TASTE.md, and ships exactly
ONE to /apps — committing and pushing to `main` ONLY if the static build
(`pnpm build`) is green. Never push if the build is not green. If the Workflow
tool is unavailable, follow the loop documented in agent/apps/README.md using
subagents instead. When finished, output one line: the winner slug + commit
sha, or "no-ship" with the reason. Do not modify the repo profile README.md or
any route outside /labs.
```

## Why these choices

- **Cloud Routine, not GitHub Actions / in-session cron:** routines run on
  Anthropic infra and survive container reclaim; no API-key secret to manage,
  and they're a full Claude Code session that can use this repo's committed
  skill + workflow directly.
- **14/day:** the Max plan caps routine runs at 15/day; 14 leaves a manual-run
  buffer.
- **Push to main:** the winner deploys immediately. Safe because every run is
  green-gated and each prototype is an isolated `/apps/<slug>` route.

## Daily run caps (for reference)

Pro 5/day · Max 15/day · Team/Enterprise 25/day. One-off `/schedule` runs do
**not** count against the cap.
