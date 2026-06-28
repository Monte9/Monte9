// The Labs index — a growing gallery of agentic web-dev prototypes. Each entry
// is one experiment page under /labs/<slug>. New prototypes get appended here;
// the /labs hub reads this to render a list sorted by most-recent.
//
// `date` is an ISO date-time (yyyy-mm-ddThh:mm, UTC) — it drives "Recent"
// sorting AND is shown on each card, so the most recently shipped experiment
// rises to the top. `tags` are shown on each card.

export type LabExperiment = {
  slug: string;
  title: string;
  blurb: string;
  date: string; // ISO yyyy-mm-ddThh:mm (UTC)
  tags: string[];
};

export const LAB_EXPERIMENTS: LabExperiment[] = [
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
];

// Every distinct tag across experiments, alphabetized. Shown on cards.
export const ALL_LAB_TAGS: string[] = Array.from(
  new Set(LAB_EXPERIMENTS.flatMap((e) => e.tags))
).sort((a, b) => a.localeCompare(b));

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// Format an ISO date-time as e.g. "Jun 28, 2026 · 1:24 AM" (no date lib, no TZ
// conversion — the stored time is shown as-is). Falls back to date-only input.
export function formatLabDate(iso: string): string {
  const [datePart, timePart] = iso.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const dateStr = `${MONTHS[(m ?? 1) - 1]} ${d}, ${y}`;
  if (!timePart) return dateStr;
  const [hStr, min = "00"] = timePart.split(":");
  let h = Number(hStr);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${dateStr} · ${h}:${min} ${ampm}`;
}
