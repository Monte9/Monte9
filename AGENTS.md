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
  (planner → generator → evaluator) driven by `agent/GOAL.md`

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

- This repo's Claude Code cloud environment has no Playwright browsers
  and the Playwright CDN is blocked. The evaluator runs in degraded mode:
  `pnpm build` + HTTP checks against `pnpm dev` (curl the routes, assert
  on the HTML). If a future environment provisions browsers, prefer
  Playwright per `agent/RUBRIC.md`.
- npm registry access works; `pnpm install` is fine.
