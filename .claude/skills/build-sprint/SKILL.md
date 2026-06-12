---
name: build-sprint
description: Run the autonomous build harness for montethakkar.com (the personal site in this repo). Use when asked to run a sprint, run the harness, build the next feature, or continue building toward the goal. Reads agent/STATE.md and loops sprints until the backlog is done.
---

# Build Sprint

Planner → Generator → Evaluator harness. Runs in exactly one mode: a single long-lived session that loops until the backlog is empty or blocked. The main session context is the generator. The evaluator and planner ALWAYS run as their subagents (`.claude/agents/`) so they get fresh context.

## State files

State lives in git so the harness survives context summarization and session restarts.

- `agent/GOAL.md` - north star, human-owned, never edit
- `agent/SPEC.md` - product spec (planner output)
- `agent/BACKLOG.md` - ordered sprints with acceptance criteria
- `agent/STATE.md` - cursor: phase, sprint, attempts, history
- `agent/RUBRIC.md` - evaluator criteria
- `agent/evals/` - verdict reports (markdown committed; `shots/` and `tmp/` gitignored)

## The loop

Read `agent/STATE.md`, then repeat until a stop condition:

| Condition | Action |
|-----------|--------|
| No `agent/SPEC.md`, no pending sprints, or GOAL.md changed direction | Spawn the `planner` subagent. Commit its output to main. Continue |
| phase=blocked | Stop. Report the blocked sprint and its verdict to the human |
| Pending sprint, attempts < 2 | BUILD then EVALUATE (below) |
| Pending sprint, attempts >= 2 | Set phase=blocked, commit state + verdict, stop and notify the human |

Stop conditions: backlog empty (success), a sprint blocks, or the human interrupts.

## BUILD then EVALUATE

1. **Build**: implement the first pending sprint from `agent/BACKLOG.md`. Match existing code style. Keep static export viable. Never touch `README.md`. Run `pnpm build` yourself before handing off; don't waste evaluator runs on compile errors.
2. **Evaluate**: spawn the `evaluator` subagent. Give it only the sprint number and its acceptance criteria. Never include implementation notes, reasoning, or diffs. Never grade your own work in the main context.
3. **On PASS**: commit `feat(sprint-N): <summary>`, push to main (standing permission, see AGENTS.md). Mark the sprint done in BACKLOG, advance STATE (next pending sprint, attempts=0), append history row, commit, push.
4. **On FAIL**: increment attempts in STATE. Fix exactly what the verdict's instructions say, then re-evaluate. Do not expand scope while fixing.

## Rules

- One sprint in flight at a time. Never start sprint N+1 while N is unresolved.
- Main only receives PASS work. Failed attempts stay in the working tree, never on main.
- Update `agent/STATE.md` and its history table on every transition, including failures. The state file is the source of truth if context is lost mid-run.
- Verdict files are append-only history. Never edit or delete old verdicts.
- Infrastructure failures (sandbox, network, missing browsers) don't count as sprint attempts: retry once, then stop and report.
- Keep per-sprint chat updates to one or two lines; the pushed commits and verdicts are the record.
