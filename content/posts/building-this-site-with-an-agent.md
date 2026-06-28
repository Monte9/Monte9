---
title: "Building this site with an agent"
date: "2026-06-12"
description: "This site is built and maintained by a Claude Code agent harness. Here's the setup."
tags: ["Meta", "Agents"]
aiGenerated: false
---

This site lives in my [GitHub profile repo](https://github.com/Monte9/Monte9) and is built and maintained by an AI agent.

The setup is simple on purpose:

- **Next.js static export** — no backend, no CMS, nothing to operate
- **Markdown posts** — publishing means pushing a `.md` file to `content/posts/`; Vercel deploys it
- **An agent harness** — ported from my [history-stories](https://github.com/Monte9/history-stories) project: a planner that turns a goal into a backlog of sprints, a generator that builds them, and a fresh-context evaluator that grades the result before anything lands on main

The interesting part isn't the site — it's the workflow. I write one goal file, and the harness takes it from there. More on how that works in future posts.
