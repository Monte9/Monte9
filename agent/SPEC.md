# SPEC — /travel interactive 3D globe

Derived from `agent/GOAL.md`. This is the product spec for the new `/travel`
route: an animated, interactive 3D globe (Three.js) that plots the seven
countries Monte has visited, each with a pin. Concrete enough that two builders
would build roughly the same thing. `agent/GOAL.md` is the north star and is
read-only.

## 1. Goals and non-goals

**Goals**

- A new route at `/travel`, linked from the site header nav next to Posts /
  About / Resume.
- A 3D Earth globe that auto-rotates on load, can be dragged to spin, and shows
  a pin at the approximate lat/long of each visited country.
- Hover or click a pin reveals that country's name and visit date.
- Visited countries stored as structured data so adding a destination is a
  one-line change.
- Works at desktop and mobile widths; no horizontal overflow at 390px.

**Non-goals**

- No backend, no runtime API calls, no per-country detail pages, no photos.
- No travel destinations beyond the seven in GOAL.md (do not invent any).
- No changes to `README.md` (the GitHub profile page).
- No globe on any page other than `/travel`.

## 2. Architecture constraints (the hard ground rules)

The existing site is Next.js App Router with `output: "export"` (see
`next.config.ts`: `output: "export"`, `trailingSlash: true`), Tailwind 4,
system fonts, a centered `max-w-2xl` column, accent color `--accent: #2563eb`
(`text-blue-600`). All pages are statically prerendered at build time; there is
no server at runtime.

- **The globe must not break static export.** WebGL/Three.js cannot run during
  the Node prerender. Therefore:
  - The globe lives in a `'use client'` component.
  - The `/travel` page (a server component) renders it via
    `next/dynamic` with `{ ssr: false }`, so the heavy WebGL code is never
    imported during `next build`.
  - A lightweight placeholder (sized box, e.g. "Loading globe…") is shown
    while the dynamic chunk loads and during SSR fallback, so layout is stable
    and there is no flash of zero-height content.
- **`pnpm build` must stay green on every sprint.** Each sprint is shippable on
  its own.
- **Vendor assets/data, never hot-link.** Any geometry data or texture is
  committed into the repo (see Data, below). No external fetch at runtime.
- **Nav lives in `src/app/layout.tsx`.** The Travel link is added there once and
  appears on every page. Order: Posts, Travel, About, Resume (Travel sits next
  to Posts/About per GOAL).

## 3. Tech approach

- **Renderer:** Three.js via `@react-three/fiber` (R3F) — the idiomatic React
  wrapper — plus `@react-three/drei` for `OrbitControls` (drag-to-rotate +
  `autoRotate`). Raw `three` is acceptable but R3F is preferred for fit with the
  React codebase. These install from the npm registry via pnpm.
- **Auto-rotation + pause-on-interact:** `OrbitControls` with `autoRotate
  enabled` and a slow `autoRotateSpeed`. While the user drags, auto-rotation
  pauses (driven by OrbitControls' `start`/`end` events toggling `autoRotate`);
  it resumes shortly after the interaction ends. Drag rotates the camera around
  the globe; zoom may be disabled or clamped to keep the composition stable.
- **Earth surface — primary approach (vector globe):** vendor the
  `world-atlas` package's `countries-110m.json` (a small ~100KB TopoJSON) into
  the repo (e.g. `src/data/` or `public/`), convert with `topojson-client`
  (`feature`/`mesh`) at module load on the client, and draw country borders as
  thin line geometry mapped onto the sphere (lat/long → 3D via a shared
  projection helper). The result is a recognizable, minimal "wireframe Earth"
  with no bitmap texture and no hot-linking.
  - **Acceptable fallback** if the vector approach proves too heavy or the
    package can't be vendored cleanly: a stylized sphere with a lat/long
    graticule (meridians + parallels) so the sphere still reads as a globe.
    Either way the pins are the point and must be correct.
- **Pins:** small 3D markers (sphere/cone/dot) placed at each country's
  lat/long on the globe surface using the same projection helper. Each pin is
  interactive (R3F pointer events: `onPointerOver`, `onPointerOut`,
  `onClick`). The active pin is visually emphasized (color/scale).
- **Labels:** drei `Html` to anchor a small DOM label to the active pin, OR a
  fixed DOM info panel overlaid on the canvas that updates on
  hover/click. Either way the label is real DOM text (so Playwright can read
  the country name and date), styled to match the site (system font, small,
  muted, accent on the name). Touch devices fall back to tap = select.
- **Color scheme:** keep chrome quiet. Globe lines in a muted gray; pins/active
  state use the existing accent (`#2563eb`). Light background consistent with the
  rest of the site.

## 4. Data model

Single source of truth for visited countries, stored as structured data so a new
destination is one object. Suggested location `src/data/travel.ts` (importable by
the client globe component):

```ts
export type VisitedCountry = {
  name: string;   // "Italy"
  code: string;   // ISO-ish short code / key, e.g. "IT" (also drives the flag emoji)
  flag: string;   // "🇮🇹" (emoji, for the label)
  lat: number;    // degrees, +N
  lng: number;    // degrees, +E
  visited: string;// human label, e.g. "October 2025"
  sort: string;   // ISO-ish "2025-10" for ordering, newest first
};
```

The seven entries (lat/lng are approximate country centroids — exact precision
not required, "roughly the right place" per GOAL):

| name | flag | lat | lng | visited | sort |
|---|---|---|---|---|---|
| Italy | 🇮🇹 | 41.9 | 12.6 | October 2025 | 2025-10 |
| France | 🇫🇷 | 46.6 | 2.2 | October 2025 | 2025-10 |
| Japan | 🇯🇵 | 36.2 | 138.3 | May 2024 | 2024-05 |
| Croatia | 🇭🇷 | 45.1 | 15.2 | August 2023 | 2023-08 |
| Tanzania | 🇹🇿 | -6.4 | 34.9 | March 2023 | 2023-03 |
| Costa Rica | 🇨🇷 | 9.7 | -83.8 | November 2022 | 2022-11 |
| Turkey | 🇹🇷 | 39.0 | 35.2 | July 2013 | 2013-07 |

Builders may refine the exact lat/lng but must not add, drop, or rename
countries. Italy and France are close on the map — pins must remain individually
hoverable/selectable (small enough markers, or slight offset) so neither is
unreachable.

### Projection helper

A shared pure function converts geographic coordinates to a 3D point on a sphere
of radius `r`, used by both the country lines and the pins so they line up:

```ts
function latLngToVec3(lat: number, lng: number, r: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return [
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta),
  ];
}
```

(Builder may adjust sign conventions to match their texture/orientation as long
as pins land on the correct landmasses.)

## 5. Information architecture — the `/travel` page

Route: `/travel` (App Router page at `src/app/travel/page.tsx`, server
component, exports `metadata = { title: "Travel" }`). Within the existing
`max-w-2xl` layout column:

1. **Heading** — `h1` "Travel" (matches the `text-2xl font-semibold` heading
   style used on About/Posts).
2. **Intro line** — one short muted sentence, e.g. "Countries I've been lucky
   enough to visit. Drag to spin the globe; tap a pin for details." Reuses the
   "drag / pause" affordance copy so users know it is interactive.
3. **Globe** — the dynamically-imported client component, in a responsive
   square-ish container that fills the column width and scales down on mobile
   (e.g. a width-constrained `aspect-square` or fixed-height box). The `<canvas>`
   must have non-zero width/height at both 1280px and 390px and must not cause
   horizontal overflow.
4. **Active-country label / info** — DOM text showing the selected country's
   flag, name, and visit date (anchored to the pin or in a small panel below /
   over the globe). Empty/neutral state before any selection is fine.
5. **(Optional, nice-to-have) Legend/list** — a small static list of the seven
   countries + dates below the globe (newest first, from the same data). This
   doubles as a no-JS / no-WebGL fallback so the page still conveys the
   information if WebGL is unavailable, and gives Playwright stable text to
   assert. Recommended but can land in the polish sprint.

## 6. Component breakdown

- `src/app/travel/page.tsx` — server component. Heading + intro + renders
  `<TravelGlobe />` via `next/dynamic({ ssr: false })` with a sized loading
  placeholder. May render the static legend/list from `src/data/travel.ts`.
- `src/components/TravelGlobe.tsx` — `'use client'`. Owns the R3F `<Canvas>`,
  `OrbitControls` (autoRotate + pause-on-interact), lighting, the Earth surface
  (vector country lines or graticule fallback), the pins, the active-country
  state, and the label. Sizes itself to its container; uses `dpr` clamping for
  perf.
- `src/components/Pin.tsx` (optional split) — a single interactive pin: geometry
  + pointer handlers, raises selection up to `TravelGlobe`.
- `src/data/travel.ts` — `VisitedCountry[]` + the `latLngToVec3` helper (or a
  separate `src/lib/geo.ts`).
- Vendored geo data (vector approach): `src/data/countries-110m.json` (or under
  `public/`) from `world-atlas`, plus `topojson-client` for decoding.

## 7. Aesthetic

System fonts (inherited), generous whitespace, accent `#2563eb`. The globe is
the centerpiece; surrounding chrome is quiet. Globe lines muted gray; pins and
active highlight use the accent. Labels are small and legible (no near-invisible
text). Motion is smooth, slow auto-rotation — present but not distracting.

## 8. Verification surface (what the evaluator can check on the running site)

- `/travel` returns 200 and shows the "Travel" heading.
- Header nav contains a Travel link that resolves to `/travel` from another page.
- A `<canvas>` is present inside the globe container with non-zero
  width and height at 1280px and at 390px.
- The globe auto-rotates: a screenshot/pixel sample (or camera state) differs
  across a ~1s wait with no user input.
- Dragging across the canvas changes the rendered view (pixels differ from the
  pre-drag frame).
- Hovering or clicking a pin reveals DOM text containing the country name (and
  visit date) for at least one country; the seven country names are all present
  in the page (via labels and/or the static legend).
- No console errors / page errors on `/travel` (and homepage unaffected).
- No horizontal overflow at 390px on `/travel`.
- `pnpm build` exits 0 (static export succeeds).

## 9. Risks and mitigations

- **WebGL during prerender breaks `next build`.** Mitigation: `ssr: false`
  dynamic import; never import Three at module scope of a server component.
- **Bundle size / first paint.** Mitigation: dynamic import keeps Three out of
  the initial chunk; clamp `dpr`; 110m (low-res) TopoJSON is small.
- **Pin selection in headless Chromium for the evaluator.** Mitigation: provide
  DOM-readable labels and a static country list so name/date text is always
  assertable even if pointer-picking a tiny 3D pin is flaky; ensure pins are
  large enough hit targets and Italy/France don't overlap into one.
- **Mobile overflow from the canvas.** Mitigation: container width-constrained
  to the column, `aspect-square`/fixed-height, `overflow-hidden`; verify at
  390px.
- **Auto-rotate vs. evaluator determinism.** Mitigation: pause-on-interact is
  driven by OrbitControls events; rotation is detectable by frame diffing over
  time, and the static legend guarantees content is present regardless.
