# TASTE — the judge's living rubric

This is the aesthetic and judgement the Labs judge applies when picking the 1
winner from 3 candidates. It is **not frozen**: after every run the judge appends
a dated "Lesson" and may revise the principles below. Read top-to-bottom before
scoring; the Principles are the current distilled taste, the Lessons are the raw
history that produced them.

> Whoever judges: score each candidate 1–10 on the dimensions, sum, and pick the
> top. Break ties with Principle #1 (taste > correctness). Then write a Lesson:
> what separated winner from losers, and one refinement to this file.

## Scoring dimensions (each 1–10)

1. **Craft & polish** — does it look intentional and finished, not a tech demo?
   Typography, spacing, motion easing, color harmony with the theme tokens.
2. **Novelty & technique** — is the *idea* fresh versus everything in `IDEAS.md`,
   AND does it push a web-dev technique (shaders, GPU particles, WebGL/WebGPU,
   canvas physics, generative art, audio-reactive, clever CSS)? Reskins score low.
3. **Fun & delight** — is it genuinely *fun to play with*? Does it surprise you,
   invite a second interaction, make you smile? This is the heart of Labs — the
   abstract `field` shader is the model. Would Monte enjoy poking at it?
4. **"Wow" / shareability** — strong **static first frame** (the Labs list, social
   previews, and first paint are all stills, so motion-only beauty is a discount,
   not a bonus) AND would someone screenshot it in the first 2 seconds.
5. **Performance & robustness** — 60fps-feel, no console errors, no 390px
   overflow, clean teardown, respects reduce-motion. The DQ gate includes errors
   triggered by the candidate's **own advertised affordances** (preset chips,
   demo buttons, default prompts) — click every preset/CTA at least once.
6. **Fit & spark** — does it belong in a tasteful Labs gallery (not gimmicky) and
   strengthen the "I build cool, interactive things" story?

**Personalization bonus (optional, up to +5 total):** if a piece connects to Monte
(India→US arc, travel, web3/Curio, AI/Rosebud, building agentically, open source),
add up to +5. It is a *bonus, never a requirement* — a purely creative, boundary-
pushing piece with no personal angle can and should win on dimensions 1–6 alone.

## Principles (current taste — refine over time)

- **P1. Taste beats correctness.** A slightly rougher idea with a stronger
  concept beats a flawless boring one. But anything with console errors or
  overflow is disqualified regardless.
- **P2. Restraint reads as quality.** One striking idea executed cleanly > three
  effects fighting each other. Prefer a limited palette (the theme tokens) and
  purposeful motion over maximalism.
- **P3. Interaction earns its place.** If it reacts to the user (pointer,
  scroll, input), the reaction must feel immediate and meaningful — not noise.
- **P4. Fun & boundary-pushing first; personal is a bonus.** The goal is
  delightful, experimental web-dev that's fun to play with (à la `field`). Don't
  make everything autobiographical — variety wins, and at least one candidate per
  run should be a purely creative experiment. Personalization adds points but is
  never the deciding factor on its own.
- **P5. Motion must respect reduce-motion** and never trap the main thread.
- **P6. It must survive the green-gate.** Beautiful but broken ships nothing.

## Lessons (append-only; newest at top)

<!-- Each run appends one block here. Template:
### YYYY-MM-DD-HH (run N)
- Candidates: <slug A>, <slug B>, <slug C>
- Winner: <slug> — why it won in one sentence.
- Losers: why each fell short (one line each).
- Refinement: one concrete update to the dimensions/principles above.
-->

### 2026-06-28-03 (run 3)
- Candidates: string-theory, murmuration, ascii-engine
- Winner: ascii-engine — the only candidate that wins on *both* novelty-of-technique (a real Three.js scene rendered to an offscreen render target, read back, and re-typed as monospace glyphs through a hand-rolled luminance ramp) AND the strongest static first frame (a fully-detailed torus-knot rendered in living text — instant 'that's all TEXT?' wow), with no weak dimension.
- Losers: string-theory — beautiful modal-string + additive-Web-Audio craft and the gallery's first audio piece, but its static first frame is a near-empty harp that only sings once you pluck; it walked straight into the cold-start trap run 2 flagged, and lost ~5 points purely on the still. murmuration — excellent boids engineering (counting-sort spatial hash, GPU instancing, allocation-free loop) with a genuinely pattern-rich first frame, but 'a flock of little arrows' is a familiar demo silhouette, so it scored a notch lower on novelty-of-technique and on first-frame surprise.
- Refinement: introduce an explicit tiebreak hierarchy when craft and robustness are near-equal across strong candidates (which is now the norm — every piece this run was a real from-scratch engine). When two pieces are close, rank by: (1) does the STILL frame trigger a 'how is that even done?' double-take, not merely 'that looks nice' — surprise-of-technique visible in a static image beats familiar-concept-executed-well; (2) does the interaction invite a *second distinct* action (ascii-engine: swap form, swap ramp, orbit, pause — four different pokes; vs. one repeated gesture); (3) only then fall back to depth-of-engineering. Corollary to the audio/sim cold-start rule: an interaction-gated piece (audio that needs a gesture, a string that needs a pluck) is judged on its UN-interacted frame for the Wow dimension, because that is the frame the gallery ships — so such pieces must bake visible life (a pre-rung string, a resting ripple, a glow) into frame 0 or accept a hard Wow discount. 'Delightful to play' never rescues 'boring to look at' for a gallery whose front door is a grid of stills.

### 2026-06-28-02 (run 2)
- Candidates: liquid-chrome, rope-type, gray-scott
- Winner: rope-type — a from-scratch 2D Verlet/Jakobsen physics rig that spells MONTE in glowing beads you can grab, fling, and cut; it wins because it has the highest fun ceiling AND the strongest legible static first frame, with no weak dimension.
- Losers: liquid-chrome — the most beautiful still frame and a real 3D-raymarch flex, but the interaction (move-to-dent, tap-shockwave) is subtle and passive, so it reads slightly screensaver-y and loses on Fun. gray-scott — technically the most advanced piece in the gallery (true ping-pong GPU FBO reaction-diffusion), but DISCOUNTED hard: both static first frames are essentially EMPTY because the seed blobs are too faint/undeveloped at capture, so the Labs thumbnail and first paint show a blank panel and it fails the 2-second wow test despite gorgeous motion.
- Refinement: add a sub-rule to Dimension 4 (Wow/static first frame): a stateful/simulation piece (reaction-diffusion, particle life, cellular automata, anything that "warms up") MUST seed a visibly-developed, pattern-rich initial state — not a faint or blank field that only becomes interesting after the user works for it or after seconds of evolution. A cold-start canvas is the simulation equivalent of run-1's "faint dot smudge": the right fix is to bake in a few hundred pre-rolled steps (or a denser, higher-contrast seed) so the very first painted frame already shows the characteristic pattern. When judging such pieces, mentally (or literally) check what frame 0 looks like, because that is the frame the gallery, OG image, and first paint all ship.

### 2026-06-28 — Owner directive (taste rebalanced)
Monte loves `field` and wants Labs to lean into **pure creative, fun, boundary-
pushing interactive web-dev — not just autobiographical pieces**. Acted on it:
"Personalization" is no longer a core scoring dimension (it's now an optional
≤+5 bonus); added **"Fun & delight"** as a core dimension; ideation must now
include at least one purely-creative concept per run with no personal angle.
Goal restated: push the boundaries of web dev and be genuinely fun to play with.

### 2026-06-28-01 (run 1)
- Candidates: commit-constellation, boarding-pass, latent-space
- Winner: boarding-pass — the most finished, most shareable, unmistakably-Monte artifact, and it passes the green-gate clean (verified drag-to-tear advances legs, Story flip works, zero errors/overflow, no WebGL so it's cheap on a phone).
- Losers: commit-constellation — technically the most ambitious (GPU-instanced shader galaxy from real commit eras, all interactions verified) but its *static first frame* reads as a faint dot smudge, so it loses the 2-second wow test even though it shines in motion. latent-space — elegant Rosebud-embeddings concept, but DISQUALIFIED: two of its own six showcased prompt chips ('building something new', 'missing home') throw uncaught IndexSizeError from createRadialGradient because a fade-in `age` is clamped with only Math.min(1, x) and never Math.max(0, …), so a redraw earlier than a fresh particle's birth makes the radius negative.
- Refinement: sharpen two existing dimensions rather than add a new one. (1) For "Wow / shareability", judge the **static first frame explicitly** — if a piece only impresses once it's moving, it loses points, because the Labs list, social previews, and the first paint are all still frames; motion-only beauty is a discount, not a bonus. (2) For "Performance & robustness", the DQ gate now explicitly includes errors triggered by the candidate's **own advertised affordances** (preset chips, demo buttons, default prompts), not just exotic edge cases — and the judge must click every preset/CTA at least once, because that is exactly the path a first-time visitor takes. A failure pattern to grep for next time: `Math.min(1, …)` used for a 0..1 ramp without a matching lower clamp, which can feed negative radii/sizes into canvas/WebGL calls.
