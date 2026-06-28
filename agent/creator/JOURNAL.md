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

_(No runs yet.)_
