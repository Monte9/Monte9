# Labs Auto — the autonomous prototype routine

An hourly loop that **generates 3 web-dev prototypes, judges them with evolving
taste, and ships exactly 1** to `/labs` on montethakkar.com. It compounds: every
run reads what came before so it never repeats itself and the judge gets sharper
over time.

## The loop (one iteration)

```
Ideate ──▶ Build ──▶ Verify ──▶ Judge ──▶ Ship
  3 new     3 in       pnpm      pick 1     keep winner, drop losers,
  concepts  parallel   build +   on taste   append registry, update memory,
            agents     screenshot           build green, commit + push main
```

Orchestrated by `.claude/workflows/labs-auto.js` (invoked via the
`labs-auto` skill). Runs on `main` so the winner deploys.

## Memory — everything is plain markdown so any agent (or human) can grep it

| File | Role | Who writes it |
|------|------|---------------|
| `JOURNAL.md` | Append-only log of every run: the 3 candidates, scores, the verdict + rationale, what shipped. The system's episodic memory. | Ship stage |
| `TASTE.md` | The judge's living rubric — aesthetic principles, refined after each run. The system's learned judgement. | Judge stage |
| `IDEAS.md` | Ledger of every concept ever tried (shipped / rejected) — the dedupe source so ideation never repeats. | Ship stage |
| `src/data/labs.ts` | The live registry the site renders. Canonical "what shipped." | Ship stage |
| `runs/<ts>/` | Per-run screenshots of the 3 candidates (judge's evidence). | Verify stage |

### How to search the memory

```bash
grep -ri "shader"      agent/labs/IDEAS.md      # was this idea tried?
grep -rn "winner:"     agent/labs/JOURNAL.md    # everything shipped, in order
grep -rn "## Run"      agent/labs/JOURNAL.md     # run-by-run history
sed -n '1,40p'         agent/labs/TASTE.md       # current judging principles
```

## Hard rules (keep the live site safe)

1. **Green-gate.** Never commit/push unless `pnpm build` (static export) exits 0.
   A round that can't produce a green build ships *nothing* and logs a no-ship.
2. **Isolation.** Each prototype is a self-contained `/labs/<slug>` page +
   its own component(s). Never edit shared files except the single registry
   append (`src/data/labs.ts`) done by the ship stage. So a weak prototype can
   never break the rest of the site.
3. **Ship exactly one** per run. Losers' files are removed before commit.
4. **No new dependencies.** Only what's already installed (react, next, three,
   @react-three/fiber, @react-three/drei, lucide-react).
5. **Don't touch `README.md`** (the repo profile readme) or unrelated routes.

## Operating it

- Manual run: invoke the `labs-auto` skill (or `Workflow({name:'labs-auto'})`).
- Hourly (durable): the GitHub Actions schedule in
  `.github/workflows/labs-hourly.yml` (needs the `ANTHROPIC_API_KEY` repo secret).
- Hourly (this session only): a `CronCreate` durable job — dies when the
  container is reclaimed; the Action is the real 24/7 path.

To pause: disable the Action workflow (or delete the cron job). To stop a bad
streak: nothing live ever breaks (green-gate + isolation), but you can revert
any shipped `/labs/<slug>` by deleting its files + registry line.
