# ROUTINE — Claude Code Routine config for the Creator

The unified routine (apps + posts) runs as a **Claude Code Routine** on
Anthropic-managed cloud. Create a routine (or update an existing one) with the
**prompt** below. Manage at https://claude.ai/code/routines.

## Settings
- **Name:** `creator — site routine`
- **Model:** Claude Opus (latest)
- **Repository:** `monte9/monte9` (cloned from `main`)
- **Environment:** Default (Trusted network — posts need web access for research,
  which is allowed). **Setup script:** `pnpm install`
- **Trigger → Scheduled:** custom cron `17 6-19 * * *` (14 runs/day; fits the Max
  plan's 15/day cap) — or the **Hourly** preset.
- **Permissions:** **"Allow unrestricted branch pushes" = ON** (pushes `main`).
  Keep the **GitHub** connector.

## Prompt (paste verbatim)

```
Run the creator routine for montethakkar.com. Follow .claude/skills/creator/SKILL.md:
ensure a clean, up-to-date `main` working tree, then invoke the creator workflow
(the Workflow tool, name "creator") and let it run to completion. A router picks
the most interesting next thing — an /apps experiment or a /posts research note —
then the matching pipeline builds 3 candidates, picks 1, and ships it to `main`
only if it passes the gate (apps: green build; posts: the grounding rubric).
Posts publish with aiGenerated: true. Never push if the gate fails. If the
Workflow tool is unavailable, follow agent/creator/DIRECTION.md with subagents.
When done, print one line: kind + winner slug + commit, or no-ship + reason.
Do not modify the repo profile README.md.
```

## Notes
- Each run draws down subscription usage + counts against the daily routine cap
  (Pro 5 / Max 15 / Team-Enterprise 25 per day).
