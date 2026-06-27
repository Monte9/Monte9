# GOAL

Build a `/travel` page for montethakkar.com: an animated, interactive 3D
globe (Three.js) that shows the countries Monte has visited, with a pin on
each.

## Must have

- A new route at `/travel`, linked from the site header nav alongside Posts /
  About.
- A 3D Earth globe rendered with Three.js (running in a `'use client'`
  component; dynamically imported with SSR disabled so the static export
  still builds).
- A pin on each visited country, placed at roughly the right
  latitude/longitude.
- **Automated:** the globe auto-rotates on load without any user input.
- **Interactive:** the user can drag to rotate/spin the globe, and
  hovering or clicking a pin reveals that country (name, and the visit date
  if shown). Auto-rotation should pause while the user is interacting and
  can resume after.
- Works on desktop and mobile widths, no horizontal overflow at 390px.

## Countries visited (the data to plot)

| Country | Visited |
|---|---|
| 🇮🇹 Italy | October 2025 |
| 🇫🇷 France | October 2025 |
| 🇯🇵 Japan | May 2024 |
| 🇭🇷 Croatia | August 2023 |
| 🇹🇿 Tanzania | March 2023 |
| 🇨🇷 Costa Rica | November 2022 |
| 🇹🇷 Turkey | July 2013 |

Store this list as structured data (country, lat, lng, date) so new
destinations are easy to add later.

## Constraints

- Static export must stay green (`pnpm build` with `output: "export"`). The
  globe is client-side only; no backend, no runtime API calls. If a texture
  or asset is needed, vendor it into `public/` rather than hot-linking.
- Match the site's minimal aesthetic: system fonts, generous whitespace, the
  existing accent color. The globe is the centerpiece; chrome stays quiet.
- Do not invent travel destinations beyond the table above.
- Never modify the profile `README.md` as part of this work.
