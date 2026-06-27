# GOAL

Revamp `/travel` into a globe-first, interactive map. Keep the site shell
(sticky header, tab bar, themes) — only the page body changes: it becomes
essentially just the globe, with little/no static text, and all the
information lives ON the globe, surfaced by interaction.

## Must have

### Globe-first layout
- The globe is the centerpiece and fills the available space below the header
  (down to the tab bar) on both mobile and desktop. No globe clipping at the
  top edge.
- Remove the static "Countries" list at the bottom and the verbose intro/help
  copy. A short one-line hint (e.g. "Tap a country") is fine; otherwise let the
  globe speak.

### Countries colored by category (not just dots)
Color the actual countries (filled regions), with three categories in three
distinct, theme-aware colors, plus a small legend:
- **Home** — 🇮🇳 India (grew up there, ~18 years).
- **Lived** — 🇺🇸 United States (~13 years).
- **Visited** — Italy, France, Japan, Croatia, Tanzania, Costa Rica, Turkey.

Visit dates (already in `src/data/travel.ts`): Italy Oct 2025, France Oct 2025,
Japan May 2024, Croatia Aug 2023, Tanzania Mar 2023, Costa Rica Nov 2022,
Turkey Jul 2013. India/US have no single date — show the duration instead.

### Rich info on demand
- Hovering or tapping a highlighted country reveals rich info: country name +
  category + the detail (years lived / visit date) and a short blurb. The
  active country is emphasized on the globe.
- **Bottom sheet on mobile, dialog/modal (or side panel) on desktop** for that
  rich info. Dismissible.
- The globe stays draggable to rotate; auto-rotates on load (respecting the
  reduce-motion setting), pausing during interaction.

## Constraints
- Static export stays green (`output: "export"`); client-side only, no backend.
  Any geo data/assets must be vendored (e.g. `world-atlas`), no runtime fetch.
- Theme-aware (light/dark/sunset) and reduce-motion aware, like the current
  globe. Legible category colors + text in all three themes.
- Keep the existing globe's good behaviors (drag, no 390px overflow, no console
  errors). Never modify the profile `README.md`.

## Notes for planning
- The current globe (`src/components/Globe.tsx`, react-three-fiber) draws country
  *outlines* + pin dots. This goal needs filled country polygons with per-country
  category colors and hover/click picking. Consider whether to extend the r3f
  globe (triangulate + project country polygons onto the sphere) or adopt a
  purpose-built library (e.g. `three-globe` / `react-globe.gl`) that supports
  polygon choropleths + onHover/onClick out of the box. Weigh bundle size,
  static-export/SSR compatibility, theming control, and reduce-motion.
- The evaluator should define detailed success criteria at sprint start.
