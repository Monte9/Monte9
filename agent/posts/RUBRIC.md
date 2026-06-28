# RUBRIC — the post evaluator's taste

Ported from stuck-problems-agent's evaluator philosophy: a **fresh-eyes
pass/fail** on each draft. The post pipeline drafts 2–3 candidates per run and
this rubric picks the single best (or no-ships if none pass the floor). It
self-improves: append a dated Lesson after each run.

These posts auto-publish under Monte's name with an "AI-generated" badge, so the
bar that matters most is **don't publish something false or hollow.**

## Hard gate (any failure = disqualified)
- **Grounded.** Every non-obvious factual/numeric claim is supported by a real,
  checkable source (link or named report). No invented statistics, no fabricated
  citations. When unsure, the draft hedges or omits — it does not assert.
- **Coherent & complete in one read.** Has an abstract/lede, a clear finding or
  two, and a concrete recommendation or takeaway. Not a stub, not a stream of
  bullets.
- **Honest.** States its limitations / what it couldn't verify (a short caveat).
- **Clean.** No broken markdown, no placeholder text, renders without overflow.

## Scoring dimensions (each 1–10; sum to rank passers)
1. **Insight** — a non-obvious finding, framing, or recommendation. "Where the
   next dollar should go" beats "here is a summary of topic X."
2. **Grounding quality** — not just present but good sources, honest numbers, a
   reproducible-feeling method.
3. **Clarity & structure** — abstract → findings → recommendation; tight prose.
4. **Topical fit** — an "important but stalled" problem worth Monte's audience's
   attention (see IDEAS domains).
5. **Voice & restraint** — confident, plain, no AI-slop padding or hedging-everywhere.

## Topics
Reuse the stuck-problems-agent domains (public health, healthcare delivery,
climate/environment, energy/grid, oceans/fisheries, space debris, child safety,
evidence/trials, immigration/labor). The ideator picks from `IDEAS.md`, dedups
against what's shipped, and may scout an adjacent new "stalled problem."

## Depth expectation
Single-run posts are **solid but lighter** than the old multi-day reports
(~800–1,500 words is fine). Right topic + grounded + a real recommendation beats
length. Depth is a dial (more research budget) we can raise later.

## Lessons (append-only; newest at top)

2026-06-28: First single-run batch (3 drafts, all on contamination-resistant AI eval). All three passed the hard gate and grounding was genuinely strong -- verified by resolving every arXiv ID to a real paper with an exact title match and spot-checking load-bearing numbers against primary pages (GAO, IFP, MLCommons, paper abstracts). Lessons for future runs: (1) Future-dated arXiv IDs (e.g. 25xx/26xx) are NOT a fabrication tell -- arXiv uses YYMM numbering, so check them, don't reject them; all such IDs here resolved. (2) Verify the title, not just that the URL 200s -- a real URL can host a different paper. (3) Bot-walled fetches (403/empty from Fortune, The Register, Cloudflare-fronted blogs) are access failures, not falsification; only fail a claim if it is BOTH unverifiable AND single-sourced. The drafts here correctly hedged stats that rest on secondary blogs (e.g. 80.9%/45.9% via DigitalApplied) -- reward that honesty rather than penalizing the secondary source. (4) When a batch is mono-thematic, pick the ONE with the tightest math->evidence->recommendation spine and a concrete real-world anchor; rank survey-shaped "menu of levers" drafts below a draft that commits to a prioritized "first dollar." Ship only the winner when topics overlap heavily.

_(No single-run posts yet. The 11 migrated reports are the deep back-catalogue
this pipeline succeeds.)_
