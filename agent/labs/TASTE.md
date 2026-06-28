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
