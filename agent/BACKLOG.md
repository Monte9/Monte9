# BACKLOG — Travel: Globe-First Interactive Map

Ordered sprints toward `agent/GOAL.md`, building on `agent/SPEC.md`. Each sprint
is buildable AND evaluable in a single run, keeps `pnpm build` (static export)
green, never touches `README.md`, and every acceptance criterion is verifiable
by interacting with the running site (Playwright-checkable).

Acceptance criteria below are **DRAFT** — finalized at sprint start via
builder/evaluator alignment (per `agent/RUBRIC.md`) and recorded as "aligned" in
this file and in `agent/evals/<ts>-sprint-N-criteria.md` before feature code is
written.

Status legend: `todo` / `in progress` / `done` / `blocked`. Never delete
done/blocked history; mark it.

**Ordering rationale:** the value chain is (1) get filled, per-category country
polygons rendering correctly on the themeable globe — this is the riskiest piece
(Earcut triangulation + sphere projection of large countries) and everything
else depends on it; then (2) make them interactive with the rich-info
sheet/dialog (the core "info on demand" GOAL); then (3) the globe-first layout,
legend, hint, list removal, and polish. Data lands in Sprint 1 with the
rendering it serves. Three sprints.

---

## Sprint 1 — Filled, per-category country polygons on the themed globe [done]
_PASS: agent/evals/20260627-140334-sprint-1.md (all 6, 3 themes, pixel-sampled)._

_Aligned: agent/evals/20260627-134750-sprint-1-criteria.md (6 criteria)._

**GOAL:** Replace the pin dots with filled, category-colored country regions for
all 9 countries (Home=India, Lived=US, Visited=the other 7), built from vendored
TopoJSON and projected onto the sphere, colored from the active theme — keeping
drag + auto-rotate + outlines for every other country.

**DRAFT acceptance criteria**

1. On `/travel`, after rotating the globe to each hemisphere, all **9 countries
   render as filled regions** (not dots) hugging the sphere surface (no fill
   sinking below or floating obviously off the globe), and **other countries
   still show their outlines** — verifiable in screenshots covering India/US/the
   visited set.
2. The fills use **exactly 3 distinct colors by category**: India in the Home
   color, the United States in the Lived color, and Italy/France/Japan/Croatia/
   Tanzania/Costa Rica/Turkey all in the Visited color; the three colors are
   clearly distinguishable from each other and from the sphere (screenshot/
   computed-color check).
3. The fills are **theme-aware**: setting `data-theme` to light, dark, and
   sunset (or switching via `/settings`) re-colors the category fills with no
   reload, and all three categories stay legible/distinct against the sphere in
   each theme (screenshots in all 3 themes).
4. **Globe behaviors preserved:** the globe auto-rotates on load with
   reduce-motion off (two screenshots ~1s apart differ in the globe region) and
   a drag rotates it; with `data-reduce-motion="true"` it does not auto-spin but
   a drag still rotates it.
5. The large countries (United States, India) render as **complete, correctly
   shaped fills** (mainland filled, no gaping triangulation holes/spikes across
   the polygon) — confirmed by screenshot when each is centered.
6. **Gates:** no horizontal overflow at 390px on `/travel`, zero console/page
   errors on `/travel`, and `pnpm build` exits 0 (static export succeeds).

_Note: data model changes (add India/US, add category/atlasName/id/detail/blurb)
land in this sprint since the rendering consumes them. The old below-globe label
and Countries list may remain until Sprint 3; do not let them block this sprint._

---

## Sprint 2 — Hover/tap rich info: bottom sheet (mobile) / dialog (desktop) [in progress]

**GOAL:** Make the filled countries interactive — hovering/tapping a country
emphasizes it on the globe and opens a dismissible rich-info surface (name +
category chip + detail + blurb) that is a bottom sheet on mobile and a dialog/
modal on desktop.

**DRAFT acceptance criteria**

1. Clicking/tapping a filled country opens a surface showing that country's
   **flag + name, a category chip (Home/Lived/Visited in the category color),
   the detail** (visit date for Visited; duration for India/US), **and the
   blurb** — verified for at least one Home, one Lived, and one Visited country
   (e.g. India "~18 years", US "~13 years", Japan "May 2024").
2. The opened country is **emphasized on the globe** (distinct from the resting
   fill — e.g. brighter/raised/outlined) while its surface is open.
3. The surface is **dismissible**: a close control hides it, **Escape** closes
   it (desktop), and clicking the ocean / scrim closes it; after dismissal the
   globe is interactive again.
4. **Mobile vs desktop treatments visibly differ:** at 390px the surface is a
   **bottom-anchored sheet** (pinned to the bottom edge, globe still visible
   above it, above the tab bar); at 1280px it is a **centered or side dialog**
   (not a full-width bottom bar). The difference is observable in screenshots at
   both viewports.
4b. (desktop a11y) The desktop dialog is keyboard-accessible: focus moves into
   it on open, Escape closes, and focus is not permanently trapped after close.
5. Opening a country **pauses auto-rotation** so it stays readable; closing
   resumes it (when reduce-motion is off). Under reduce-motion the globe stays
   non-spinning but tap-to-open and drag still work.
6. **Gates:** the surface and chips use theme tokens and stay legible in all 3
   themes; no horizontal overflow at 390px with the sheet open; zero console/
   page errors on `/travel`; `pnpm build` exits 0.

_(6 criteria; 4b is a sub-clause of the mobile/desktop criterion — evaluator may
fold it in or cut at alignment to stay at the cap.)_

---

## Sprint 3 — Globe-first layout, legend, hint, list removal & polish [todo]

**GOAL:** Make the globe the centerpiece — fill the space below the header to the
tab bar with no top clipping, overlay a theme-aware category legend and a short
one-line hint, and remove the static Countries list and verbose copy.

**DRAFT acceptance criteria**

1. The globe **fills the available area** below the sticky header down to the tab
   bar at both 1280×900 and 390×844: its **top is not clipped** by the header,
   it is large and centered, and the globe stage **causes no vertical page
   scroll** (no scrollbar introduced just by the stage).
2. A **category legend** is overlaid on the globe showing 3 swatches + labels
   (Home / Lived / Visited) in the **same colors as the fills**, in a corner,
   legible in all 3 themes, not obscuring the globe and not colliding with the
   bottom sheet or tab bar on mobile.
3. The static **Countries list and the verbose intro/help copy are removed**:
   there is **no list of countries + dates rendered as page text** below the
   globe; at most a single short hint line (e.g. "Tap a country") remains, and
   it does not block globe interaction.
4. **All Sprint 1–2 behavior still works** in the new layout: filled fills
   visible, tap opens the sheet/dialog with correct info, drag rotates,
   auto-rotate + reduce-motion gating intact, theme switching re-colors globe +
   legend + sheet/dialog.
5. **No regressions elsewhere:** homepage and at least one other page
   (`/about` or `/posts`) render correctly at 1280px and 390px; the sticky
   header and 5-tab bar still work; `/travel` has no horizontal overflow at
   390px.
6. **Gates:** zero console/page errors on `/travel` and the homepage; `pnpm
   build` exits 0 (static export succeeds).

---

## Done / Blocked history

- **Settings, Theming, and Nav Tidy** (prior GOAL) — Sprints 1–3 shipped and
  evaluator PASS. **Closed/superseded** by this backlog. Verdicts:
  `agent/evals/20260627-042528-sprint-1.md`,
  `agent/evals/20260627-044006-sprint-2-3.md`. The theme engine, `ThemeProvider`/
  `useTheme`, semantic tokens, reduce-motion, and 5-tab nav from that work are
  now infrastructure this backlog builds on (do not re-do).
- **/travel interactive 3D globe** (earlier GOAL) — Sprints 1–4 shipped, PASS:
  `agent/evals/20260627-024642-sprint-1-4.md`. That produced the outline+pins
  globe this backlog evolves into a filled choropleth.
