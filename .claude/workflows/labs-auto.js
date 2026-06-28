export const meta = {
  name: 'labs-auto',
  description: 'Generate 3 web-dev prototypes, judge with evolving taste, ship 1 to /labs on main',
  whenToUse: 'The hourly autonomous Labs routine. Builds 3 candidates, a taste-driven judge picks 1, ships it to /labs and pushes main (green-gated).',
  phases: [
    { title: 'Ideate', detail: '3 distinct new concepts, deduped against memory' },
    { title: 'Build', detail: 'one builder agent per concept, in parallel' },
    { title: 'Verify', detail: 'pnpm build green + screenshot each candidate' },
    { title: 'Judge', detail: 'taste-driven scoring, pick exactly 1 winner' },
    { title: 'Ship', detail: 'keep winner, drop losers, update memory, commit + push main' },
  ],
}

// ---- Schemas -------------------------------------------------------------

const IDEATE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    concepts: {
      type: 'array', minItems: 3, maxItems: 3,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          slug: { type: 'string', description: 'kebab-case, unique, NOT present in IDEAS.md' },
          title: { type: 'string' },
          componentName: { type: 'string', description: 'PascalCase, unique' },
          pitch: { type: 'string', description: '1-2 sentence blurb for the registry' },
          technique: { type: 'string', description: 'the web-dev technique it shows off' },
          personalAngle: { type: 'string', description: 'how it connects to Monte specifically' },
          tags: { type: 'array', items: { type: 'string' }, minItems: 1 },
        },
        required: ['slug', 'title', 'componentName', 'pitch', 'technique', 'personalAngle', 'tags'],
      },
    },
  },
  required: ['concepts'],
}

const BUILD_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    slug: { type: 'string' },
    ok: { type: 'boolean', description: 'true if files written and tsc-clean by your reading' },
    files: { type: 'array', items: { type: 'string' }, description: 'absolute paths you created' },
    notes: { type: 'string' },
  },
  required: ['slug', 'ok', 'files', 'notes'],
}

const VERIFY_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    green: { type: 'boolean', description: 'pnpm build exited 0 with the kept candidates' },
    builtSlugs: { type: 'array', items: { type: 'string' }, description: 'slugs that survived in the green build' },
    brokenSlugs: { type: 'array', items: { type: 'string' }, description: 'slugs removed because they broke the build' },
    runDir: { type: 'string', description: 'agent/labs/runs/<ts> where screenshots live' },
    shots: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        properties: { slug: { type: 'string' }, light: { type: 'string' }, dark: { type: 'string' } },
        required: ['slug', 'light', 'dark'],
      },
    },
    notes: { type: 'string' },
  },
  required: ['green', 'builtSlugs', 'brokenSlugs', 'runDir', 'shots', 'notes'],
}

const JUDGE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    scores: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        properties: { slug: { type: 'string' }, score: { type: 'number' }, notes: { type: 'string' } },
        required: ['slug', 'score', 'notes'],
      },
    },
    winner: { type: 'string', description: 'must be one of builtSlugs' },
    rationale: { type: 'string', description: 'one paragraph: why winner beat the others' },
    tasteLesson: { type: 'string', description: 'a dated Lesson block to prepend to TASTE.md (markdown)' },
    registry: {
      type: 'object', additionalProperties: false,
      description: 'the registry entry for the winner',
      properties: {
        title: { type: 'string' }, blurb: { type: 'string' }, tags: { type: 'array', items: { type: 'string' } },
      },
      required: ['title', 'blurb', 'tags'],
    },
  },
  required: ['scores', 'winner', 'rationale', 'tasteLesson', 'registry'],
}

const SHIP_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    shipped: { type: ['string', 'null'], description: 'winner slug if shipped, else null' },
    commit: { type: ['string', 'null'] },
    pushed: { type: 'boolean' },
    notes: { type: 'string' },
  },
  required: ['shipped', 'commit', 'pushed', 'notes'],
}

// ---- Shared builder contract --------------------------------------------

const BUILDER_RULES = `
STRICT CONSTRAINTS (other builder agents edit this repo concurrently):
- CREATE ONLY: src/app/labs/<slug>/page.tsx, src/components/labs/<ComponentName>.tsx,
  and optionally src/data/<slug>.ts. Do NOT modify ANY existing file. Do NOT touch
  the registry (src/data/labs.ts), nav, layout, globals.css, package.json, or other
  experiments' files.
- Use ONLY installed deps: react, next, three, @react-three/fiber, @react-three/drei,
  lucide-react. NO new dependencies.
- Do NOT run pnpm build / pnpm dev (concurrent builds clobber). Verify by careful
  reading + 'npx tsc --noEmit' ONLY IF no other agent is mid-build (skip if unsure).
- Static-export safe (output:"export"): page.tsx is a SERVER component with
  'export const metadata = { title: "<Title>" }' and renders the component directly.
  Next 16 FORBIDS dynamic(ssr:false) in a server component — instead the component
  is 'use client' and guards WebGL/window with an in-file mount guard:
    const [mounted,setMounted]=useState(false); useEffect(()=>setMounted(true),[]);
    ... {mounted ? <Canvas/> : <div className="...text-muted">Loading…</div>}
  Study src/components/labs/Field.tsx (mount-guard) and JourneyGlobe.tsx as the
  canonical patterns; src/components/globe-utils.ts has latLngToVec3 +
  buildBorderPositions (IMPORT, never modify) if you need a globe.
- Theme-aware: useTheme() from @/components/ThemeProvider gives { theme, reduceMotion }.
  Globe/3D colors from GLOBE_COLORS[theme] / THEME_SWATCHES[theme] in @/lib/theme.
  UI uses semantic tokens ONLY: text-fg, text-muted, text-accent, bg-bg, bg-surface,
  bg-surface-2, border-border. Must look right in light/dark/sunset.
- reduceMotion: freeze/quiet animation and don't auto-spin when true.
- Three.js notes: THREE.Earcut does NOT exist here — use THREE.ShapeUtils.triangulateShape.
  No window/document at module scope. Dispose materials/geometries on unmount.
- Full-bleed stage (if the piece wants the viewport): wrap in
  '<div className="relative -mx-5 -mt-10 -mb-28 h-[calc(100svh-8.5rem)] sm:-mb-12 sm:h-[calc(100svh-4.5rem)]">'.
- No horizontal overflow at 390px. Strict TypeScript. Tasteful and finished, not a
  raw demo — this ships to a personal-site gallery and is judged on craft.
`

// ---- Pipeline ------------------------------------------------------------

phase('Ideate')
log('Reading memory and generating 3 distinct concepts…')

const idea = await agent(
  `You are the IDEATOR for montethakkar.com's autonomous Labs routine (repo /home/user/Monte9).
Propose exactly 3 DISTINCT, fresh web-dev prototype concepts for /labs.

First, READ these for memory + taste (use the Read tool):
- agent/labs/IDEAS.md  (every concept already tried — DO NOT repeat any; pick genuinely new techniques)
- agent/labs/JOURNAL.md (past runs)
- agent/labs/TASTE.md  (what the judge rewards — aim for high scores there)
- src/data/labs.ts     (what is currently shipped)
Also skim src/components/labs/ to see the house style.

Then propose 3 concepts that:
- are each a self-contained /labs/<slug> page buildable with the installed deps only
  (react, next, three, @react-three/fiber, @react-three/drei, lucide-react),
- are DIFFERENT from each other (different technique/feel) and from everything in IDEAS.md,
- are personalized to Monte where possible (India→US arc, travel, web3/Curio, AI/Rosebud,
  building agentically, open-source) — TASTE rewards personalization,
- push web-dev craft and would make someone screenshot them,
- avoid: another generic fullscreen noise shader, another plain globe (unless a truly new interaction).

Return the 3 concepts via the structured schema. slugs must be kebab-case and not in IDEAS.md.`,
  { schema: IDEATE_SCHEMA, phase: 'Ideate', label: 'ideate' }
)

const concepts = idea.concepts
log(`Concepts: ${concepts.map((c) => c.slug).join(', ')}`)

phase('Build')
const builds = await parallel(
  concepts.map((c) => () =>
    agent(
      `You are a BUILDER for montethakkar.com's Labs routine (repo /home/user/Monte9).
Build EXACTLY this one prototype as a finished, tasteful /labs page:

  slug: ${c.slug}
  title: ${c.title}
  component: src/components/labs/${c.componentName}.tsx  (PascalCase, 'use client')
  page: src/app/labs/${c.slug}/page.tsx  (server component with metadata)
  pitch: ${c.pitch}
  technique: ${c.technique}
  personal angle: ${c.personalAngle}

${BUILDER_RULES}

Make it genuinely good — it will be screenshotted and judged against the others on
craft, novelty, personalization, wow-factor, performance, and fit. Return the files
you created and an honest 'ok'.`,
      { schema: BUILD_SCHEMA, phase: 'Build', label: `build:${c.slug}` }
    )
  )
)

const built = builds.filter(Boolean)
const attempted = concepts.map((c) => ({
  slug: c.slug,
  componentName: c.componentName,
  files: (built.find((b) => b.slug === c.slug) || {}).files || [],
}))
log(`Builders done: ${built.map((b) => `${b.slug}(${b.ok ? 'ok' : 'shaky'})`).join(', ')}`)

phase('Verify')
const verify = await agent(
  `You are the VERIFIER for montethakkar.com's Labs routine (repo /home/user/Monte9).
Three builder agents just created candidate /labs pages. Candidates (slug + files):
${JSON.stringify(attempted, null, 2)}

Do this carefully with Bash:
1. cd /home/user/Monte9 && rm -rf .next out && pnpm build  (timeout ~300s).
2. If the build FAILS, read the error, identify which candidate slug's file(s) caused
   it, DELETE that candidate's files (its src/app/labs/<slug>/ dir and its component
   src/components/labs/<ComponentName>.tsx and any src/data/<slug>.ts it added), and
   rebuild. Repeat until the build is GREEN or no candidates remain. Track which slugs
   you removed (brokenSlugs) and which survived (builtSlugs).
3. Once green, serve the export and screenshot each surviving candidate:
   - ts=$(date -u +%Y%m%d-%H%M%S); mkdir -p agent/labs/runs/$ts   (this is runDir)
   - cd out && (python3 -m http.server 4137 >/dev/null 2>&1 &) ; sleep 1 ; cd ..
   - For each built slug and theme in light,dark: write a small Playwright .cjs
     (in the run dir or scratch) that sets localStorage 'theme', goes to
     http://localhost:4137/labs/<slug>/ at 1280x900, waits ~1500ms for WebGL/scroll,
     for scroll-driven pieces scrolls the inner '[class*=overflow-y-auto]' or window,
     moves the mouse across the viewport for pointer-reactive pieces, then screenshots
     to agent/labs/runs/$ts/<slug>-<theme>.png. Run with the project's Playwright:
     in the managed container use 'PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers
     NODE_PATH=/opt/node22/lib/node_modules node <script>.cjs'; on a CI runner where
     those paths are absent, run 'npx playwright install chromium' first then 'node
     <script>.cjs'. Screenshots are best-effort: if they fail, set shots:[] and note
     it — the judge will fall back to reading code.
   - Capture console/page errors; note any in 'notes'. Kill the server: lsof -ti tcp:4137 | xargs -r kill
4. Return green, builtSlugs, brokenSlugs, runDir, and shots (absolute or repo-relative
   png paths per slug). If green is false / no candidates survived, return green=false
   with empty builtSlugs.`,
  { schema: VERIFY_SCHEMA, phase: 'Verify', label: 'verify' }
)

if (!verify.green || verify.builtSlugs.length === 0) {
  log('No green build — shipping nothing this round.')
  phase('Ship')
  const noship = await agent(
    `You are the SHIP/LOG agent for the Labs routine (repo /home/user/Monte9). This round
produced NO green build, so ship NOTHING. Record it so the routine learns:
- Prepend a run block to agent/labs/JOURNAL.md with: timestamp ($(date -u '+%Y-%m-%d %H:%M')),
  candidates ${JSON.stringify(concepts.map((c) => c.slug))}, brokenSlugs ${JSON.stringify(verify.brokenSlugs)},
  winner: none, and a 'no-ship:' reason from: ${JSON.stringify(verify.notes)}.
- Append the 3 concepts to agent/labs/IDEAS.md as status 'rejected' with this run.
- Ensure NO stray candidate files remain: git status; remove any untracked files under
  src/app/labs/ and src/components/labs/ that are NOT a shipped experiment.
- rm -rf .next out ; cd /home/user/Monte9 && pnpm build must still be green for the existing site.
- git add -A && git commit -m "labs-auto: no-ship round (no green candidate)" and push main
  (git push origin HEAD:main; retry up to 4x with backoff on network error).
Return shipped=null.`,
    { schema: SHIP_SCHEMA, phase: 'Ship', label: 'no-ship' }
  )
  return { idea, verify, verdict: null, ship: noship }
}

phase('Judge')
const verdict = await agent(
  `You are the JUDGE for montethakkar.com's Labs routine (repo /home/user/Monte9). You have
TASTE and you refine it over time. Pick EXACTLY ONE winner from the candidates.

1. READ agent/labs/TASTE.md fully — apply its dimensions and principles.
2. For each built candidate ${JSON.stringify(verify.builtSlugs)}, LOOK at its screenshots
   (use the Read tool on the PNG paths) and skim its component code in
   src/components/labs/. Screenshots for this run are in ${verify.runDir}:
   ${JSON.stringify(verify.shots, null, 2)}
3. Score each candidate (sum the TASTE dimensions, 1-10 each), pick the single best
   'winner' (must be one of builtSlugs), and write a one-paragraph 'rationale'.
4. Write 'tasteLesson': a dated markdown block to prepend under "## Lessons" in TASTE.md,
   following the template there (candidates, winner+why, losers+why, one refinement).
   Genuinely refine the taste — this is how the judge gets sharper.
5. Provide the 'registry' entry for the winner (title, blurb ≈ the pitch, tags) for the
   live /labs list.
Be decisive and have a point of view. Reward craft + novelty + personalization.`,
  { schema: JUDGE_SCHEMA, agentType: 'evaluator', phase: 'Judge', label: 'judge' }
)
log(`Judge picked: ${verdict.winner}`)

phase('Ship')
const losers = verify.builtSlugs.filter((s) => s !== verdict.winner)
const loserFiles = attempted
  .filter((a) => losers.includes(a.slug))
  .map((a) => ({ slug: a.slug, componentName: a.componentName, files: a.files }))
const winnerConcept = concepts.find((c) => c.slug === verdict.winner)

const ship = await agent(
  `You are the SHIP agent for montethakkar.com's Labs routine (repo /home/user/Monte9).
The judge picked winner='${verdict.winner}'. Ship EXACTLY this one to /labs on main.

1. REMOVE the losing candidates entirely (files + dirs):
   losers: ${JSON.stringify(loserFiles, null, 2)}
   For each loser: rm -rf src/app/labs/<slug> ; rm -f its component(s) ; rm -f src/data/<slug>.ts if it added one.
   Then 'git status' and remove ANY other untracked stray under src/app/labs or src/components/labs
   that is not the winner or an already-shipped experiment.
2. ADD the winner to the live registry src/data/labs.ts — append ONE object to the
   LAB_EXPERIMENTS array (keep existing entries; place the new one first or last):
     { slug: "${verdict.winner}", title: ${JSON.stringify(verdict.registry.title)},
       blurb: ${JSON.stringify(verdict.registry.blurb)},
       date: "<today: $(date -u +%F)>", tags: ${JSON.stringify(verdict.registry.tags)} }
   Match the existing object style; tags should reuse existing tags where sensible.
3. UPDATE memory (all in agent/labs/):
   - JOURNAL.md: prepend a run block (see its format) with timestamp ($(date -u '+%Y-%m-%d %H:%M')),
     candidates ${JSON.stringify(concepts.map((c) => c.slug))}, the judge scores
     ${JSON.stringify(verdict.scores)}, winner '${verdict.winner}', the rationale, and the dropped slugs.
   - IDEAS.md: add all 3 concepts as table rows — winner status 'shipped', others 'rejected'.
   - TASTE.md: prepend this Lesson under "## Lessons":
${verdict.tasteLesson}
4. GREEN-GATE: rm -rf .next out && pnpm build (timeout 300s) MUST exit 0 with the winner
   wired into the registry. If it is NOT green, try to fix the winner; if still broken,
   ABORT the ship: revert the winner too (remove its files + registry line), record a
   'no-ship: winner failed final build' in JOURNAL.md, and return shipped=null.
5. COMMIT + PUSH main: git add -A ;
   git commit -m "labs-auto: ship ${verdict.winner} to /labs" ;
   git push origin HEAD:main  (retry up to 4x with 2/4/8/16s backoff on network errors).
   Capture the commit sha.
Return shipped (winner slug or null), commit sha, pushed bool, and notes.`,
  { schema: SHIP_SCHEMA, phase: 'Ship', label: `ship:${verdict.winner}` }
)

log(ship.shipped ? `Shipped ${ship.shipped} (${ship.pushed ? 'pushed' : 'NOT pushed'})` : 'Shipped nothing')
return { idea, verify, verdict, ship }
