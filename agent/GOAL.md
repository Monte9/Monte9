# GOAL

Add a Settings page with theming to montethakkar.com, and tidy the nav,
in the spirit of the Rosebud app reference (settings page with a Theme
selector; gear "Settings" tab far-right in the bottom bar).

## Must have

### Theming (light / dark / + a third color theme — 3 total)
- Three selectable themes: **Light**, **Dark**, and a third with a distinct,
  non-blue accent and its own background tint (e.g. a warm "Sunset"). All
  three must be legible (clear contrast, no near-invisible text) on every
  page.
- Applies to the **entire site** — every page and component (header, menu,
  tab bar, home, about, posts, post pages, travel + the globe label/legend,
  settings).
- Before any explicit choice, follow the OS `prefers-color-scheme`
  (light or dark). Once the user picks a theme, persist it (localStorage)
  and keep it across navigations and reloads.
- No flash of the wrong theme on load (set the theme before first paint).

### Settings page + tab
- New `/settings` page styled like the rest of the site.
- **Settings** becomes the 5th item in the bottom tab bar, far right, with a
  gear icon.
- Settings contains:
  - **Theme** picker (the three themes above), clearly showing the active one.
  - **Reduce motion** toggle: when on (or when the OS prefers reduced motion),
    the globe stops auto-rotating and transitions are minimized. Persisted.

### Nav tidy
- The hamburger menu should hold **only the secondary links** — Résumé,
  GitHub, X, LinkedIn, Email. Remove the primary tab items (Home, Posts,
  Travel, About) from it; those live in the tab bar. Settings is reachable
  from the tab bar (and may also appear among the secondary links if useful).

## Constraints
- Static export stays green (`pnpm build`, `output: "export"`). Theme +
  settings are client-side only (localStorage), no backend.
- Match the minimal aesthetic; the third theme should feel intentional, not
  garish.
- Never modify the profile `README.md`.
- Do not break existing behavior: globe interactivity, sticky header, mobile
  tab bar, no 390px overflow.

## Notes
- Settings that do NOT apply to a static personal site (accounts,
  notifications, language, reminders) are intentionally omitted.
- The evaluator should define the detailed success criteria at sprint start
  (criteria-alignment), then verify them with Playwright across all three
  themes and both viewports.
