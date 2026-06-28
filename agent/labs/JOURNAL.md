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

## Run 3 — 2026-06-28 03:13
- candidates: string-theory, murmuration, ascii-engine
- scores: ascii-engine=52, murmuration=46, string-theory=42
- winner: ascii-engine
- rationale: ascii-engine is the only candidate that wins on *both* novelty-of-technique and the strongest static first frame, with no weak dimension. Craft 9 (gamma lift to spread the density ramp, luminance-scaled phosphor alpha, scanlines+vignette baked into every repaint incl. the frozen frame, dpr-crisp 2D canvas, clean GL dispose, dirty/idle gating so a paused or reduced-motion scene costs nothing). Novelty 9 — the freshest *technique* in the gallery: a real lit Three.js scene rendered to an offscreen WebGLRenderTarget sized 1 texel-per-cell, read back with gl.readRenderTargetPixels, then re-typed as monospace glyphs; nothing else here is a render-to-text rasterizer. Fun 8 — swap Knot/MT forms, toggle ASCII/Blocks ramps live, drag to orbit, pause. Static first frame 9 — a full, detailed torus-knot silhouette in living blue glyphs is the single most screenshot-able still of the three and answers "wait, that's all TEXT?" in under 2s. Perf 8, Fit 9 (terminal/agentic aesthetic, and the extruded "MT" monogram is a tasteful personal nod that earns the bonus without being autobiographical). murmuration (46) was genuinely strong engineering — from-scratch Reynolds boids with a uniform spatial hash via counting-sort, allocation-free hot loop, fixed-step integration, GPU-instanced cones, demand frameloop, and a primed frame 0 — with a dense, pattern-rich wheeling-flock first frame, but "a flock of little arrows" reads as a familiar demo silhouette, so it lost a notch on novelty-of-technique and first-frame surprise. string-theory (42) was the most musically real piece — a modal standing-wave string sim whose visual harmonics and additive Web Audio voices are the same numbers, the gallery's first audio-reactive lab — but its static first frame is a near-empty harp of faint vertical lines with zero ripple until you pluck, walking straight into the cold-start trap run 2 flagged; it lost ~5 points purely on the still.
- shipped: src/app/labs/ascii-engine/ (+ src/components/labs/AsciiEngine.tsx) — commit <sha>
- dropped: string-theory, murmuration (files removed)

## Run 2 — 2026-06-28 02:32
- candidates: liquid-chrome, rope-type, gray-scott
- scores: rope-type=53, liquid-chrome=49, gray-scott=42
- winner: rope-type
- rationale: Rope-type wins on the strongest fun ceiling AND the strongest legible static first frame, with no weak dimension. Craft 9: glowing beads on a custom 5x7 stroke font read as a finished neon-sign artifact, not a demo; theme palettes track light/dark/sunset; controls are tidy. Novelty 9: a from-scratch 2D Verlet integrator with Jakobsen constraint relaxation, arc-length resampling, and flood-fill attachment recompute on cut — real physics, no WebGL, distinct from everything in the gallery. Fun 10: grab-and-fling plus scissors-cut (strands actually detach and fall) is the most tactile, second-interaction-inviting piece here. Wow 9: the static first frame literally spells MONTE in glowing beads — instantly legible and screenshot-worthy at first paint, exactly what the Labs list/social previews show. Perf/robust 8: no WebGL keeps phones cheap, reduce-motion holds the legible pose, clean teardown of RAF/observers/listeners; three CTAs (Grab/Cut/Reset) plus phrase toggle all wire to real handlers. Fit 8 + personalization bonus: spells MONTE and hides 'MADE BY AGENTS' behind the Konami code. Liquid-chrome (49) was the most beautiful still frame and a real 3D-raymarch flex (metaballs + smooth-min + gyroid + tap shockwaves, filmic tone-mapping, Fresnel rim), but its interaction (move-to-dent, tap-shockwave) is subtle and passive, so it reads slightly screensaver-y and loses on Fun. Gray-scott (42) was technically the most advanced piece — true ping-pong GPU FBO reaction-diffusion with a 9-point Laplacian and 16 substeps/frame across five F/K presets — but DISCOUNTED hard: both static first frames are essentially EMPTY because the 7 seed blobs are too faint/undeveloped at capture, so the Labs thumbnail and first paint show a blank panel and it fails the 2-second wow test despite gorgeous motion.
- shipped: src/app/labs/rope-type/ (+ src/components/labs/RopeType.tsx) — commit d978190
- dropped: liquid-chrome, gray-scott (files removed)

## Run 1 — 2026-06-28 01:24
- candidates: commit-constellation, boarding-pass, latent-space
- scores: boarding-pass=50, commit-constellation=45, latent-space=30
- winner: boarding-pass
- rationale: Boarding-pass is the most finished and most shareable artifact of the three, and unmistakably Monte: his real immigration-and-career arc (BLR→SFO at 18, Pillow→Expedia, Vrbo→Curio, founding-engineer at Rosebud) rendered as a tactile stack of airline tickets you drag to tear off and tap to flip. Craft is high — accent stripe, guilloche wash, canvas barcode + perforation, notch cutouts, magnetic-stripe back, and a spring drag that feels like paper — and it reads in 2 seconds for a screenshot. It uses CSS-3D + canvas (no WebGL), so it stays cheap on a phone, idles at 0 frames, honors reduce-motion, and unmounts clean. Commit-constellation was technically the most ambitious (a GPU-instanced shader galaxy built from real commit eras, all interactions verified) but its static first frame reads as a faint dot smudge, costing it the 2-second wow test. Latent-space was DISQUALIFIED under P1/P6: two of its own six showcased prompt chips ("building something new", "missing home") throw an uncaught IndexSizeError from createRadialGradient because a fade-in `age` is clamped with only Math.min(1, x) and never Math.max(0, …), feeding a negative radius into canvas. Verified boarding-pass live: drag tore the RB→MT leg, Story flip works, dots track, zero errors, overflow 0.
- shipped: src/app/labs/boarding-pass/ (+ src/components/labs/BoardingPass.tsx, src/data/boarding-pass.ts) — commit 5e36df0
- dropped: commit-constellation, latent-space (files removed)


