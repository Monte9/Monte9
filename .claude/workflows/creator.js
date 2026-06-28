export const meta = {
  name: 'creator',
  description: 'Route to the most interesting next thing — an /apps experiment or a /posts research note — and ship it to main',
  whenToUse: 'The unified autonomous routine for montethakkar.com. A router picks app vs post by editorial taste, then the matching pipeline builds 3 candidates, picks 1, and ships it (green/grounding-gated).',
  phases: [
    { title: 'Route', detail: 'pick app vs post by editorial taste (DIRECTION.md)' },
    { title: 'Ideate', detail: '3 candidates of the chosen kind' },
    { title: 'Make', detail: 'apps: build 3 in parallel · posts: draft 3 with web research' },
    { title: 'Judge', detail: 'apps: visual TASTE · posts: grounding RUBRIC — pick 1' },
    { title: 'Ship', detail: 'finalize winner, update memory, commit + push main' },
  ],
}

// ===================== Schemas =====================

const ROUTER_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    kind: { type: 'string', enum: ['app', 'post'] },
    direction: { type: 'string', description: 'the concrete winning direction/pitch to pursue' },
    slate: { type: 'string', description: 'the 2 app + 2 post pitches considered with their scores (for the journal)' },
    rationale: { type: 'string', description: 'why this kind+direction won the slate (incl. balance)' },
  },
  required: ['kind', 'direction', 'slate', 'rationale'],
}

const APP_IDEATE_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    concepts: {
      type: 'array', minItems: 3, maxItems: 3,
      items: {
        type: 'object', additionalProperties: false,
        properties: {
          slug: { type: 'string' }, title: { type: 'string' }, componentName: { type: 'string' },
          pitch: { type: 'string' }, technique: { type: 'string' }, personalAngle: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' }, minItems: 1 },
        },
        required: ['slug', 'title', 'componentName', 'pitch', 'technique', 'personalAngle', 'tags'],
      },
    },
  },
  required: ['concepts'],
}

const APP_BUILD_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    slug: { type: 'string' }, ok: { type: 'boolean' },
    files: { type: 'array', items: { type: 'string' } },
    motif: { type: 'string', description: 'theme-agnostic SVG inner markup (viewBox 0 0 32 32, currentColor + class="text-muted") hinting at the piece, for the card thumbnail' },
    notes: { type: 'string' },
  },
  required: ['slug', 'ok', 'files', 'motif', 'notes'],
}

const APP_VERIFY_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    green: { type: 'boolean' }, builtSlugs: { type: 'array', items: { type: 'string' } },
    brokenSlugs: { type: 'array', items: { type: 'string' } }, runDir: { type: 'string' },
    shots: { type: 'array', items: { type: 'object', additionalProperties: false,
      properties: { slug: { type: 'string' }, light: { type: 'string' }, dark: { type: 'string' } },
      required: ['slug', 'light', 'dark'] } },
    notes: { type: 'string' },
  },
  required: ['green', 'builtSlugs', 'brokenSlugs', 'runDir', 'shots', 'notes'],
}

const APP_JUDGE_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    scores: { type: 'array', items: { type: 'object', additionalProperties: false,
      properties: { slug: { type: 'string' }, score: { type: 'number' }, notes: { type: 'string' } },
      required: ['slug', 'score', 'notes'] } },
    winner: { type: 'string' }, rationale: { type: 'string' }, tasteLesson: { type: 'string' },
    registry: { type: 'object', additionalProperties: false,
      properties: { title: { type: 'string' }, blurb: { type: 'string' }, tags: { type: 'array', items: { type: 'string' } } },
      required: ['title', 'blurb', 'tags'] },
  },
  required: ['scores', 'winner', 'rationale', 'tasteLesson', 'registry'],
}

const POST_IDEATE_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    topics: {
      type: 'array', minItems: 3, maxItems: 3,
      items: {
        type: 'object', additionalProperties: false,
        properties: {
          slug: { type: 'string', description: 'kebab-case, NOT in agent/posts/IDEAS.md' },
          title: { type: 'string', description: 'a sharp, decision-oriented title' },
          angle: { type: 'string', description: 'the non-obvious question / where-the-next-dollar-goes framing' },
          tags: { type: 'array', items: { type: 'string' }, minItems: 1 },
        },
        required: ['slug', 'title', 'angle', 'tags'],
      },
    },
  },
  required: ['topics'],
}

const POST_DRAFT_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    slug: { type: 'string' }, ok: { type: 'boolean', description: 'true if a complete grounded draft was written' },
    file: { type: 'string' }, words: { type: 'number' }, sources: { type: 'number', description: 'count of real cited sources' },
    notes: { type: 'string' },
  },
  required: ['slug', 'ok', 'file', 'words', 'sources', 'notes'],
}

const POST_JUDGE_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    scores: { type: 'array', items: { type: 'object', additionalProperties: false,
      properties: { slug: { type: 'string' }, score: { type: 'number' }, pass: { type: 'boolean' }, notes: { type: 'string' } },
      required: ['slug', 'score', 'pass', 'notes'] } },
    winner: { type: ['string', 'null'], description: 'best passing draft, or null if none pass the grounding floor' },
    rationale: { type: 'string' }, ruleLesson: { type: 'string', description: 'a dated Lesson to prepend to agent/posts/RUBRIC.md' },
    registry: { type: 'object', additionalProperties: false,
      properties: { title: { type: 'string' }, description: { type: 'string' }, tags: { type: 'array', items: { type: 'string' } } },
      required: ['title', 'description', 'tags'] },
  },
  required: ['scores', 'winner', 'rationale', 'ruleLesson', 'registry'],
}

const SHIP_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    shipped: { type: ['string', 'null'] }, kind: { type: ['string', 'null'] },
    commit: { type: ['string', 'null'] }, pushed: { type: 'boolean' }, notes: { type: 'string' },
  },
  required: ['shipped', 'kind', 'commit', 'pushed', 'notes'],
}

// ===================== Shared app builder contract =====================

const BUILDER_RULES = `
STRICT CONSTRAINTS (other builder agents edit this repo concurrently):
- CREATE ONLY: src/app/apps/<slug>/page.tsx, src/components/apps/<ComponentName>.tsx,
  and optionally src/data/<slug>.ts. Do NOT modify ANY existing file (not the registry
  src/data/apps.ts, nav, layout, globals.css, package.json, or other experiments).
- Use ONLY installed deps: react, next, three, @react-three/fiber, @react-three/drei,
  lucide-react. NO new dependencies. Do NOT run pnpm build/dev (concurrent clobber).
- Static-export safe: page.tsx is a SERVER component with metadata; the component is
  'use client' with an in-file mount guard (const [m,setM]=useState(false);
  useEffect(()=>setM(true),[]); {m ? <Canvas/> : <div className="...text-muted">Loading…</div>}).
  Study src/components/apps/Field.tsx + JourneyGlobe.tsx; src/components/globe-utils.ts
  has latLngToVec3 + buildBorderPositions (import, never modify).
- Theme-aware: useTheme() from @/components/ThemeProvider ({ theme, reduceMotion });
  GLOBE_COLORS/THEME_SWATCHES from @/lib/theme; UI uses semantic tokens only (text-fg,
  text-muted, text-accent, bg-bg, bg-surface, bg-surface-2, border-border). Light/dark/sunset.
- reduceMotion freezes/quiets motion. THREE.Earcut does NOT exist (use
  THREE.ShapeUtils.triangulateShape). No window at module scope; dispose on unmount.
- Strong STATIC FIRST FRAME (the gallery thumbnail + first paint are stills). No 390px
  overflow. Strict TS. Tasteful and finished — judged on craft/novelty/fun/wow.
- Also emit a 'motif': theme-agnostic SVG INNER markup (viewBox 0 0 32 32) hinting at the
  piece, using stroke/fill="currentColor" for the primary and className="text-muted" for
  secondary strokes — no <svg> wrapper, just the inner shapes. It becomes the card thumbnail.
`

// ===================== Route =====================

phase('Route')
log('Routing: app vs post…')
const route = await agent(
  `You are the ROUTER (editor-in-chief) for montethakkar.com's autonomous Creator routine (repo /home/user/Monte9).
Decide the SINGLE most interesting thing to make THIS run: an /apps experiment OR a /posts research note.

READ (Read tool): agent/creator/DIRECTION.md (your routing rubric — apply it), agent/creator/JOURNAL.md,
agent/apps/IDEAS.md + agent/apps/JOURNAL.md, agent/posts/IDEAS.md + agent/posts/JOURNAL.md,
src/data/apps.ts, and 'ls content/posts' (to gauge the post count). Assess BALANCE: what has
shipped recently, and which kind is under-represented.

Build a small cross-kind slate (~2 app + 2 post pitches), score each 1-10 on the DIRECTION
dimensions (novelty, interestingness/payoff, balance, timeliness, feasibility-in-one-run),
and pick the top. Return: kind ('app'|'post'), the winning 'direction' (a concrete pitch to
pursue), 'slate' (the options + scores, one line), and 'rationale'.`,
  { schema: ROUTER_SCHEMA, phase: 'Route', label: 'route' }
)
log(`Route → ${route.kind}: ${route.direction}`)

let result

// ===================== APP BRANCH =====================
if (route.kind === 'app') {
  phase('Ideate')
  const idea = await agent(
    `You are the APP IDEATOR for montethakkar.com's Creator (repo /home/user/Monte9).
The router chose to build an /apps experiment in this direction: "${route.direction}".
READ agent/apps/IDEAS.md (DO NOT repeat any), agent/apps/TASTE.md (aim high), src/data/apps.ts, and
skim src/components/apps/. Propose 3 DISTINCT concepts in the spirit of the direction (or sharper):
self-contained /apps/<slug> pages, installed deps only, each a different technique/feel, prioritizing
fun + novel technique + a strong static first frame. At least one purely-creative (personalAngle "n/a").
slugs kebab-case, not in IDEAS.md.`,
    { schema: APP_IDEATE_SCHEMA, phase: 'Ideate', label: 'app-ideate' }
  )
  const concepts = idea.concepts
  log(`App concepts: ${concepts.map((c) => c.slug).join(', ')}`)

  phase('Make')
  const builds = await parallel(concepts.map((c) => () =>
    agent(
      `You are an APP BUILDER for the Creator (repo /home/user/Monte9). Build EXACTLY this one /apps piece:
  slug: ${c.slug}
  title: ${c.title}
  component: src/components/apps/${c.componentName}.tsx ('use client')
  page: src/app/apps/${c.slug}/page.tsx (server component with metadata)
  pitch: ${c.pitch}
  technique: ${c.technique}
  personal angle: ${c.personalAngle}
${BUILDER_RULES}
Make it genuinely good — judged on craft, novelty, fun, wow, performance, fit. Return files, an honest 'ok', and the 'motif'.`,
      { schema: APP_BUILD_SCHEMA, phase: 'Make', label: `build:${c.slug}` }
    )
  ))
  const built = builds.filter(Boolean)
  const attempted = concepts.map((c) => {
    const b = built.find((x) => x.slug === c.slug) || {}
    return { slug: c.slug, componentName: c.componentName, files: b.files || [], motif: b.motif || '' }
  })

  phase('Judge')
  const verify = await agent(
    `You are the VERIFIER for the Creator (repo /home/user/Monte9). Candidate /apps pages just built:
${JSON.stringify(attempted.map(({ slug, componentName, files }) => ({ slug, componentName, files })), null, 2)}
1. cd /home/user/Monte9 && rm -rf .next out && pnpm build (timeout 300s).
2. If it FAILS, find the offending slug, delete its files (src/app/apps/<slug>/, its component, any src/data/<slug>.ts), rebuild; repeat until green or none left. Track brokenSlugs/builtSlugs.
3. Once green: ts=$(date -u +%Y%m%d-%H%M%S); mkdir -p agent/apps/runs/$ts (runDir). cd out && (python3 -m http.server 4137 >/dev/null 2>&1 &); sleep 1; cd .. . For each built slug + theme light,dark write a Playwright .cjs that sets localStorage theme, visits http://localhost:4137/apps/<slug>/ at 1280x900, waits ~1500ms, moves the mouse across + scrolls, screenshots agent/apps/runs/$ts/<slug>-<theme>.png. Run with PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers NODE_PATH=/opt/node22/lib/node_modules node <script>.cjs (or 'npx playwright install chromium' first on CI). Capture console/page errors. Kill: lsof -ti tcp:4137 | xargs -r kill. Screenshots are best-effort (shots:[] if they fail).
Return green, builtSlugs, brokenSlugs, runDir, shots, notes.`,
    { schema: APP_VERIFY_SCHEMA, phase: 'Judge', label: 'verify' }
  )

  if (!verify.green || verify.builtSlugs.length === 0) {
    phase('Ship')
    const noship = await agent(
      `SHIP/LOG agent (repo /home/user/Monte9). No green app build this run — ship NOTHING. Remove any untracked stray files under src/app/apps + src/components/apps that are not shipped experiments. Prepend a no-ship entry to agent/apps/JOURNAL.md and agent/creator/JOURNAL.md (timestamp $(date -u '+%Y-%m-%d %H:%M'), candidates ${JSON.stringify(concepts.map((c) => c.slug))}, reason from ${JSON.stringify(verify.notes)}). Add the 3 concepts to agent/apps/IDEAS.md as 'rejected'. rm -rf .next out && pnpm build must be green for the existing site. git add -A && git commit -m "creator: no-ship app round" && git push origin HEAD:main (retry x4 backoff). Return shipped=null, kind="app".`,
      { schema: SHIP_SCHEMA, phase: 'Ship', label: 'no-ship' }
    )
    return { route, branch: 'app', verify, ship: noship }
  }

  const verdict = await agent(
    `You are the APP JUDGE for the Creator (repo /home/user/Monte9). Pick EXACTLY ONE winner from ${JSON.stringify(verify.builtSlugs)}.
READ agent/apps/TASTE.md and apply it. LOOK at each candidate's screenshots (Read tool on the PNGs in ${verify.runDir}: ${JSON.stringify(verify.shots)}) and skim its component. Score each (sum TASTE dims 1-10), pick 'winner', write a one-paragraph 'rationale', a dated 'tasteLesson' to prepend under "## Lessons" in agent/apps/TASTE.md, and the 'registry' (title, blurb≈pitch, tags). Reward craft+novelty+fun+strong static first frame; personalization is a bonus.`,
    { schema: APP_JUDGE_SCHEMA, agentType: 'evaluator', phase: 'Judge', label: 'app-judge' }
  )
  log(`App winner: ${verdict.winner}`)

  phase('Ship')
  const losers = verify.builtSlugs.filter((s) => s !== verdict.winner)
  const loserFiles = attempted.filter((a) => losers.includes(a.slug))
  const winMotif = (attempted.find((a) => a.slug === verdict.winner) || {}).motif || ''
  const ship = await agent(
    `You are the SHIP agent for the Creator (repo /home/user/Monte9). Winner='${verdict.winner}'. Ship exactly this /apps piece to main.
1. REMOVE losers entirely: ${JSON.stringify(loserFiles)} (rm -rf each slug's src/app/apps/<slug>, its component(s), any src/data/<slug>.ts). Then git status and remove any other untracked stray under src/app/apps or src/components/apps that isn't the winner or an existing experiment.
2. APPEND ONE object to APP_EXPERIMENTS in src/data/apps.ts (place LAST):
   { slug: "${verdict.winner}", title: ${JSON.stringify(verdict.registry.title)}, blurb: ${JSON.stringify(verdict.registry.blurb)}, date: "<now: $(date -u +%FT%H:%M)>", tags: ${JSON.stringify(verdict.registry.tags)}, motif: ${JSON.stringify(winMotif)} }
   date MUST be full ISO date-time so it sorts to the top. Keep the motif string intact (it's SVG inner markup). Match existing style.
3. MEMORY: prepend run blocks to agent/apps/JOURNAL.md (candidates, scores ${JSON.stringify(verdict.scores)}, winner, rationale, dropped) and agent/creator/JOURNAL.md (slate ${JSON.stringify(route.slate)}, chosen: app — winner, outcome). Add the 3 concepts to agent/apps/IDEAS.md (winner 'shipped', others 'rejected'). Prepend this to agent/apps/TASTE.md "## Lessons": ${JSON.stringify(verdict.tasteLesson)}. Append a one-line lesson to agent/creator/DIRECTION.md "## Lessons".
4. GREEN-GATE: rm -rf .next out && pnpm build must exit 0 with the winner wired in. If not green, try to fix; if still broken, ABORT (revert winner + registry line), log no-ship, return shipped=null.
5. git add -A && git commit -m "creator: ship app ${verdict.winner} to /apps" && git push origin HEAD:main (retry x4 backoff). Return shipped, kind="app", commit, pushed, notes.`,
    { schema: SHIP_SCHEMA, phase: 'Ship', label: `ship:${verdict.winner}` }
  )
  result = { route, branch: 'app', verdict, ship }

// ===================== POST BRANCH =====================
} else {
  phase('Ideate')
  const idea = await agent(
    `You are the POST IDEATOR for montethakkar.com's Creator (repo /home/user/Monte9).
The router chose to write a /posts research note in this direction: "${route.direction}".
READ agent/posts/IDEAS.md (DO NOT repeat shipped slugs; you MAY develop a 'proposed' one or scout an adjacent
stalled problem), agent/posts/RUBRIC.md (the bar), and 'ls content/posts'. Propose 3 DISTINCT topics in the
spirit of the direction — each an "important but stalled" problem with a sharp, decision-oriented angle
("where should the next dollar/regulatory move go"), not a survey. slugs kebab-case, not already in content/posts.`,
    { schema: POST_IDEATE_SCHEMA, phase: 'Ideate', label: 'post-ideate' }
  )
  const topics = idea.topics
  log(`Post topics: ${topics.map((t) => t.slug).join(', ')}`)

  phase('Make')
  const drafts = await parallel(topics.map((t) => () =>
    agent(
      `You are a POST WRITER for the Creator (repo /home/user/Monte9). Research and write ONE complete, GROUNDED post.
  slug: ${t.slug}
  title: ${t.title}
  angle: ${t.angle}
  tags: ${JSON.stringify(t.tags)}
DO REAL RESEARCH: use web search/fetch (load via ToolSearch: WebSearch, WebFetch) to ground every non-obvious
factual/numeric claim in a real, checkable source. NEVER invent statistics or citations — if you can't verify, hedge or omit.
Write content/posts/${t.slug}.md with YAML frontmatter:
  ---
  title: "<title>"
  date: "$(date -u +%FT%H:%M)"
  description: "<1-sentence dek>"
  tags: [${t.tags.map((x) => '"' + x + '"').join(', ')}]
  aiGenerated: true
  ---
Then the body (~800-1500 words, markdown): a short abstract/lede, 2-4 findings, a concrete recommendation/takeaway,
a brief "Limitations" caveat, and a "Sources" list of the real links you used. Plain confident prose, no AI-slop padding.
Tables are fine (they scroll on mobile). Do NOT touch any other file. Return slug, ok, file path, word count, source count, notes.`,
      { schema: POST_DRAFT_SCHEMA, phase: 'Make', label: `draft:${t.slug}` }
    )
  ))
  const drafted = drafts.filter(Boolean).filter((d) => d.ok)
  log(`Drafted: ${drafted.map((d) => `${d.slug}(${d.words}w,${d.sources}src)`).join(', ')}`)

  phase('Judge')
  const verdict = await agent(
    `You are the POST EVALUATOR for the Creator (repo /home/user/Monte9). Apply agent/posts/RUBRIC.md (READ it).
Candidate drafts (read each file): ${JSON.stringify(drafted.map((d) => ({ slug: d.slug, file: d.file })), null, 2)}
For EACH: check the hard gate (grounded with real sources, coherent+complete, honest limitations, clean) — any failure => pass:false.
Score passers on the rubric dimensions (sum 1-10 each). Pick the best PASSING draft as 'winner' (or null if none pass the floor).
Return scores [{slug,score,pass,notes}], winner, rationale, a dated 'ruleLesson' to prepend to agent/posts/RUBRIC.md "## Lessons",
and the winner's 'registry' (title, description, tags). Be strict: do not publish something false or hollow under Monte's name.`,
    { schema: POST_JUDGE_SCHEMA, agentType: 'evaluator', phase: 'Judge', label: 'post-judge' }
  )
  log(`Post winner: ${verdict.winner ?? 'none (no-ship)'}`)

  phase('Ship')
  const allSlugs = topics.map((t) => t.slug)
  const ship = await agent(
    `You are the SHIP agent for the Creator (repo /home/user/Monte9). Post evaluation done. Winner=${JSON.stringify(verdict.winner)}.
All candidate slugs: ${JSON.stringify(allSlugs)} (drafts at content/posts/<slug>.md).
${verdict.winner
  ? `1. KEEP content/posts/${verdict.winner}.md. Ensure its frontmatter has title ${JSON.stringify(verdict.registry.title)}, a full ISO date-time ($(date -u +%FT%H:%M)) so it sorts to the top, description ${JSON.stringify(verdict.registry.description)}, tags ${JSON.stringify(verdict.registry.tags)}, aiGenerated: true. DELETE the other candidates' content/posts/*.md.
2. MEMORY: prepend a run block to agent/posts/JOURNAL.md (candidates, scores ${JSON.stringify(verdict.scores)}, winner, rationale) and agent/creator/JOURNAL.md (slate ${JSON.stringify(route.slate)}, chosen: post — winner, outcome). Add the 3 topics to agent/posts/IDEAS.md (winner 'shipped', others 'rejected'). Prepend ${JSON.stringify(verdict.ruleLesson)} to agent/posts/RUBRIC.md "## Lessons". Append a one-line lesson to agent/creator/DIRECTION.md "## Lessons".
3. GREEN-GATE: rm -rf .next out && pnpm build must exit 0 (valid frontmatter, renders). Fix the winner if needed; if still broken, ABORT (delete the winner md too), log no-ship, return shipped=null.
4. git add -A && git commit -m "creator: publish post ${verdict.winner}" && git push origin HEAD:main (retry x4 backoff). Return shipped="${verdict.winner}", kind="post", commit, pushed, notes.`
  : `1. NO winner passed the grounding floor — publish NOTHING. DELETE all candidate drafts: ${JSON.stringify(allSlugs)} (rm content/posts/<slug>.md).
2. Prepend a no-ship entry to agent/posts/JOURNAL.md and agent/creator/JOURNAL.md (timestamp, candidates, reason: no draft passed the rubric). Add the 3 topics to agent/posts/IDEAS.md as 'rejected'.
3. rm -rf .next out && pnpm build must be green. git add -A && git commit -m "creator: no-ship post round" && git push origin HEAD:main (retry x4 backoff). Return shipped=null, kind="post".`}`,
    { schema: SHIP_SCHEMA, phase: 'Ship', label: verdict.winner ? `publish:${verdict.winner}` : 'no-ship' }
  )
  result = { route, branch: 'post', verdict, ship }
}

log(result.ship.shipped ? `Shipped ${result.branch}: ${result.ship.shipped}` : `No-ship (${result.branch})`)
return result
