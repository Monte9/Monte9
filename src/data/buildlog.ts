// The real sprint history of this site, distilled from agent/STATE.md (the
// History table) and agent/BACKLOG.md. This site is built and maintained by an
// autonomous agent harness: every feature runs Planner → Generator(Build) →
// Evaluator, and only PASS work ships. Nothing here is invented beyond those
// two files — `result` mirrors the History table's verdict column.
//
// Consumed by src/components/labs/BuildTimeline.tsx.

export type BuildResult = "PASS" | "shipped";

// The phases group milestones into the larger arcs of the build.
export type BuildPhase =
  | "Bootstrap"
  | "Travel Globe v1"
  | "Settings & Themes"
  | "Navigation"
  | "Travel v2";

export type Milestone = {
  id: string;
  title: string;
  date: string; // ISO date from the History table
  result: BuildResult; // "PASS" = passed the evaluator; "shipped" = landed
  phase: BuildPhase;
  note: string;
};

// Ordered oldest → newest, matching agent/STATE.md's History table.
export const BUILD_LOG: Milestone[] = [
  {
    id: "bootstrap",
    title: "Bootstrap",
    date: "2026-06-12",
    result: "shipped",
    phase: "Bootstrap",
    note: "Site v1 plus the first port of the agent harness — the loop that builds everything after this.",
  },
  {
    id: "travel-globe-v1",
    title: "/travel globe v1",
    date: "2026-06-27",
    result: "PASS",
    phase: "Travel Globe v1",
    note: "Interactive 3D globe with country pins and polish. Built over four sprints, all PASS.",
  },
  {
    id: "nav-hamburger",
    title: "Nav / hamburger",
    date: "2026-06-27",
    result: "shipped",
    phase: "Navigation",
    note: "Sticky header bar with a hamburger menu.",
  },
  {
    id: "settings-themes",
    title: "Settings + themes",
    date: "2026-06-27",
    result: "PASS",
    phase: "Settings & Themes",
    note: "Theme engine, the /settings page, and a reduce-motion preference — the infrastructure every later sprint builds on.",
  },
  {
    id: "nav-refinements",
    title: "Nav refinements",
    date: "2026-06-27",
    result: "shipped",
    phase: "Navigation",
    note: "Desktop links, lucide icons, a page-title header, and the theme toggle.",
  },
  {
    id: "travel-v2-s1",
    title: "Travel v2 — Sprint 1",
    date: "2026-06-27",
    result: "PASS",
    phase: "Travel v2",
    note: "Filled, per-category country polygons replace the pins — triangulated and projected onto the sphere. The riskiest piece of the revamp.",
  },
  {
    id: "travel-v2-s2",
    title: "Travel v2 — Sprint 2",
    date: "2026-06-27",
    result: "PASS",
    phase: "Travel v2",
    note: "Rich info on tap: a bottom sheet on mobile, a dialog on desktop, with flag, category chip, detail, and blurb.",
  },
  {
    id: "travel-v2-s3",
    title: "Travel v2 — Sprint 3",
    date: "2026-06-27",
    result: "PASS",
    phase: "Travel v2",
    note: "Globe-first layout with an overlaid legend and hint; the static country list was removed.",
  },
  {
    id: "travel-fix",
    title: "Travel fix",
    date: "2026-06-27",
    result: "shipped",
    phase: "Travel v2",
    note: "Globe no longer resets its view on select — a stable camera prop and orientation-preserving fit. Self-verified by dragging through select and close.",
  },
];

// The harness loop. Every milestone above is the output of this cycle running
// once (or several times) per feature: the Planner expands the goal, the
// Generator writes the code, the Evaluator grades it against the rubric, and
// the work either ships (PASS) or loops back for a fix (FAIL).
export type LoopStageId = "planner" | "generator" | "evaluator";

export type LoopStage = {
  id: LoopStageId;
  label: string;
  caption: string;
};

export const LOOP_STAGES: LoopStage[] = [
  {
    id: "planner",
    label: "Planner",
    caption: "Expands the goal into an ordered backlog of small, evaluable sprints.",
  },
  {
    id: "generator",
    label: "Generator",
    caption: "Writes the feature code for the current sprint and builds the static export.",
  },
  {
    id: "evaluator",
    label: "Evaluator",
    caption: "Runs the site headlessly and grades it against the rubric + acceptance criteria.",
  },
];

// The two outcomes of the Evaluator gate.
export const LOOP_BRANCHES = {
  pass: { label: "PASS", caption: "Ship it." },
  fail: { label: "FAIL", caption: "Loop back and fix." },
} as const;

// Headline counts derived from the log, for the summary strip.
export const BUILD_STATS = {
  total: BUILD_LOG.length,
  passed: BUILD_LOG.filter((m) => m.result === "PASS").length,
  shipped: BUILD_LOG.filter((m) => m.result === "shipped").length,
} as const;
