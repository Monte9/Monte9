# Learn tab — "fresh coat of paint" interaction & 3D plan

Date: 2026-06-29 (UTC)
Scope: the Learn feed at site root `/` (`src/components/learn/LearnFeed.tsx`).
Method: built + served production, drove a full mock session (`/?mock=1`) at 390x844
(primary) and 1280x900 across light/dark/sunset with Playwright. All six card types
(quiz, trivia, news, flashcard, thisday, bigq), the complete screen, topic toggle,
new-set, and a correct + incorrect quiz answer were exercised. Zero console/page
errors, no horizontal overflow at 390px, no broken images. Evidence screenshots are
under `agent/evals/shots/` (referenced inline below).

This is a critique + buildable plan. No feature code was written.

---

## 1. Critique — where it reads flat today

The feed is functionally complete and tasteful, and theming is fully token-driven
across all three themes (`31-card-dark.png`, `30-complete-sunset.png`). The problem
is that *nothing moves and nothing rewards*. Every state change is an instant DOM
swap. Specific, screenshot-grounded findings:

1. **Card transitions are instant.** Tapping Next replaces the card content in place
   with zero motion — no slide, no fade, no sense of a deck. There is no spatial
   model ("where did the last card go? where's the next one coming from?"). On mobile
   there is also a large block of dead space below the card
   (`07-card-quiz-initial.png`, `21-bigq-view.png`): the card is content-height inside
   a `max-w-xl` column and the bottom ~45% of the viewport is empty. That empty space
   is both a wasted canvas and a missed swipe affordance.

2. **Answer feedback is barely perceptible — and right vs. wrong feel identical.**
   On a correct answer the chosen option gets a thin `border-accent` + a small check
   icon; the explanation text just appears below (`20-quiz-answered-CORRECT.png`). On
   a wrong answer the chosen option gets a muted strikethrough + a small grey X, and
   the *correct* option lights up with the same subtle accent border
   (`41-desktop-quiz-INCORRECT.png`). There is no color of success/error (no green/red
   semantics), no scale, no bounce, no haptic-style pulse. The "moment of reward" — the
   single most important beat in a quiz app — currently has the emotional weight of
   toggling a checkbox.

3. **Reveals just appear.** "Why it matters / So what? / Reveal" swap the button for a
   left-bordered paragraph with no transition (`05-card-news-initial.png` →
   `06-news-revealed.png`; flashcard `22` → `23`). The reveal is the payoff of a
   trivia/news/thisday card and it lands with no sense of "unfolding."

4. **The flashcard ignores its own metaphor.** A flashcard is literally a card with a
   term on the front and a definition on the back, but today "Reveal" just appends the
   definition as a paragraph under the term (`22-flashcard-front.png` →
   `23-flashcard-revealed.png`). No flip. This is the single clearest place the UI
   under-delivers on what the content already promises.

5. **The streak/completion has no payoff — the come-back trigger is inert.** The
   complete screen is static text: a flame glyph, "1-day streak", "N/M correct",
   "Nice — that's your 2 minutes" (`10-complete-screen.png`). The flame never ignites,
   the streak never counts up, the score never tallies, there is no flourish. When the
   set has no quizzes the screen is even thinner — just "1-day streak" + one line
   (`30-complete-sunset.png`). Finishing should *feel* like finishing; right now it
   feels like running out of cards. The dynamic tab title ("🔥 N-day streak", "New set
   ready · Learn") is a clever external trigger, but the in-app finish gives nothing to
   anticipate.

6. **No pointer/tilt life.** Cards, options, and chips are flat rectangles with only a
   `hover:bg-surface-2` background swap. Nothing reacts to the pointer with depth, and
   the progress dots animate width via class swap with no transition.

Net: the *content* is excellent and the *bones* are clean; what's missing is motion
design and a reward loop. The fix is a coordinated pass of enter/exit choreography,
a real answer-feedback moment, one genuine 3D flip, and a celebratory finish — all
gated behind `reduceMotion` and built on the r3f setup already in the repo.

---

## 2. Prioritized plan

Priority is delight-per-effort. Each item lists: what it is, the interaction, file,
effort (S/M/L), and reduce-motion behavior.

> Shared guardrails for everything below: use CSS transforms/opacity only (no
> layout-animating properties) so there is no jank; respect `const { reduceMotion } =
> useTheme()` exactly as the rest of the app does; keep all color from theme tokens
> (`bg`, `surface`, `surface-2`, `fg`, `muted`, `accent`, `accent-contrast`,
> `border`); 3D reuses the in-file client mount guard pattern from
> `src/components/apps/Field.tsx` (`const [mounted,setMounted]=useState(false);
> useEffect(()=>setMounted(true),[])`) and `frameloop={reduceMotion?"demand":"always"}`.

### P1 — Answer feedback + correct-answer celebration (the core reward) — `LearnFeed.tsx` (`QuizView`)
- **What:** Make the grading moment land. (a) Correct option animates: a quick
  scale pop (1 → 1.04 → 1) + the check icon springs in (scale/rotate) + a brief
  accent ring pulse. (b) Incorrect chosen option does a short horizontal shake
  (~3 oscillations, ±4px, ~250ms) and the correct option then gets the same pop so
  the eye is pulled to the right answer. (c) The explanation slides+fades down
  (translateY 6px → 0, opacity 0 → 1, ~220ms) instead of appearing instantly.
- **Correct-answer celebration (tasteful):** on a correct answer, emit a small,
  one-shot **CSS particle burst** of 6–10 accent-colored dots from the chosen option
  (radial fling + fade, ~500ms, `pointer-events:none`, removed on animationend). Keep
  it monochrome-accent and small — this is a minimal site, not a slot machine.
- **Interaction:** triggered in the existing `onChoose` handler; drive via a
  `data-state="correct|incorrect"` attribute + keyframes, or a tiny
  Web Animations API call. No new deps.
- **Effort:** M.
- **Reduce-motion:** no shake, no pop, no particles. Keep the *information* changes
  (border, check/X icon, explanation) but render them instantly; optionally a 1-step
  opacity fade is acceptable but no transform.

### P2 — Card enter/exit + deck feel (swipe/slide between cards) — `LearnFeed.tsx` (card container)
- **What:** Give the stack spatial continuity. Wrap the card in a positioned
  container; on `next()` the current card exits (slide left + slight rotate + fade,
  translateX -110%, rotate -3deg, ~280ms) while the incoming card enters from the
  right/below (translateX 8% + scale 0.97 → 0, opacity 0 → 1). Render the *next* card
  as a faint stacked peek behind the current one (scale 0.96, translateY 10px, lower
  opacity) to read as a real deck and to fill some of today's dead bottom space.
- **Swipe:** on touch, allow horizontal drag of the top card (`mouse.move`/touch);
  past a threshold (~30% width or fast flick) commit to `next()`; below threshold,
  spring back. This reuses the existing `onTouchStart/Move/End` plumbing already in the
  component for pull-to-refresh — add a horizontal branch alongside the vertical one.
  Repurpose the dead vertical space as the swipe arena.
- **Direction semantics:** only forward (advance). Keep it simple — no back-swipe
  history in v1.
- **Effort:** L (state machine for in/out + drag + the peek layer is the most
  involved piece; do it after P1 so the reward already feels good).
- **Reduce-motion:** instant swap as today; the peek layer may remain static (no
  motion) or be dropped. Swipe still works as a tap-equivalent commit with no transform
  animation.

### P3 — 3D flashcard flip (term ↔ definition) — new `src/components/learn/FlashcardFlip.tsx`, used by `LearnFeed.tsx`
- **What:** The one place 3D is unquestionably right. Replace the flashcard's
  reveal-paragraph with a real flip: front = term, back = definition, "Reveal" (or a
  tap on the card) flips it 180° around the Y axis. This makes the "card" metaphor
  literal and is the highest delight-per-effort 3D win.
- **Recommended implementation:** **CSS 3D transform**, not WebGL. `perspective` on the
  wrapper, two absolutely-stacked faces with `backface-visibility:hidden`, the back
  pre-rotated 180°, and a `transform: rotateY(180deg)` toggle with a ~500ms
  ease transition. This is lighter than spinning up a Canvas for a flat card, stays
  perfectly crisp at any DPR, and themes for free via tokens. (Reserve r3f for genuinely
  volumetric things — see §"Where 3D earns its place".)
- **Interaction:** click the card body or the Reveal control to flip; the Next button
  becomes enabled once flipped (preserve the current `revealed` gating).
- **Effort:** M.
- **Reduce-motion:** no rotation — cross-fade the two faces in place (opacity swap),
  or simply show front+back stacked as today's paragraph reveal. Same end state.

### P4 — Streak + session-complete payoff (the come-back trigger) — `LearnFeed.tsx` (complete branch)
- **What:** Make finishing feel earned. On entering the complete phase, sequence a
  short choreography: (1) the flame icon "ignites" (scale + a warm flicker, accent
  tint) and the streak number **counts up** from the previous value to the new one
  (~600ms, ease-out); (2) the score "N/M correct" tallies in with a brief per-correct
  tick; (3) a small one-shot **3D confetti/ember flourish** behind the streak number
  (see §3D). When the streak actually *increments* (vs. same-day revisit, which the
  code already distinguishes in `bumpStreak`), make the flourish bigger — reward the
  return, not the repeat.
- **Copy/affordance:** keep "New set" prominent. Consider a subtle pulsing ring on the
  flame on milestone streaks (3/7/30) — purely token-accent, optional.
- **When there are no quizzes,** still give the finish a beat (flame ignite + a single
  "set complete" flourish) so the thin variant (`30-complete-sunset.png`) isn't empty.
- **Effort:** M (count-up + ignite are S; the 3D flourish adds the M).
- **Reduce-motion:** no count-up (show the final numbers immediately), no flicker, no
  confetti. The flame can do a single static accent state; everything else instant.

### P5 — Reveal-the-"why" motion (trivia / news / thisday) — `LearnFeed.tsx` (those branches)
- **What:** Unify the reveal across the non-flashcard reveal types. When "Why it
  matters / So what?" is tapped, the button morphs out and the explanation **wipes/grows
  in**: the left accent bar draws downward (scaleY 0 → 1, ~200ms) and the text
  fades+slides (translateY 6px → 0). Cheap, consistent, and makes the payoff feel like
  it's *unfolding* rather than popping.
- **Effort:** S.
- **Reduce-motion:** instant appearance (as today).

### P6 — Pointer/tilt micro-interactions — `LearnFeed.tsx` (card + option + chip styles)
- **What:** Add restrained life. (a) Subtle **tilt-on-pointer** for the main card on
  pointer-capable devices: track pointer over the card and apply a small
  `rotateX/rotateY` (±4–5deg max) with a soft sheen — a 2.5D effect, *not* WebGL. (b)
  Options/chips get a quick scale (1.02) + shadow lift on hover and a press-down
  (scale 0.98) on active. (c) Progress dots animate their width with a transition
  (today they snap). (d) The pull-to-refresh indicator gets a rotating arrow as it
  approaches threshold.
- **Effort:** S–M.
- **Reduce-motion:** disable tilt entirely (no transform on pointer move); keep only
  the existing color hover. Press-scale dropped.

---

## Where 3D genuinely adds delight vs. where it'd be gratuitous

**Use 3D (yes):**
- **Flashcard flip (P3).** The content *is* a two-sided card; a flip is the honest
  representation. Highest payoff. Do it with **CSS 3D** (lighter than r3f for a flat
  card).
- **Complete-screen flourish (P4).** A small, one-shot celebratory moment is exactly
  where a tasteful r3f flourish belongs — it's a destination, not a per-card cost.
  **Reuse the existing r3f setup** (`Canvas`, mount guard, theme palette via
  `GLOBE_COLORS`/`THEME_SWATCHES` exactly as `Field.tsx` does): a brief burst of
  accent-tinted instanced particles ("embers" off the flame, on-brand with the streak
  metaphor) that settles in ~1.2s, then the Canvas unmounts or goes
  `frameloop="demand"`. Keep instance count modest (≤200) and DPR capped at 2.
- **Card tilt (P6a)** is "2.5D" via CSS transforms — counts as tasteful depth without a
  WebGL context. Recommended over a real 3D card.

**Do NOT 3D-ify (gratuitous):**
- The card stack / per-card transitions. A WebGL deck would be a permanent GPU context
  for what CSS transforms do perfectly; it would also fight the text crispness and
  theme tokens. Keep P2 in CSS.
- Quiz options, the answer-feedback burst, the reveal wipe. These are micro-moments;
  particles via CSS are plenty and a Canvas per card is wasteful.
- News/trivia/bigq bodies. These are reading surfaces — depth would hurt legibility and
  the minimal brand.
- Don't add an always-on 3D background to the feed. The site is minimal and
  text-forward; a persistent shader (à la the Field app) would compete with reading and
  cost battery. 3D should be a *reward beat*, not ambient.

---

## 3. Recommended phased sequence

Build for biggest delight-per-effort first, and so each phase ships independently.

- **Phase 1 (the reward core):** P1 answer feedback + correct celebration, then P5
  reveal motion. Smallest surface, biggest perceived change — the app immediately
  *feels* responsive and rewarding. (M + S)
- **Phase 2 (the signature 3D win):** P3 flashcard flip. Self-contained new component,
  clear "wow," low blast radius. (M)
- **Phase 3 (the come-back trigger):** P4 complete-screen payoff — count-up + ignite
  first (CSS), then add the r3f ember flourish. This is the retention beat, so it's
  worth doing well, but it depends on nothing else. (M)
- **Phase 4 (deck feel):** P2 card enter/exit + swipe. Highest effort and most
  state-machine risk; do it last when the reward and 3D wins are already banked. (L)
- **Phase 5 (polish):** P6 tilt + micro-interactions and progress-dot transitions.
  Sprinkle that ties it together. (S–M)

### Perf / accessibility guardrails (apply to every phase)
- **60fps:** animate only `transform`/`opacity` (and `filter` sparingly); never animate
  width/height/top/left/margin. The progress-dot width change should move to a
  transform-based approach or accept a `transition` on a non-reflowing property.
- **Reduce-motion:** every animated beat must have an instant/cross-fade fallback gated
  on `useTheme().reduceMotion` — already the repo convention. No transform should fire
  when it's true. Verify by toggling reduce-motion in Settings and re-walking a session.
- **No layout jank:** reserve space for revealed content (e.g. min-heights) so reveals
  and flips don't shove the Next button; the card container should not resize abruptly
  mid-animation. Today's content-height card is fine but the swipe/peek layer must use
  absolute positioning so the deck doesn't push page layout.
- **Mobile-first:** primary target is 390x844. Confirm no horizontal overflow
  (`scrollWidth <= innerWidth`) after adding off-canvas exit transforms — clip the deck
  arena with `overflow-hidden` so an exiting card sliding to translateX -110% never
  creates a scrollbar. Keep touch targets ≥44px.
- **WebGL hygiene (P4 only):** client mount guard (no SSR), `frameloop="demand"` or
  unmount after the one-shot, `dpr={[1,2]}`, dispose materials/geometries on unmount
  (mirror `Field.tsx`), and a non-WebGL fallback (the count-up + ignite alone) if the
  Canvas can't mount. The flourish must never block the New-set button.
- **A11y:** keep all interactive elements as real `<button>`s with current
  `disabled`/`aria-pressed` semantics; ensure focus states survive the new transforms;
  particles/confetti are `aria-hidden` and `pointer-events:none`.
