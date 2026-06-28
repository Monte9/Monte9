// The Labs index — a growing gallery of agentic web-dev prototypes. Each entry
// is one experiment page under /labs/<slug>. New prototypes get appended here;
// the /labs hub reads this to render a sortable, tag-filterable list.
//
// `date` is the ISO day the experiment landed (drives "Recent" sorting).
// `tags` power the tag filter and should reuse existing tags where they fit.

export type LabExperiment = {
  slug: string;
  title: string;
  blurb: string;
  date: string; // ISO yyyy-mm-dd
  tags: string[];
};

export const LAB_EXPERIMENTS: LabExperiment[] = [
  {
    slug: "built-by-agents",
    title: "Built by Agents",
    blurb:
      "How this site assembles itself — planner → build → evaluator — visualized from the real sprint history.",
    date: "2026-06-28",
    tags: ["Agentic", "Dataviz", "Animation"],
  },
  {
    slug: "journey",
    title: "The Journey",
    blurb:
      "Scroll a globe through my path: Bangalore → San Francisco → Austin → Los Angeles.",
    date: "2026-06-28",
    tags: ["WebGL", "Three.js", "Scrollytelling"],
  },
  {
    slug: "field",
    title: "Field",
    blurb:
      "An interactive domain-warped GLSL flow-field that reacts to your cursor.",
    date: "2026-06-28",
    tags: ["WebGL", "GLSL", "Shaders"],
  },
];

// Every distinct tag across experiments, alphabetized — drives the filter chips.
export const ALL_LAB_TAGS: string[] = Array.from(
  new Set(LAB_EXPERIMENTS.flatMap((e) => e.tags))
).sort((a, b) => a.localeCompare(b));

// Format an ISO day as e.g. "Jun 28, 2026" without pulling in a date lib.
export function formatLabDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const MONTHS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${MONTHS[(m ?? 1) - 1]} ${d}, ${y}`;
}
