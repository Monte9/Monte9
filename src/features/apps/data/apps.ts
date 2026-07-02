// The Apps index — a growing gallery of agentic web-dev prototypes. Each entry
// is one experiment page under /apps/<slug>. New prototypes get appended here;
// the /apps hub reads this to render a list sorted by most-recent.
//
// `date` is an ISO date-time (yyyy-mm-ddThh:mm, UTC) — it drives "Recent"
// sorting AND is shown on each card, so the most recently shipped experiment
// rises to the top. `tags` are shown on each card.

export type AppExperiment = {
  slug: string;
  title: string;
  blurb: string;
  date: string; // ISO yyyy-mm-ddThh:mm (UTC)
  tags: string[];
  // Optional theme-agnostic SVG inner markup (viewBox 0 0 32 32, uses
  // currentColor / text-muted) for the card thumbnail. The routine's builder
  // emits this per app; the original 7 use hand-drawn motifs in AppThumb.
  motif?: string;
};

export const APP_EXPERIMENTS: AppExperiment[] = [
  {
    slug: "built-by-agents",
    title: "Built by Agents",
    blurb:
      "How this site assembles itself — planner → build → evaluator — visualized from the real sprint history.",
    date: "2026-06-28T00:15",
    tags: ["Agentic", "Dataviz", "Animation"],
  },
  {
    slug: "journey",
    title: "The Journey",
    blurb:
      "Scroll a globe through my path: Bangalore → San Francisco → Austin → Los Angeles.",
    date: "2026-06-28T00:30",
    tags: ["WebGL", "Three.js", "Scrollytelling"],
  },
  {
    slug: "field",
    title: "Field",
    blurb:
      "An interactive domain-warped GLSL flow-field that reacts to your cursor.",
    date: "2026-06-28T00:45",
    tags: ["WebGL", "GLSL", "Shaders"],
  },
  {
    slug: "boarding-pass",
    title: "Boarding Pass",
    blurb:
      "Monte's immigration-and-career arc as a tactile stack of airline tickets — drag the top pass to tear it off, tap Story to flip it. Four legs from Bangalore to LA (BLR → SFO at 18, on through Pillow/Expedia, Vrbo, Curio, and founding-engineer at Rosebud), each a real boarding pass with a procedural barcode and perforation. Pure CSS-3D + canvas with spring physics, no WebGL.",
    date: "2026-06-28T01:24",
    tags: ["CSS 3D", "Canvas", "Physics", "Interaction", "Personal"],
  },
  {
    slug: "rope-type",
    title: "Rope Type",
    blurb:
      "A word spelled in glowing beads strung on soft-body rope. Grab a letter and fling it, switch to the scissors and cut a strand to watch it fall — a from-scratch Verlet physics engine, no WebGL. (There may be a secret phrase hiding behind an old cheat code.)",
    date: "2026-06-28T02:32",
    tags: ["Canvas", "Physics", "Verlet", "Interaction", "Typography", "Generative"],
  },
  {
    slug: "ascii-engine",
    title: "ASCII Engine",
    blurb:
      "A spinning 3D form rendered entirely in living text. A real lit Three.js scene is drawn to an offscreen render target sized one texel per character, read back to the CPU, and re-typed as a grid of monospace glyphs through a hand-rolled luminance ramp — a from-scratch render-to-ASCII rasterizer, no off-the-shelf post-process. Drag to orbit, swap between a torus knot and an extruded MT monogram, toggle the density ramp from ASCII to Blocks, or pause the spin.",
    date: "2026-06-28T03:13",
    tags: ["WebGL", "Three.js", "Rendering", "ASCII", "Generative", "Interaction"],
  },
  {
    slug: "shatter-type",
    title: "Shatter Type",
    blurb:
      "A word rendered as a pane of glass and fractured into a real Voronoi mosaic — click anywhere to crack it and the shards nearest the impact explode outward, tumble under gravity with spin and shadow, then drift back and re-fuse into the legible word. The fracture is computed from scratch (Sutherland–Hodgman bisector clipping, sites seeded only on the letterforms), so every fragment literally carries its slice of the glyph. Spells MONTE by default; tap to change.",
    date: "2026-06-28T11:31",
    tags: ["Canvas", "Computational Geometry", "Voronoi", "Physics", "Interaction", "Typography"],
  },
  {
    slug: "weather-pixels",
    title: "Weather Pixels",
    blurb:
      "A living voxel skyscape: 3,000+ GPU-instanced cubes rise and fall on layered weather noise — a rolling pressure front, drifting cloud bands carved into dark gaps, and a dawn-to-storm color grade. Drag to orbit; tap to summon a drifting squall and watch lightning flash a whole column white.",
    date: "2026-06-28T22:28",
    tags: ["webgl", "three.js", "instancing", "generative", "noise", "voxel", "interactive", "r3f", "weather"],
    motif:
      "<g fill=\"currentColor\"><rect x=\"3\" y=\"20\" width=\"3\" height=\"8\" rx=\"0.5\"/><rect x=\"7\" y=\"16\" width=\"3\" height=\"12\" rx=\"0.5\"/><rect x=\"11\" y=\"22\" width=\"3\" height=\"6\" rx=\"0.5\"/><rect x=\"15\" y=\"13\" width=\"3\" height=\"15\" rx=\"0.5\"/><rect x=\"19\" y=\"18\" width=\"3\" height=\"10\" rx=\"0.5\"/><rect x=\"23\" y=\"15\" width=\"3\" height=\"13\" rx=\"0.5\"/><rect x=\"27\" y=\"21\" width=\"3\" height=\"7\" rx=\"0.5\"/></g><g className=\"text-muted\" fill=\"currentColor\"><rect x=\"3\" y=\"10\" width=\"3\" height=\"3\" rx=\"0.5\"/><rect x=\"11\" y=\"12\" width=\"3\" height=\"3\" rx=\"0.5\"/><rect x=\"23\" y=\"8\" width=\"3\" height=\"3\" rx=\"0.5\"/><rect x=\"27\" y=\"11\" width=\"3\" height=\"3\" rx=\"0.5\"/></g><path d=\"M18 3 L13.5 12 L16.5 12 L14.5 19 L21 9.5 L17.5 9.5 L20 3 Z\" fill=\"currentColor\"/>",
  },
  {
    slug: "eiffel-tower",
    title: "Eiffel Tower",
    blurb:
      "The Eiffel Tower rebuilt from its proportions — the wrought-iron lattice, three platforms, four grand arches, and the antenna's beacon, all generated in code from the monument's real dimensions (330 m to the tip, the inward-curving “Eiffel curve” legs). Orbit it, scroll to zoom into the ironwork, right-drag to pan; a warm night-lit bronze in dark mode.",
    date: "2026-07-02T00:05",
    tags: ["webgl", "three.js", "r3f", "3d", "procedural", "architecture", "interactive"],
    motif:
      "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M6 27 C11 19 14 11 16 4 C18 11 21 19 26 27\"/><path d=\"M9 27 Q16 21 23 27\"/><path d=\"M10 21.5 H22\"/><path d=\"M12.2 15 H19.8\"/><path d=\"M16 4 V1.6\"/></g>",
  },
];

// Every distinct tag across experiments, alphabetized. Shown on cards.
export const ALL_APP_TAGS: string[] = Array.from(
  new Set(APP_EXPERIMENTS.flatMap((e) => e.tags))
).sort((a, b) => a.localeCompare(b));

// Date formatting lives in @/lib/format (formatDate) — a data file shouldn't
// carry presentation logic. AppsList imports it directly.
