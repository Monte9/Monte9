# SPEC — Settings, Theming, and Nav Tidy

Derived from `agent/GOAL.md`. This spec is concrete enough that two builders
would produce roughly the same thing. It fixes the architecture, the theme
token model, the three palettes, the no-FOUC strategy, persistence keys, the
settings page layout, the reduce-motion mechanics, and the nav changes. It does
not prescribe exact line-level code.

(Supersedes the previous /travel spec, which shipped and is closed — see
`agent/STATE.md`.)

---

## 1. Technical constraints (plan around these)

- **Next.js App Router, static export.** `next.config.ts` has
  `output: "export"` and `trailingSlash: true`. `pnpm build` must stay green;
  every page is prerendered to static HTML. No server, no API routes, no
  runtime data fetching. `/settings` is a static page like the others.
- **Tailwind v4.** `src/app/globals.css` uses `@import "tailwindcss"` and the
  PostCSS plugin is `@tailwindcss/postcss`. There is **no `tailwind.config.js`**;
  configuration is CSS-first via `@theme`. New design tokens are registered
  through `@theme inline { ... }` so utility classes are generated for them.
- **State is client-side only.** Theme and reduce-motion live in
  `localStorage`; a small client provider manages reads/writes and applies
  attributes to `<html>`. Before any explicit choice we follow the OS
  `prefers-color-scheme` / `prefers-reduced-motion`.
- **No FOUC.** Because pages are statically generated, the server HTML cannot
  know the user's stored theme. A tiny **blocking inline `<script>` in
  `<head>`** sets `data-theme` and `data-reduce-motion` on `<html>` before
  first paint (see §4).
- **Do not break:** globe interactivity (drag/hover/tap, far-side occlusion,
  active-pin emphasis), sticky header, mobile tab bar, and no horizontal
  overflow at 390px. `README.md` is never touched.

---

## 2. Information architecture

Primary destinations (exist today): **Home** `/`, **Posts** `/posts`,
**Travel** `/travel`, **About** `/about`. Plus post detail `/posts/[slug]`.

New destination: **Settings** `/settings`.

Navigation surfaces after this work:

- **Sticky header (all viewports):** site title (left) linking to `/`; on
  desktop, a row of primary text links (see below); the hamburger **SiteMenu**
  (right). The hamburger now holds **secondary links only**: Résumé, GitHub, X,
  LinkedIn, Email (Settings may also appear here as a convenience — see §8).
- **Bottom tab bar (`MobileTabBar`, mobile only):** primary destinations.
  Becomes **5 tabs**: Home, Posts, Travel, About, **Settings** (gear, far
  right).
- **Desktop primary nav — open question + chosen default.** Today the hamburger
  carried the primary destinations (Home/Posts/Travel/About) and the tab bar is
  `sm:hidden` (mobile only). Once the hamburger is secondary-only, desktop loses
  a path to primary destinations. Options considered:
  1. Show the bottom tab bar on **all** viewports (drop `sm:hidden`).
  2. Add desktop **text links** (Home/Posts/Travel/About) in the header next to
     the title; keep the tab bar mobile-only.
  3. Keep primary links in the hamburger on desktop only.
  **Chosen default: Option 2 — desktop header text links.** Rationale: preserves
  the minimal sticky-header aesthetic, keeps the bottom tab bar as the familiar
  mobile pattern, and avoids a phone-style tab bar floating over wide desktop
  layouts. Implementation: a horizontal row of primary links shown
  `hidden sm:flex` in the header between the title and the hamburger; the active
  link uses `text-accent`, idle uses `text-muted`/`text-fg`. The hamburger and
  bottom tab bar are otherwise unchanged except for their new contents.
  Builder/evaluator may revisit at sprint start, but this is the default and
  should be built unless explicitly re-aligned.

---

## 3. Theme token model (Tailwind v4)

Two layers.

**Layer A — raw role variables** on `:root` (= Light defaults), overridden per
theme by attribute selectors on `<html>`. These are the source of truth.

```css
:root {            /* Light theme defaults */
  --bg:        #ffffff;  /* page background */
  --surface:   #ffffff;  /* header / menu / tab-bar / card surfaces */
  --surface-2: #f3f4f6;  /* code blocks, subtle fills, hover wash */
  --fg:        #1a1a1a;  /* primary text */
  --muted:     #6b7280;  /* secondary text, dates, captions */
  --border:    #e5e7eb;  /* hairlines, dividers, card borders */
  --accent:    #2563eb;  /* links, active nav, focus ring */
  --accent-contrast: #ffffff; /* text/icon on a filled accent surface */
}
```

**Layer B — Tailwind token registration** so utilities exist:

```css
@theme inline {
  --color-bg:        var(--bg);
  --color-surface:   var(--surface);
  --color-surface-2: var(--surface-2);
  --color-fg:        var(--fg);
  --color-muted:     var(--muted);
  --color-border:    var(--border);
  --color-accent:    var(--accent);
  --color-accent-contrast: var(--accent-contrast);
}
```

This generates `bg-bg`, `bg-surface`, `bg-surface-2`, `text-fg`, `text-muted`,
`text-accent`, `border-border`, `bg-accent`, `text-accent-contrast`, etc.
Opacity modifiers (`bg-surface/80`) work because the vars are plain colors.

`body` uses `background: var(--bg); color: var(--fg);`. The `.article` rules in
globals.css that hardcode `#f3f4f6` / `#e5e7eb` switch to `var(--surface-2)` /
`var(--border)`; `code`/`pre` use `var(--surface-2)`, `blockquote` border uses
`var(--border)` + text `var(--muted)`, `a` uses `var(--accent)`.

### The three palettes (by role; hex are targets — builder may nudge but must keep contrast)

| role | Light | Dark | Sunset (third) |
|------|-------|------|----------------|
| `--bg` | `#ffffff` | `#0d1117` | `#fbf3ec` |
| `--surface` | `#ffffff` | `#161b22` | `#fff7f0` |
| `--surface-2` | `#f3f4f6` | `#21262d` | `#f3e2d4` |
| `--fg` | `#1a1a1a` | `#e6edf3` | `#3a2a21` |
| `--muted` | `#6b7280` | `#9aa4b2` | `#8a6d5c` |
| `--border` | `#e5e7eb` | `#30363d` | `#e7d3c2` |
| `--accent` | `#2563eb` | `#5b9dff` | `#d2611f` (warm terracotta / burnt-orange) |
| `--accent-contrast` | `#ffffff` | `#0d1117` | `#ffffff` |

Requirements for the third theme: a **distinct, non-blue accent** (warm
"Sunset" terracotta) and its **own background tint** (warm off-white), feeling
intentional and minimal — not garish. Every theme keeps body text vs `--bg` at a
comfortable contrast (target WCAG AA, ≥ 4.5:1 for body text; muted text should
stay clearly readable, target ≥ 4.5:1 in content roles and never below ~3:1).

Selectors:

```css
[data-theme="dark"]   { --bg:#0d1117; --surface:#161b22; /* ...rest... */ }
[data-theme="sunset"] { --bg:#fbf3ec; --surface:#fff7f0; /* ...rest... */ }
```

`:root` defaults = Light. The inline script always writes an explicit
`data-theme` so the rendered theme is unambiguous (see §4).

### Globe colors must follow the theme

`Globe.tsx` uses literal hex (sphere `#cfe0f5`, borders `#5b6b80`, resting pin
`#2563eb`, active pin `#f97316`) and `TravelGlobe.tsx` uses `text-gray-*`. The
globe's sphere / border / pin colors should be **derived from the active theme
at render time** (read `getComputedStyle(document.documentElement)` for the
relevant vars, or take them from the theme context), recomputing on theme
change, so the globe is legible in all three themes — notably the sphere must
not be bright pale blue on a dark background. The active-pin emphasis stays a
warm highlight distinct from the resting pin. The legend/label text under the
globe migrates to `text-fg` / `text-muted`.

---

## 4. No-FOUC strategy + persistence

**Persistence keys (localStorage):**

- `theme` → `"light" | "dark" | "sunset"` (absent = follow OS color scheme).
- `reduce-motion` → `"on" | "off"` (absent = follow OS
  `prefers-reduced-motion`).

**Inline blocking script** rendered in `layout.tsx` `<head>` (raw
`<script dangerouslySetInnerHTML>` or Next `<Script strategy="beforeInteractive">`;
it must run before paint). Pseudocode:

```js
(function () {
  try {
    var t = localStorage.getItem('theme');
    if (t !== 'light' && t !== 'dark' && t !== 'sunset') {
      t = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', t);

    var rm = localStorage.getItem('reduce-motion');
    var reduce = rm === 'on' ||
      (rm == null && matchMedia('(prefers-reduced-motion: reduce)').matches);
    document.documentElement.setAttribute('data-reduce-motion', reduce ? 'true' : 'false');
  } catch (e) {}
})();
```

Because `data-theme` is set synchronously before first paint, there is no flash
of the wrong theme on reload or hard navigation. (Note: setting attributes on
`<html>` from an inline head script does not trigger React hydration warnings;
if `suppressHydrationWarning` on `<html>` is needed for any attribute mismatch,
add it.)

**Client provider — `ThemeProvider` (`'use client'`, wraps `children` in the
layout):**

- On mount, reads the same logic into React state (so UI like the active-theme
  highlight and the toggle render correctly) without re-flashing.
- Exposes `theme`, `setTheme(t)`, `reduceMotion`, `setReduceMotion(b)`.
- `setTheme` writes `localStorage.theme`, sets `data-theme` on `<html>`, updates
  state. `setReduceMotion` writes `localStorage['reduce-motion']` and sets
  `data-reduce-motion`.
- When a stored value is absent (following OS), the provider may subscribe to the
  `prefers-color-scheme` / `prefers-reduced-motion` media queries and update
  live; once the user picks explicitly, the explicit value wins.
- A `useTheme()` hook is consumed by the header active-link state (if needed),
  the settings page, and the globe.

**Data model** (the only "data" here is preference state):

```ts
type ThemeName = 'light' | 'dark' | 'sunset';
type ThemeContextValue = {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
  reduceMotion: boolean;
  setReduceMotion: (b: boolean) => void;
};
```

---

## 5. Reduce-motion mechanics

State source: `data-reduce-motion="true"` on `<html>` + the provider's
`reduceMotion` boolean. Active when the user toggled it on, OR (when untouched)
the OS prefers reduced motion.

Effects when active:

- **Globe auto-rotation off.** In `Globe.tsx`, `OrbitControls.autoRotate` is
  gated on reduce-motion: `autoRotate={!interacting && !reduceMotion}`. Manual
  drag/hover/tap still work (interaction is not the "motion" we suppress; only
  the ambient auto-spin stops). The globe reads `reduceMotion` from the provider
  (it is a client component) or from the `data-reduce-motion` attribute.
- **Transitions minimized.** A global CSS rule scoped to the attribute:
  ```css
  [data-reduce-motion="true"] *,
  [data-reduce-motion="true"] *::before,
  [data-reduce-motion="true"] *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
  ```
  (The standard reduce-motion reset; must not break essential UI.)

Persisted across reloads via the `reduce-motion` key and re-applied by the
inline script.

---

## 6. Settings page `/settings`

A static page styled like the rest of the site, inside the existing `max-w-2xl`
layout column. `metadata = { title: "Settings" }`. The interactive controls live
in a `'use client'` child (e.g. `SettingsPanel`) that consumes `useTheme()`;
the route page itself can stay a server component rendering the heading + that
child. Content, top to bottom:

- **Heading:** `Settings` (`text-2xl font-semibold`, matching other page
  headings), optional one-line subtitle in `text-muted`.
- **Theme section:**
  - Section label `Theme`.
  - Three selectable options: **Light**, **Dark**, **Sunset**, as a row/grid of
    cards or a segmented control. Each option:
    - Shows its name and a small **swatch/preview** (chips rendering that theme's
      `--bg` / `--surface` / `--accent`).
    - The **active** theme is clearly indicated (e.g. `border-accent` ring + a
      check) and exposes selected state to a11y (`aria-pressed` /
      `aria-checked`).
    - Clicking it calls `setTheme`; the **whole site updates immediately** (no
      reload).
  - Implemented as buttons or a radiogroup; keyboard operable, visible focus.
- **Reduce motion section:**
  - Label `Reduce motion` + short helper text in `text-muted` ("Stops the globe
    from auto-spinning and minimizes transitions.").
  - A **toggle switch** (`role="switch"` + `aria-checked`) bound to
    `setReduceMotion`. Toggling on immediately stops globe auto-rotation.
- Surfaces use `bg-surface` / `border-border` / `text-fg` / `text-muted`; the
  page is legible and consistent in all three themes.

No omitted-setting categories (accounts, notifications, language, reminders) —
out of scope per GOAL.

---

## 7. Migration: literal colors → semantic utilities

Every component currently uses literal Tailwind/hex colors; all must move to the
semantic tokens so all three themes apply site-wide. Known set (builder should
grep `text-/bg-/border-/hover:` + `gray|blue|white` and any `#hex` and catch the
rest):

| file | current literals | replace with |
|------|------------------|--------------|
| `src/app/layout.tsx` | `border-gray-200/70`, `bg-white/80`, `hover:text-blue-600` | `border-border/70`, `bg-surface/80`, `hover:text-accent` |
| `src/components/SiteMenu.tsx` | `text-gray-700`, `text-gray-400`, `hover:bg-gray-50`, `hover:bg-gray-100`, `border-gray-200`, `border-gray-100`, `bg-white` | `text-fg`/`text-muted`, `hover:bg-surface-2`, `border-border`, `bg-surface` |
| `src/components/MobileTabBar.tsx` | `border-gray-200`, `bg-white/90`, `text-blue-600` (active), `text-gray-500` (idle) | `border-border`, `bg-surface/90`, `text-accent`, `text-muted` |
| `src/app/page.tsx` | `text-gray-700`, `text-blue-600`, `text-gray-500`, `hover:text-blue-600` | `text-fg`/`text-muted`, `text-accent`, `hover:text-accent` |
| `src/app/about/page.tsx` | links styled via `.article` in globals.css | ensure links read `--accent` (handled in globals.css) |
| `src/app/posts/page.tsx` | `text-gray-500`, `hover:text-blue-600`, `text-gray-700` | `text-muted`, `hover:text-accent`, `text-fg` |
| `src/app/posts/[slug]/page.tsx` | `text-gray-500` | `text-muted` |
| `src/app/travel/page.tsx` | `text-gray-600`, `text-gray-700`, `text-gray-500` | `text-muted`/`text-fg` |
| `src/components/TravelGlobe.tsx` | `text-gray-400`, `text-gray-700`, `text-gray-500` | `text-muted`/`text-fg` |
| `src/components/Globe.tsx` | hex sphere/border/pin colors | derive from theme vars (see §3) |
| `src/app/globals.css` | `.article` hardcoded `#f3f4f6`, `#e5e7eb` | `var(--surface-2)`, `var(--border)` |

Acceptance is behavioral: switching themes visibly re-colors header, menu, tab
bar, home, about, posts, post pages, travel + globe, and settings — with no
leftover gray-on-dark or white-on-sunset patches.

---

## 8. Nav changes (detail)

**`SiteMenu` (hamburger):** remove the `nav` array (Home/Posts/Travel/About);
keep only the `social` array — Résumé, GitHub, X, LinkedIn, Email. Optionally
append a **Settings** row (gear) for convenience (with a divider above the social
group if kept). Click-outside / Escape behavior and a11y attributes unchanged;
colors migrated per §7.

**`MobileTabBar`:** add a **5th tab — Settings** at the far right with a **gear
icon**. Active when `pathname` starts with `/settings`, using `text-accent`.
Five tabs still fit at 390px (each `flex-1`); verify no overflow.

**Desktop primary nav:** add header text links per §2 Option 2 (`hidden sm:flex`
row of Home/Posts/Travel/About; active = `text-accent`). This keeps desktop able
to reach every primary page once the hamburger is secondary-only. (If
builder/evaluator prefer Option 1 at alignment, record it in the verdict;
default is Option 2.)

The header title link keeps pointing at `/`.

---

## 9. Component breakdown (new / changed)

- `src/components/ThemeProvider.tsx` — `'use client'` context provider + the
  `useTheme()` hook + the `setTheme`/`setReduceMotion` logic. Wraps `children`
  in `layout.tsx`.
- `src/app/layout.tsx` — adds the inline no-FOUC `<head>` script, wraps children
  in `ThemeProvider`, adds desktop header primary links, migrates colors.
- `src/app/globals.css` — Layer A vars per theme, `@theme inline` token map,
  reduce-motion CSS reset, `.article` var migration.
- `src/app/settings/page.tsx` (+ `SettingsPanel` client child) — the settings
  UI.
- `src/components/SiteMenu.tsx`, `src/components/MobileTabBar.tsx` — nav changes
  + color migration.
- `src/components/Globe.tsx`, `src/components/TravelGlobe.tsx` — theme-aware
  colors + reduce-motion gating + text migration.
- `src/app/page.tsx`, `src/app/posts/*`, `src/app/travel/page.tsx` — color
  migration only.

---

## 10. Verification surface (what the evaluator can check on the running site)

- `/settings` returns 200, shows a `Settings` heading, a theme picker with three
  options, and a reduce-motion toggle.
- Selecting each theme updates `document.documentElement` `data-theme` and
  visibly re-colors the page (computed `background-color` of `body` /
  `getComputedStyle` of key elements differs per theme); the choice **persists
  across reload** (localStorage `theme`).
- **No FOUC:** on load with a stored non-default theme, `data-theme` is already
  set on the first paintable frame (the inline script ran; the body background
  matches the stored theme without a flash to white).
- Each theme is **legible** on home/about/posts/travel/settings (no
  near-invisible text — assert computed text color contrast vs background, or
  screenshot review).
- Reduce-motion toggle on → `data-reduce-motion="true"` and the globe stops
  auto-rotating (frame diff over ~1s is ~zero with no user input); drag still
  rotates it.
- Bottom tab bar has 5 items incl. a far-right Settings (gear) tab that
  navigates to `/settings`.
- Hamburger contains only secondary links (Résumé/GitHub/X/LinkedIn/Email,
  optionally Settings); Home/Posts/Travel/About are no longer in it.
- No horizontal overflow at 390px on every touched page; no console / page
  errors; globe + sticky header still work; `pnpm build` exits 0.

---

## 11. Out of scope / non-goals

- No backend, accounts, notification settings, language, reminders.
- No changes to `README.md`, post content, or the globe's interaction model
  (only its colors + auto-rotate gating).
- No new dependencies required (theming is plain CSS + a small provider). Adding
  one is allowed only if it keeps static export green and the bundle minimal.
