# SPEC — Travel: Globe-First Interactive Map

Derived from `agent/GOAL.md`. Concrete enough that two builders would produce
roughly the same thing: it fixes the layout, the data model, the polygon
fill+pick approach (with the technical decision justified), the rich-info
treatment (mobile bottom sheet vs desktop dialog), the legend, theming, and how
the old country list is removed. It does not prescribe line-level code.

This SPEC **supersedes** the prior "Settings, Theming, and Nav Tidy" SPEC, which
shipped and is closed (see `agent/STATE.md` and `agent/BACKLOG.md` history). The
theme engine, `ThemeProvider`/`useTheme`, semantic tokens, reduce-motion, and
the 5-tab nav from that work are now **infrastructure this SPEC builds on** — do
not change them.

---

## 1. Scope

Only the `/travel` page body changes. The site shell (sticky header, desktop
nav, bottom tab bar, themes, reduce-motion) is unchanged. `README.md` is never
touched. No new pages, no backend, no runtime fetch, static export stays green.

What ships:
- A globe-first `/travel` that fills the space below the sticky header down to
  the tab bar, with **no top clipping**.
- The current static **Countries list** and the verbose intro/help copy are
  **removed** (a single short hint line is allowed).
- The ~9 highlighted countries are drawn as **filled, per-category-colored
  polygons** on the sphere (not pin dots), with a small **legend**.
- Hover/tap a highlighted country → **rich info** (name + category + detail +
  blurb) in a **bottom sheet on mobile** / **dialog (modal) on desktop**,
  dismissible, with the active country emphasized on the globe.
- Keep drag-to-rotate, auto-rotate-on-load (reduce-motion aware), pause on
  interact, theme-aware colors, no 390px overflow, zero console errors.

---

## 2. Technical constraints (plan around these)

- **Next.js App Router, static export.** `next.config.ts`: `output: "export"`,
  `trailingSlash: true`. Every page prerenders to static HTML. The globe is a
  `'use client'` component loaded via `next/dynamic` with `ssr: false`
  (WebGL has no SSR). `pnpm build` must exit 0.
- **No runtime fetch / vendored geo data.** Country geometry comes from the
  already-installed `world-atlas` (`countries-110m.json`) parsed with
  `topojson-client`, imported at module scope (bundled at build time). No
  network at runtime.
- **No new dependencies** (see §6 decision). `three`, `@react-three/fiber`,
  `@react-three/drei`, `topojson-client`, `world-atlas` are all present.
- **Theme + reduce-motion are existing infra.** Globe colors come from
  `GLOBE_COLORS[theme]` in `src/lib/theme.ts` (extended, see §5) via
  `useTheme()`. Auto-rotation is gated on `reduceMotion` exactly as today.
- **Do not regress:** drag/hover/tap, far-side occlusion (back-hemisphere
  countries not pickable through the sphere), sticky header, 5-tab bar, no
  horizontal overflow at 390px.

---

## 3. Layout (globe-first)

### 3.1 Page shell tweak for /travel only
Today every page lives inside `layout.tsx`'s padded, max-width column
(`max-w-2xl px-5 pt-10 pb-28 sm:pb-12`). The globe must instead **fill the
viewport between the sticky header and the bottom tab bar** with no top clip.
The travel page therefore overrides the default column for its content:

- The globe container is **full-bleed and full-height of the available area**,
  not constrained to `max-w-2xl` and not subject to the `pt-10` top padding that
  would push it down / clip its top.
- Target height of the globe stage:
  `height = 100dvh − header − bottom-tab-bar(mobile only)`.
  - Header is the sticky `<header>` (its rendered height; ~64px). The bottom tab
    bar is `sm:hidden` (mobile only) and sits above `env(safe-area-inset-bottom)`.
  - Recommended implementation: a wrapper with
    `height: calc(100dvh - var(--header-h) - var(--tabbar-h))` where
    `--tabbar-h` is `0` at `sm` and up (tab bar hidden) and the tab-bar height +
    safe-area on mobile. Builder may hardcode reasonable px values
    (header ≈ 64px; tab bar ≈ 64px + safe-area) as long as: (a) the globe top
    edge is below the header with no clipping, (b) on mobile the globe is not
    hidden behind the tab bar, (c) nothing scrolls (the page should not produce
    vertical scroll just from the globe stage at 1280×900 or 390×844).
- Because this page is full-bleed, the travel route should escape the parent
  column. Two acceptable approaches: (a) keep `layout.tsx` generic and have the
  travel page use negative margins / a fixed-or-absolute full-width stage that
  breaks out of the column; or (b) the cleaner approach — render the globe stage
  in a wrapper positioned relative to the viewport (e.g. a `relative` full-width
  block with the computed height). Builder chooses; the **observable
  requirement** is: at 1280×900 and 390×844 the globe is large and centered,
  its top is not clipped by the header, and there is no page scroll caused by
  the stage.
- The page `<h1>Travel</h1>` is already `hidden ... sm:block` and the mobile
  header shows the page title; for globe-first, the desktop `<h1>` may be
  dropped or kept minimal — do **not** let it reintroduce large top padding that
  clips the globe. The verbose intro `<p>` is **removed**.

### 3.2 Overlays positioned over the globe stage
The **legend** and the optional one-line **hint** are absolutely positioned
**over** the globe stage (not stacked below it, which would eat height):
- Legend: bottom-left (desktop) / top or bottom corner (mobile), a compact
  card (`bg-surface/80 backdrop-blur border-border`) — see §7.
- Hint (optional, e.g. "Tap a country"): small `text-muted`, a corner or
  centered-bottom; must not block interaction (`pointer-events-none`). May be
  hidden once the user has opened a country.

### 3.3 Reference (current implementation being replaced)
`src/components/TravelGlobe.tsx` currently renders a fixed `h-[420px]` globe
plus a `<p>` label below it, and `src/app/travel/page.tsx` renders the intro
`<p>` and the `<h2>Countries</h2>` + `<ul>` list. The list, the intro `<p>`, and
the fixed-height-below-the-fold layout are all replaced.

---

## 4. Data model

Single source of truth stays `src/data/travel.ts`. The current
`VisitedCountry` type is **extended** (it only has name/flag/lat/lng/visited/sort
today). New shape:

```ts
export type TravelCategory = "home" | "lived" | "visited";

export type TravelCountry = {
  name: string;        // display name, e.g. "United States"
  atlasName: string;   // exact world-atlas countries-110m "name" (for matching)
  id: string;          // world-atlas numeric id (string), redundant matcher
  flag: string;        // emoji
  category: TravelCategory;
  lat: number;         // centroid-ish, for label anchor / camera focus
  lng: number;
  detail: string;      // years lived (Home/Lived) OR visit date (Visited)
  blurb: string;       // 1–2 sentence human blurb shown in the sheet/dialog
  sort: string;        // YYYY-MM for ordering (existing field, keep)
};
```

`detail` semantics per GOAL:
- **Home / Lived** → duration, e.g. "Grew up here · ~18 years", "~13 years".
- **Visited** → the visit date already in the file (Italy Oct 2025, France Oct
  2025, Japan May 2024, Croatia Aug 2023, Tanzania Mar 2023, Costa Rica Nov
  2022, Turkey Jul 2013).

### 4.1 The 9 countries + world-atlas matching

`atlasName` / `id` are the values found in `world-atlas/countries-110m.json`
(`properties.name` and `id`). **These are exact — use them to select the
geometry to fill.** Verified against the installed package:

| Display | category | `atlasName` | `id` | detail |
|---|---|---|---|---|
| India | home | `India` | `356` | grew up there, ~18 years |
| United States | lived | `United States of America` | `840` | ~13 years |
| Italy | visited | `Italy` | `380` | October 2025 |
| France | visited | `France` | `250` | October 2025 |
| Japan | visited | `Japan` | `392` | May 2024 |
| Croatia | visited | `Croatia` | `191` | August 2023 |
| Tanzania | visited | `Tanzania` | `834` | March 2023 |
| Costa Rica | visited | `Costa Rica` | `188` | November 2022 |
| Turkey | visited | `Turkey` | `792` | July 2013 |

Match by `id` (most robust) or `atlasName` when iterating the decoded
FeatureCollection from `feature(topo, topo.objects.countries)`.

**Geometry notes the builder must handle:**
- `France` (`id 250`) is a `MultiPolygon` whose parts include overseas
  territories (e.g. French Guiana) in addition to metropolitan France — all
  parts will be filled; that is acceptable (it is "France" in the atlas). If a
  stray far-flung polygon looks wrong, the builder may filter to the largest
  ring, but this is optional polish, not required.
- `United States of America` (`id 840`) and `India` (`id 356`) are the largest
  fills and the main triangulation stress test (see §6 risk).
- Several countries are `MultiPolygon` (US, France, Italy, Japan, Turkey) — each
  polygon (and each ring within, for holes) must be handled.

### 4.2 Migration / back-compat
The current `Globe.tsx` imports `VISITED_COUNTRIES` + `VisitedCountry` and
`buildBorderPositions`. Renaming/extending the data type touches those imports.
Builder updates the data file and consumers together so `pnpm build` stays
green. `VISITED_NEWEST_FIRST` (used only by the now-removed list) can be dropped
or repurposed. Note that today's data omits India and the US (they were not
"visited" pins) — **both must be added** as Home / Lived entries.

---

## 5. Fill + pick approach — DECISION: Option A (extend the r3f globe)

**Chosen: Option A — extend the existing react-three-fiber globe.** Build filled
country meshes from the vendored TopoJSON, triangulate with `THREE.Earcut`,
project onto the sphere with the existing `latLngToVec3`, and color per category
from `GLOBE_COLORS[theme]`. Keep outlines for all other countries.

### Rationale
- **No new heavy dependency.** `react-globe.gl` / `three-globe` add a large
  transitive surface and their own scene/controls; we already have a working r3f
  globe with the exact behaviors the GOAL wants (drag, auto-rotate gating,
  far-side occlusion, theme colors, FitCamera). Option B would mean re-deriving
  all of that and re-validating it under `output: "export"` + `ssr:false`.
- **Full theme control.** We need 3 category colors that re-derive per theme
  (light/dark/sunset) and an "active" emphasis. Option A reads
  `GLOBE_COLORS[theme]` directly. Library choropleth color callbacks would work
  too, but the integration cost is higher for the same result.
- **Reduce-motion + occlusion already solved** in our scene; reuse them.
- **Picking is native to r3f.** Per-country meshes get `onPointerOver` /
  `onPointerOut` / `onClick`, exactly like the current `Pin` component, and the
  opaque sphere already occludes far-side picking.

Option B (`three-globe` / `react-globe.gl`) is rejected as the default: heavier
bundle, must be re-proven under static export, and offers no capability we
can't get from Option A. (If the builder hits a hard blocker triangulating the
large countries — see risk — escalate at sprint start rather than silently
switching libraries.)

### 5.1 Geometry construction (builder spec)
Add to `src/components/globe-utils.ts` (or a sibling) a function that, given a
target `atlasName`/`id` and a sphere radius, returns triangulated, sphere-
projected positions for that country:

1. Decode once at module scope:
   `feature(topo, topo.objects.countries)` → FeatureCollection (already done in
   `buildBorderPositions`; reuse the decode).
2. For the matched feature, collect its polygons. For each polygon: the first
   ring is the outer boundary; subsequent rings are holes.
3. **Triangulate in 2D lon/lat space** using `THREE.Earcut.triangulate(flatXY,
   holeIndices, 2)` where `flatXY` is `[lng, lat, lng, lat, ...]` of the outer
   ring followed by hole rings, and `holeIndices` marks where each hole starts.
   This yields triangle index triples into the ring vertex list.
4. **Densify before projecting** so the flat triangulation curves onto the
   sphere instead of cutting through it: subdivide ring edges and/or the
   triangulated mesh so no edge spans a large angular distance (e.g. cap segment
   length to a few degrees). A simple, robust approach: subdivide each ring edge
   to ≤ ~2–3° steps before triangulating, OR triangulate then subdivide long
   triangle edges. (Large countries like the US/India most need this; without
   densification their fill will visibly sink below the sphere surface.)
5. **Project every vertex** to 3D with `latLngToVec3(lat, lng, radius)` at a
   **slight altitude above the sphere** (e.g. radius × 1.004 — above the
   `1.002` borders so the fill doesn't z-fight the outlines, and above the
   sphere so it doesn't z-fight the ocean).
6. Build a `BufferGeometry` (positions + index) per country; render as a
   `<mesh>` with `meshBasicMaterial` (or `meshStandardMaterial`) colored by
   category. Compute geometry **once** with `useMemo` keyed on country id +
   radius (NOT on theme — only the material color changes per theme).

### 5.2 Rendering & picking
- One mesh per highlighted country, colored by `category` →
  `GLOBE_COLORS[theme].cat[category]` (see §5.3). The **active** country uses an
  emphasized treatment: a distinct emphasis color and/or raised altitude/scale
  and/or higher opacity, so it is clearly the focused one.
- Each mesh handles `onPointerOver` (set hovered, cursor pointer),
  `onPointerOut` (clear hovered, cursor auto), and `onClick`
  (`stopPropagation`, select that country → opens sheet/dialog).
- The opaque base sphere keeps stopping propagation so back-hemisphere fills are
  not pickable through the globe; clicking the ocean clears selection (and may
  close the sheet/dialog), as today.
- **All other countries keep their outline** via the existing
  `buildBorderPositions` LineSegments, so the globe still reads as a world map.
  Highlighted countries are filled on top of (or instead of) their outline.
- Auto-rotate, FitCamera, OrbitControls, reduce-motion gating: unchanged from
  the current `Globe.tsx`.

### 5.3 Category colors in theme
Extend `GLOBE_COLORS` in `src/lib/theme.ts` so each theme supplies three legible
category fills plus an emphasis color, in addition to the existing
sphere/border. Suggested shape (builder may nudge hex but must keep all three
categories distinguishable from each other AND from the sphere in every theme,
with readable contrast):

```ts
GLOBE_COLORS[theme] = {
  sphere, border,                 // existing
  cat: { home: "#…", lived: "#…", visited: "#…" },
  catActive?: "#…" | per-category emphasis,
}
```

Color intent: **Home** warmest/most saturated (it's the anchor), **Lived**
secondary, **Visited** a third hue — all distinct, none blending into the
sphere. The existing `pin`/`pinActive` may be removed if pins are gone, or
repurposed for the emphasis color. The legend swatches (§7) use the **same**
`cat` colors so the map and legend always agree.

---

## 6. Interaction & rich-info surface (mobile sheet vs desktop dialog)

A shared piece of state in `TravelGlobe.tsx` (client) drives both the globe
emphasis and the info surface:
- `hovered: TravelCountry | null` — set on pointer over a country mesh.
- `selected: TravelCountry | null` — set on click/tap; opens the surface.
- `active = selected ?? hovered` — what the globe emphasizes.

### 6.1 Content shown (both form factors)
For the active/selected country:
- **Flag + country display name** (heading).
- **Category** label: "Home" / "Lived" / "Visited" (styled as a small chip/pill
  in that category's color so it ties to the legend + the fill).
- **Detail**: the duration (Home/Lived) or the visit date (Visited).
- **Blurb**: the 1–2 sentence `blurb` from the data.
- A **dismiss** affordance (close button; Escape; click outside / ocean).

### 6.2 Desktop (≥ sm): dialog / modal (or side panel)
- On **click/tap** of a country, open a **dialog** centered (or a right-aligned
  side panel) over the globe. Use the native `<dialog>` element or an
  accessible custom modal: `role="dialog"`, `aria-modal` semantics, labelled by
  the country name, a visible **close (×)** button, **Escape closes**, focus
  moves into the dialog on open and is **not trapped permanently** (returns to a
  sensible place on close). Clicking the backdrop/ocean closes it.
- Hover alone may show a lightweight label/tooltip near the cursor or just the
  globe emphasis; the **full rich card requires a click** (so the choice of
  surface is deterministic for the evaluator). Builder may also open on hover,
  but click must work and must be the primary tested path.
- The dialog must not block dragging the globe when closed.

### 6.3 Mobile (< sm): bottom sheet
- On **tap** of a country, a **bottom sheet** slides up from the bottom edge,
  pinned to the bottom, full width (or nearly), above the tab bar, with the same
  content. It has a drag-handle affordance and/or a close button; **tapping the
  scrim/ocean or a close control dismisses it**; it does not cover the whole
  screen (the globe stays partly visible above it).
- The sheet uses `bg-surface`, `border-border`, `text-fg`/`text-muted`,
  respects safe-area at the bottom, and never causes horizontal overflow at
  390px.

### 6.4 Responsive switch
The same data drives both; which surface renders is chosen by viewport
(Tailwind `sm` breakpoint / a `matchMedia` hook). The **observable difference**
the evaluator will check: at 390px the surface is a bottom-anchored sheet; at
1280px it is a centered/side dialog — i.e. the treatments visibly differ.

### 6.5 Emphasis & auto-rotate
- When a country is `active`, its fill is emphasized (color/altitude/opacity per
  §5.2). Opening the surface should **pause auto-rotation** (reuse the existing
  `interacting` pause, or pause while a country is selected) so the focused
  country stays readable; closing resumes (unless reduce-motion is on, in which
  case auto-rotate stays off entirely).
- Optionally rotate/tilt the globe to bring the selected country toward front
  (nice-to-have, not required).

---

## 7. Legend

A compact, theme-aware legend overlaid on the globe stage (§3.2):
- Three rows/chips: a colored swatch (the exact `cat` color) + label
  **Home**, **Lived**, **Visited**.
- `bg-surface/80 backdrop-blur`, `border border-border`, `rounded`, small text
  (`text-xs`/`text-sm`), `text-fg`. Legible in all three themes.
- Small enough not to obscure the globe; positioned in a corner. On mobile it
  must not collide with the bottom sheet or tab bar (e.g. top-left or top-right).
- The legend is **static informational** (it does not need to be a filter), but
  if the builder makes swatches clickable to focus a country, that is allowed
  polish and must not break the no-overflow / no-error gates.

---

## 8. Theming & reduce-motion (reuse existing infra)

- Globe sphere/border/category/emphasis colors all come from
  `GLOBE_COLORS[theme]` via `useTheme()`; changing theme on `/settings` (or by
  setting `data-theme`) **re-colors the globe, the legend, the category chips,
  and the sheet/dialog** with no reload. Material colors update on theme change
  (re-read on `theme` change; geometry is not rebuilt).
- The sheet/dialog/legend use semantic Tailwind tokens (`bg-surface`,
  `text-fg`, `text-muted`, `border-border`, `text-accent`) — no literal
  `gray-*`/`white`/hex.
- Reduce-motion: auto-rotate stays gated exactly as today
  (`autoRotate={!interacting && !reduceMotion}`); the sheet/dialog open/close
  transitions are already minimized by the global `[data-reduce-motion="true"]`
  CSS reset. Manual drag/hover/tap still works under reduce-motion.

---

## 9. Removing the old list & copy

- `src/app/travel/page.tsx`: remove the intro `<p>` and the entire
  `<h2>Countries</h2>` + `<ul>{VISITED_NEWEST_FIRST...}</ul>` block. The page
  renders essentially just the globe stage (+ overlays). The desktop `<h1>` is
  dropped or kept tiny per §3.1 without clipping the globe.
- `src/components/TravelGlobe.tsx`: remove the `<p data-testid="active-country">`
  label-below-the-globe pattern; the active-country info now lives in the
  sheet/dialog. (If a tiny inline status is kept for a11y `aria-live`, it must
  not consume layout height that pushes the globe down.)
- **Observable requirement:** after the change, there is **no list of countries
  with dates rendered as page text** below the globe; the only place that info
  appears is on the globe / in the legend / in the opened sheet/dialog.

---

## 10. Component breakdown (new / changed)

- `src/data/travel.ts` — new `TravelCategory` + `TravelCountry` types; add India
  (home) and United States (lived); add `category`, `atlasName`, `id`, `detail`,
  `blurb` to all 9; keep/adjust ordering helper.
- `src/lib/theme.ts` — extend `GLOBE_COLORS` with per-category fills + emphasis
  (§5.3).
- `src/components/globe-utils.ts` — add country-polygon triangulation +
  sphere-projection helper (Earcut, densify, `latLngToVec3`); keep
  `buildBorderPositions` for the other countries' outlines.
- `src/components/Globe.tsx` — render filled, picker-enabled country meshes
  (replacing/augmenting the pin dots) colored by category from theme; keep
  sphere, outlines, OrbitControls, FitCamera, auto-rotate gating, occlusion.
- `src/components/TravelGlobe.tsx` — full-bleed full-height stage; hovered/
  selected state; legend overlay; render the **bottom sheet (mobile)** /
  **dialog (desktop)**; remove the below-globe label.
- `src/app/travel/page.tsx` — globe-first layout (full-bleed stage, computed
  height, no clip); remove intro copy + Countries list.

No changes to `layout.tsx` shell, nav, other pages, or `README.md` are required
(the travel page breaks out of the column locally; if a tiny shell hook like a
`--header-h` var is cleaner, it may be added without changing nav behavior).

---

## 11. Verification surface (what the evaluator can check on the running site)

- **Filled countries:** the 9 countries render as filled regions in their
  category colors (3 distinct colors); India=Home, US=Lived, the other 7=Visited
  — visible in a screenshot after rotating to each hemisphere; the legend shows
  the same 3 colors/labels.
- **Rich info:** tapping/clicking a filled country opens a surface showing the
  country name + category + detail (date or duration) + blurb, and the country
  is emphasized on the globe; dismiss (close/Escape/ocean) hides it.
- **Mobile vs desktop differ:** at 390px the surface is a bottom-anchored sheet;
  at 1280px it is a centered/side dialog.
- **Globe behaviors:** drag rotates the globe; it auto-rotates on load (when
  reduce-motion is off) and pauses on interaction; with reduce-motion on it does
  not auto-spin but drag still works.
- **List removed:** no static list of countries+dates is rendered as page text
  below the globe.
- **Theme-aware:** switching theme re-colors the globe fills, legend, chips, and
  sheet/dialog (computed colors differ across themes); legible in all three.
- **Gates:** no horizontal overflow at 390px on `/travel`; no globe top
  clipping below the header; zero console/page errors; `pnpm build` exits 0.

---

## 12. Out of scope / non-goals

- No backend, no runtime data fetch, no new heavy 3D library (Option A chosen).
- No changes to other pages, the nav, the theme engine, or `README.md`.
- No per-country photo galleries, routes/flight arcs, zoom, or country filtering
  (a clickable legend is optional polish only).
- No change to the set of countries beyond adding India (Home) and US (Lived).
