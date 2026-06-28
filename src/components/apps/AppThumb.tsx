// A small, theme-agnostic preview swatch for a Apps experiment. Each known slug
// gets a hand-drawn mini-motif that hints at the piece; unknown (future,
// routine-shipped) slugs get a deterministic identicon from the slug. Everything
// is drawn with `currentColor` + theme tokens (text-accent / text-muted) so it
// looks right in light, dark, and sunset with no per-theme assets.

type Props = { slug: string; className?: string };

// Secondary (muted) stroke/fill helper — Tailwind sets `color`, currentColor reads it.
const muted = "text-muted";

const MOTIFS: Record<string, React.ReactNode> = {
  // Planner → build → evaluator loop: three nodes on a ring.
  "built-by-agents": (
    <>
      <circle cx="16" cy="16" r="10" className={muted} fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
      <circle cx="16" cy="6" r="2.6" fill="currentColor" />
      <circle cx="24.5" cy="21" r="2.6" fill="currentColor" />
      <circle cx="7.5" cy="21" r="2.6" fill="currentColor" />
    </>
  ),
  // Globe with meridians + a city marker.
  journey: (
    <>
      <circle cx="16" cy="16" r="11" className={muted} fill="none" stroke="currentColor" strokeWidth="1.5" />
      <ellipse cx="16" cy="16" rx="4.5" ry="11" className={muted} fill="none" stroke="currentColor" strokeWidth="1.2" />
      <line x1="5" y1="16" x2="27" y2="16" className={muted} stroke="currentColor" strokeWidth="1.2" />
      <circle cx="21" cy="10.5" r="2.4" fill="currentColor" />
    </>
  ),
  // Flow field: stacked wavy lines.
  field: (
    <>
      <path d="M3 10 q6 -4 12 0 t14 0" className={muted} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M3 16 q6 -4 12 0 t14 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M3 22 q6 -4 12 0 t14 0" className={muted} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),
  // Boarding pass: ticket with a perforation + barcode.
  "boarding-pass": (
    <>
      <rect x="4" y="9" width="24" height="14" rx="2.5" className={muted} fill="none" stroke="currentColor" strokeWidth="1.5" />
      <line x1="20" y1="9" x2="20" y2="23" className={muted} stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 2" />
      <g fill="currentColor">
        <rect x="22" y="12" width="1.2" height="8" />
        <rect x="24" y="12" width="0.8" height="8" />
        <rect x="25.6" y="12" width="1.4" height="8" />
      </g>
      <rect x="6.5" y="12" width="9" height="2" rx="1" fill="currentColor" />
      <rect x="6.5" y="16.5" width="6" height="1.6" rx="0.8" className={muted} fill="currentColor" />
    </>
  ),
  // Rope type: a sagging strand with beads.
  "rope-type": (
    <>
      <circle cx="5" cy="8" r="1.4" className={muted} fill="currentColor" />
      <circle cx="27" cy="8" r="1.4" className={muted} fill="currentColor" />
      <path d="M5 8 Q16 28 27 8" className={muted} fill="none" stroke="currentColor" strokeWidth="1.4" />
      <g fill="currentColor">
        <circle cx="9.5" cy="14.3" r="2" />
        <circle cx="16" cy="18.5" r="2.2" />
        <circle cx="22.5" cy="14.3" r="2" />
      </g>
    </>
  ),
  // Shatter type: a glyph fractured into Voronoi shards.
  "shatter-type": (
    <>
      <rect x="4" y="7" width="24" height="18" rx="2" className={muted} fill="none" stroke="currentColor" strokeWidth="1.2" />
      <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none">
        <path d="M16 7 L13 15 L18 20 L16 25" />
        <path d="M13 15 L4 13" />
        <path d="M13 15 L7 25" />
        <path d="M18 20 L28 18" />
        <path d="M18 20 L22 25" />
        <path d="M13 15 L20 11 L28 9" />
        <path d="M20 11 L18 20" />
      </g>
    </>
  ),
  // ASCII engine: a little grid of glyphs.
  "ascii-engine": (
    <g
      fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
      fontSize="7"
      fontWeight="600"
      textAnchor="middle"
    >
      <text x="9" y="12" fill="currentColor">#</text>
      <text x="16" y="12" className={muted} fill="currentColor">0</text>
      <text x="23" y="12" fill="currentColor">1</text>
      <text x="9" y="20" className={muted} fill="currentColor">/</text>
      <text x="16" y="20" fill="currentColor">@</text>
      <text x="23" y="20" className={muted} fill="currentColor">.</text>
      <text x="9" y="28" fill="currentColor">:</text>
      <text x="16" y="28" className={muted} fill="currentColor">+</text>
      <text x="23" y="28" fill="currentColor">%</text>
    </g>
  ),
};

// Deterministic symmetric identicon for slugs without a hand-drawn motif.
function Identicon({ seed }: { seed: string }) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const grid = 5;
  const cell = 32 / grid;
  const rects: React.ReactNode[] = [];
  for (let r = 0; r < grid; r++) {
    for (let c = 0; c < 3; c++) {
      const on = (h >> (r * 3 + c)) & 1;
      if (!on) continue;
      for (const x of c === 2 ? [c] : [c, grid - 1 - c]) {
        rects.push(
          <rect
            key={`${r}-${x}`}
            x={x * cell + 3}
            y={r * cell + 3}
            width={cell - 6}
            height={cell - 6}
            rx={1.5}
            fill="currentColor"
          />
        );
      }
    }
  }
  return <>{rects}</>;
}

export default function AppThumb({ slug, className }: Props) {
  const motif = MOTIFS[slug] ?? <Identicon seed={slug} />;
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-lg border border-border bg-surface-2 text-accent ${className ?? ""}`}
      aria-hidden
    >
      <svg viewBox="0 0 32 32" className="h-[70%] w-[70%]">
        {motif}
      </svg>
    </span>
  );
}
