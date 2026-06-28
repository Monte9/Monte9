# JOURNAL — every Labs Auto run, append-only

Episodic memory of the routine. Newest run at the top. Each run records the 3
candidates, the judge's scores + rationale, and what shipped. `grep` this before
ideating so you never repeat a concept, and to see the trajectory of taste.

Format per run:

```
## Run N — YYYY-MM-DD HH:MM
- candidates: slug-a, slug-b, slug-c
- scores: slug-a=NN, slug-b=NN, slug-c=NN
- winner: slug-x
- rationale: one paragraph — why x beat the others.
- shipped: src/app/labs/slug-x/ (+ component) — commit <sha>
- dropped: slug-y, slug-z (files removed)
- no-ship: <reason> (only if nothing shipped this round)
```

---

<!-- Runs are prepended below this line. -->

## Run 1 — 2026-06-28 01:24
- candidates: commit-constellation, boarding-pass, latent-space
- scores: boarding-pass=50, commit-constellation=45, latent-space=30
- winner: boarding-pass
- rationale: Boarding-pass is the most finished and most shareable artifact of the three, and unmistakably Monte: his real immigration-and-career arc (BLR→SFO at 18, Pillow→Expedia, Vrbo→Curio, founding-engineer at Rosebud) rendered as a tactile stack of airline tickets you drag to tear off and tap to flip. Craft is high — accent stripe, guilloche wash, canvas barcode + perforation, notch cutouts, magnetic-stripe back, and a spring drag that feels like paper — and it reads in 2 seconds for a screenshot. It uses CSS-3D + canvas (no WebGL), so it stays cheap on a phone, idles at 0 frames, honors reduce-motion, and unmounts clean. Commit-constellation was technically the most ambitious (a GPU-instanced shader galaxy built from real commit eras, all interactions verified) but its static first frame reads as a faint dot smudge, costing it the 2-second wow test. Latent-space was DISQUALIFIED under P1/P6: two of its own six showcased prompt chips ("building something new", "missing home") throw an uncaught IndexSizeError from createRadialGradient because a fade-in `age` is clamped with only Math.min(1, x) and never Math.max(0, …), feeding a negative radius into canvas. Verified boarding-pass live: drag tore the RB→MT leg, Story flip works, dots track, zero errors, overflow 0.
- shipped: src/app/labs/boarding-pass/ (+ src/components/labs/BoardingPass.tsx, src/data/boarding-pass.ts) — commit 5e36df0
- dropped: commit-constellation, latent-space (files removed)


