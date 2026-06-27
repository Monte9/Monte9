# AGENTS.md - Monte9/Monte9

For AI agents working in this repo.

## What this is

This repo does two jobs:

1. **GitHub profile README** — `README.md` at the root renders on
   github.com/Monte9. It is hand-curated. Never modify it as part of site
   work; only touch it when Monte explicitly asks for profile changes.
2. **montethakkar.com** — a minimal personal site (Next.js static export,
   Tailwind, markdown blog) deployed on Vercel. See `agent/GOAL.md`.

## Project-specific skills

- `.claude/skills/build-sprint/SKILL.md` - autonomous build harness
  (planner → generator → evaluator) driven by `agent/GOAL.md`. Flow is
  ALIGN (evaluator agrees acceptance criteria) → BUILD → EVALUATE
  (evaluator drives Playwright and issues a PASS/FAIL verdict). The
  `planner` and `evaluator` run as fresh-context subagents.

## Repo conventions

**Stack:** Next.js (App Router, static export), React, TypeScript,
Tailwind 4, markdown posts with frontmatter, pnpm.

**Content paths:**

- `content/posts/` - blog posts (markdown + frontmatter: title, date,
  description). Filename = slug.
- `public/resume.pdf` - Monte's resume; the Resume nav link appears
  automatically when this file exists
- `src/app/` - pages; `src/lib/posts.ts` - markdown loading
- `agent/` - harness state (GOAL, SPEC, BACKLOG, STATE, RUBRIC, evals)

**Git workflow:**

- Standing permission: push committed work directly to main
  (`git push origin HEAD:main`).
- `pnpm build` must pass before any push that touches the site.
- Use `site: <summary>` for site commits, `post: <title>` for new blog
  posts, `feat(sprint-N): <summary>` for harness sprint commits, and
  `profile: <summary>` for README changes.

## Environment notes

- Playwright browsers are pre-installed at `/opt/pw-browsers`; the module
  resolves via `NODE_PATH=/opt/node22/lib/node_modules`. The evaluator
  drives a real headless Chromium (screenshots + interaction). The
  Playwright CDN is blocked, so never run `playwright install` — the
  browsers are already there.
- npm registry access works; `pnpm install` is fine.
- `git push origin HEAD:main` works from cloud sessions. If a push is
  rejected because the remote moved (e.g. a GitHub-UI upload), fetch and
  rebase, then push again.
