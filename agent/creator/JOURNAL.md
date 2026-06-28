# JOURNAL — Creator routing decisions, append-only

The spine of the unified routine: one entry per run recording the routing
decision (the cross-kind slate, scores, the chosen kind + pitch) and the
outcome. Per-kind execution detail lives in `agent/apps/JOURNAL.md` (app runs)
and `agent/posts/JOURNAL.md` (post runs). Newest at top.

Format:

```
## Run N — YYYY-MM-DD HH:MM
- slate: app:<pitch> (NN), app:<pitch> (NN), post:<pitch> (NN), post:<pitch> (NN)
- chosen: <kind> — <pitch> (why it won the slate)
- outcome: shipped <slug> (commit <sha>)  |  no-ship: <reason>
```

---

<!-- Runs are prepended below this line. -->

## Run 1 — 2026-06-28
- slate: app:contribution-terrain — real GitHub contribution graph extruded into a draggable 3D heightmap (novelty 7, interest 7, balance 2, timely 5, feasibility 7) = 28; app:glyph-flow-field-portrait — curl-noise particle advection resolving into a monogram (5, 7, 2, 5, 8) = 27; post:ai-benchmark-deployment-gap — benchmark scores vs real deployment reliability, where the next eval dollar goes (8, 8, 9, 9, 8) = 42; post:zombie-trials-evidence-base — retracted/failed clinical trials still cited in guidelines + a cleanup fix (7, 7, 9, 6, 7) = 36.
- chosen: post — ai-benchmark-deployment-gap (42) won the slate: highest on interestingness, balance (post-leaning to correct an app-heavy recent history), timeliness, and feasibility; the two app pitches scored low on balance and novelty.
- outcome: shipped agent-reliability-tax (post pipeline drafted 3 candidates under the deployment-gap theme; agent-reliability-tax won the per-kind rubric at 44).
