"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Scissors, MousePointer2, RotateCcw } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import type { Theme } from "@/lib/theme";

/**
 * RopeType — a word spelled out in glowing beads strung on soft-body rope.
 *
 * A from-scratch 2D Verlet integrator with a Jakobsen distance-constraint
 * relaxation solver. Each letter is sampled into a chain of point masses; the
 * letters hang from anchors along a top rail and are linked together into one
 * continuous phrase. Grab any bead and fling it — the whole phrase sags, swings
 * and snaps back. Switch to the scissors and cut a strand to watch it fall.
 *
 * This is string / soft-body physics on a raw canvas (no WebGL, no Three.js),
 * deliberately distinct from the rigid spring-driven CSS pieces in the gallery.
 */

// ---------------------------------------------------------------------------
// Theme palette — read straight from the site's semantic colors so the piece
// tracks light / dark / sunset. (Canvas can't read CSS tokens, so mirror them.)
// ---------------------------------------------------------------------------

type Palette = {
  rope: string; // the connecting strand
  bead: string; // bead fill
  beadCore: string; // hot inner core
  glow: string; // glow halo (rgba-capable)
  accent: string; // accent beads / grabbed strand
  anchor: string; // top-rail anchors
  ghost: string; // faint guide / cut hint
};

const PALETTES: Record<Theme, Palette> = {
  light: {
    rope: "#94a3b8",
    bead: "#2563eb",
    beadCore: "#bfdbfe",
    glow: "37, 99, 235",
    accent: "#0ea5e9",
    anchor: "#5f6b7a",
    ghost: "#cbd5e1",
  },
  dark: {
    rope: "#3a4452",
    bead: "#6aa8ff",
    beadCore: "#dbeafe",
    glow: "106, 168, 255",
    accent: "#38bdf8",
    anchor: "#46566b",
    ghost: "#2a323c",
  },
  sunset: {
    rope: "#b79873",
    bead: "#c2410c",
    beadCore: "#fed7aa",
    glow: "194, 65, 12",
    accent: "#ea580c",
    anchor: "#7c6047",
    ghost: "#e6d2bb",
  },
};

// ---------------------------------------------------------------------------
// 5x7 stroke font. Each glyph is a list of polylines in a 0..1 grid (x: 0..1
// across 5 cols, y: 0..1 down 7 rows). Sampled into evenly-spaced beads so the
// letterforms read clearly while staying physical.
// ---------------------------------------------------------------------------

type Poly = [number, number][];

const GLYPHS: Record<string, Poly[]> = {
  M: [
    [
      [0, 1],
      [0, 0],
      [0.5, 0.55],
      [1, 0],
      [1, 1],
    ],
  ],
  O: [
    [
      [0.18, 0.12],
      [0.82, 0.12],
      [1, 0.5],
      [0.82, 0.88],
      [0.18, 0.88],
      [0, 0.5],
      [0.18, 0.12],
    ],
  ],
  N: [
    [
      [0, 1],
      [0, 0],
      [1, 1],
      [1, 0],
    ],
  ],
  T: [
    [
      [0, 0],
      [1, 0],
    ],
    [
      [0.5, 0],
      [0.5, 1],
    ],
  ],
  E: [
    [
      [1, 0],
      [0, 0],
      [0, 1],
      [1, 1],
    ],
    [
      [0, 0.5],
      [0.78, 0.5],
    ],
  ],
  A: [
    [
      [0, 1],
      [0.5, 0],
      [1, 1],
    ],
    [
      [0.18, 0.62],
      [0.82, 0.62],
    ],
  ],
  D: [
    [
      [0, 1],
      [0, 0],
      [0.6, 0],
      [1, 0.5],
      [0.6, 1],
      [0, 1],
    ],
  ],
  B: [
    [
      [0, 1],
      [0, 0],
      [0.7, 0],
      [0.92, 0.25],
      [0.7, 0.5],
      [0, 0.5],
    ],
    [
      [0.7, 0.5],
      [0.96, 0.75],
      [0.7, 1],
      [0, 1],
    ],
  ],
  Y: [
    [
      [0, 0],
      [0.5, 0.5],
      [1, 0],
    ],
    [
      [0.5, 0.5],
      [0.5, 1],
    ],
  ],
  G: [
    [
      [1, 0.18],
      [0.55, 0],
      [0.12, 0.22],
      [0, 0.5],
      [0.12, 0.78],
      [0.55, 1],
      [1, 0.82],
      [1, 0.58],
      [0.55, 0.58],
    ],
  ],
  S: [
    [
      [1, 0.16],
      [0.5, 0],
      [0.05, 0.18],
      [0.2, 0.45],
      [0.8, 0.55],
      [0.95, 0.82],
      [0.5, 1],
      [0, 0.84],
    ],
  ],
  H: [
    [
      [0, 0],
      [0, 1],
    ],
    [
      [1, 0],
      [1, 1],
    ],
    [
      [0, 0.5],
      [1, 0.5],
    ],
  ],
  L: [
    [
      [0, 0],
      [0, 1],
      [0.9, 1],
    ],
  ],
  R: [
    [
      [0, 1],
      [0, 0],
      [0.7, 0],
      [0.95, 0.28],
      [0.7, 0.52],
      [0, 0.52],
    ],
    [
      [0.45, 0.52],
      [1, 1],
    ],
  ],
  I: [
    [
      [0.15, 0],
      [0.85, 0],
    ],
    [
      [0.5, 0],
      [0.5, 1],
    ],
    [
      [0.15, 1],
      [0.85, 1],
    ],
  ],
  P: [
    [
      [0, 1],
      [0, 0],
      [0.7, 0],
      [0.95, 0.28],
      [0.7, 0.55],
      [0, 0.55],
    ],
  ],
  C: [
    [
      [1, 0.2],
      [0.55, 0],
      [0.12, 0.22],
      [0, 0.5],
      [0.12, 0.78],
      [0.55, 1],
      [1, 0.8],
    ],
  ],
  U: [
    [
      [0, 0],
      [0, 0.7],
      [0.2, 0.95],
      [0.5, 1],
      [0.8, 0.95],
      [1, 0.7],
      [1, 0],
    ],
  ],
  // Space is handled separately (no polylines).
  " ": [],
};

// ---------------------------------------------------------------------------
// Verlet model
// ---------------------------------------------------------------------------

type Point = {
  x: number;
  y: number;
  px: number; // previous position
  py: number;
  pinned: boolean;
  // index into points[] for the bead's "home" rest pose (used by the gentle
  // restoring drift so the phrase reassembles after being flung).
  hx: number;
  hy: number;
  glyph: number; // which letter this bead belongs to (for accent + cuts)
  isBead: boolean; // true = visible bead, false = invisible rope filler
  r: number; // draw radius
  // true while still reachable from a pinned anchor; cleared when a strand is
  // cut so detached pieces fall under gravity instead of homing back.
  attached: boolean;
};

type Constraint = {
  a: number;
  b: number;
  rest: number;
  cut: boolean;
  // structural = letter stroke (thick), tether = anchor line, link = inter-letter
  kind: "stroke" | "tether" | "link";
};

type Model = {
  points: Point[];
  constraints: Constraint[];
  width: number;
  height: number;
};

function dist(ax: number, ay: number, bx: number, by: number) {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.hypot(dx, dy);
}

// Resample a polyline into points spaced ~`step` apart (so beads are even),
// walking by arc length so spacing is continuous across segment joints.
function resample(poly: Poly, step: number): [number, number][] {
  if (poly.length === 0) return [];
  if (poly.length === 1) return [poly[0]];
  const out: [number, number][] = [poly[0]];
  let distSinceLast = 0; // arc length accumulated since the last emitted point
  for (let i = 1; i < poly.length; i++) {
    const [x0, y0] = poly[i - 1];
    const [x1, y1] = poly[i];
    const segLen = dist(x0, y0, x1, y1);
    if (segLen < 1e-6) continue;
    let travelled = 0; // distance along this segment already consumed
    // Emit a point each time we accumulate `step` of arc length.
    while (distSinceLast + (segLen - travelled) >= step) {
      const need = step - distSinceLast;
      travelled += need;
      const t = travelled / segLen;
      out.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t]);
      distSinceLast = 0;
    }
    distSinceLast += segLen - travelled;
  }
  // Always include the final vertex so closed/open strokes terminate cleanly.
  const lastV = poly[poly.length - 1];
  const lastO = out[out.length - 1];
  if (dist(lastV[0], lastV[1], lastO[0], lastO[1]) > step * 0.35) {
    out.push(lastV);
  }
  return out;
}

/**
 * Build the full physics model for a phrase. The layout is computed in CSS
 * pixels given the stage size; letters are scaled to fit and hung from a top
 * rail by short tethers, then chained left-to-right by a slack link so the
 * whole phrase behaves as one soft body.
 */
function buildModel(phrase: string, W: number, H: number): Model {
  const points: Point[] = [];
  const constraints: Constraint[] = [];

  const letters = phrase.toUpperCase().split("");
  const cellAspect = 5 / 7; // glyph grid w:h

  // Choose a letter height that fits both width and height budgets.
  const maxH = H * 0.42;
  const gap = 0.45; // gap between letters in cell-widths
  const totalCells = letters.reduce(
    (acc, ch) => acc + (ch === " " ? 0.6 : 1) + gap,
    -gap
  );
  const byWidth = (W * 0.86) / (totalCells * cellAspect);
  const letterH = Math.min(maxH, byWidth);
  const letterW = letterH * cellAspect;
  const stepCell = 0.16; // bead spacing in glyph-grid units

  const blockW =
    letters.reduce(
      (acc, ch) => acc + (ch === " " ? 0.6 : 1) * letterW + gap * letterW,
      -gap * letterW
    ) || letterW;
  let cursorX = (W - blockW) / 2;
  const topY = H * 0.16; // where letters start vertically
  const railY = topY - letterH * 0.42; // anchor rail above the letters

  // Track the topmost bead of each letter so we can chain letters together and
  // tether them to the rail.
  const letterTopIndex: number[] = [];

  letters.forEach((ch, gi) => {
    if (ch === " ") {
      cursorX += 0.6 * letterW + gap * letterW;
      letterTopIndex.push(-1);
      return;
    }
    const polys = GLYPHS[ch] ?? GLYPHS.O;
    let topMost = -1;
    let topMostY = Infinity;

    polys.forEach((poly) => {
      const sampled = resample(poly, stepCell);
      let prev = -1;
      sampled.forEach(([gx, gy]) => {
        const x = cursorX + gx * letterW;
        const y = topY + gy * letterH;
        const idx = points.length;
        points.push({
          x,
          y,
          px: x,
          py: y,
          pinned: false,
          hx: x,
          hy: y,
          glyph: gi,
          isBead: true,
          r: Math.max(2.2, letterH * 0.05),
          attached: true,
        });
        if (y < topMostY) {
          topMostY = y;
          topMost = idx;
        }
        if (prev >= 0) {
          constraints.push({
            a: prev,
            b: idx,
            rest: dist(
              points[prev].x,
              points[prev].y,
              points[idx].x,
              points[idx].y
            ),
            cut: false,
            kind: "stroke",
          });
        }
        prev = idx;
      });
    });

    // Tether the letter's topmost bead to a fixed anchor on the rail with a
    // short string of invisible filler points (so the strand visibly droops).
    const anchorX = points[topMost]?.x ?? cursorX + letterW / 2;
    const tetherSegs = 3;
    let prevTether = -1;
    for (let s = 0; s <= tetherSegs; s++) {
      const t = s / tetherSegs;
      // Filler points spaced evenly from the rail (pinned anchor) down to the
      // letter's topmost bead, so the strand droops between them.
      const y = railY + (topMostY - railY) * t;
      const idx = points.length;
      const pinned = s === 0;
      points.push({
        x: anchorX,
        y,
        px: anchorX,
        py: y,
        pinned,
        hx: anchorX,
        hy: y,
        glyph: gi,
        isBead: false,
        r: pinned ? Math.max(3, letterH * 0.045) : 0,
        attached: true,
      });
      if (prevTether >= 0) {
        constraints.push({
          a: prevTether,
          b: idx,
          rest: dist(
            points[prevTether].x,
            points[prevTether].y,
            points[idx].x,
            points[idx].y
          ),
          cut: false,
          kind: "tether",
        });
      }
      prevTether = idx;
    }
    // Connect last filler to the letter's topmost bead.
    if (prevTether >= 0 && topMost >= 0) {
      constraints.push({
        a: prevTether,
        b: topMost,
        rest: dist(
          points[prevTether].x,
          points[prevTether].y,
          points[topMost].x,
          points[topMost].y
        ),
        cut: false,
        kind: "tether",
      });
    }

    letterTopIndex.push(topMost);
    cursorX += letterW + gap * letterW;
  });

  // Chain adjacent letters together by a slack link between their topmost beads
  // so the phrase swings as one connected soft body.
  let prevTop = -1;
  for (let gi = 0; gi < letterTopIndex.length; gi++) {
    const top = letterTopIndex[gi];
    if (top < 0) {
      prevTop = -1;
      continue;
    }
    if (prevTop >= 0) {
      const rest = dist(
        points[prevTop].x,
        points[prevTop].y,
        points[top].x,
        points[top].y
      );
      constraints.push({
        a: prevTop,
        b: top,
        rest: rest * 1.04, // a touch of slack so it sags
        cut: false,
        kind: "link",
      });
    }
    prevTop = top;
  }

  return { points, constraints, width: W, height: H };
}

/**
 * Flood-fill from every pinned anchor across uncut constraints to mark which
 * points are still attached. Detached points lose their homing pull so cut
 * pieces fall away naturally. O(points + constraints), called only on cuts.
 */
function recomputeAttachment(m: Model) {
  const { points, constraints } = m;
  // Build adjacency over uncut constraints.
  const adj: number[][] = points.map(() => []);
  for (const c of constraints) {
    if (c.cut) continue;
    adj[c.a].push(c.b);
    adj[c.b].push(c.a);
  }
  const seen = new Array<boolean>(points.length).fill(false);
  const stack: number[] = [];
  for (let i = 0; i < points.length; i++) {
    if (points[i].pinned) {
      seen[i] = true;
      stack.push(i);
    }
  }
  while (stack.length) {
    const i = stack.pop() as number;
    for (const j of adj[i]) {
      if (!seen[j]) {
        seen[j] = true;
        stack.push(j);
      }
    }
  }
  for (let i = 0; i < points.length; i++) points[i].attached = seen[i];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

// Visible phrases the tap-to-change button cycles through. The signature phrase
// "MADE BY AGENTS" is intentionally NOT here — it's the hidden Konami reward.
const PHRASES = ["MONTE", "STRING", "PHYSICS"] as const;
const SECRET_PHRASE = "MADE BY AGENTS";
const KONAMI = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

export default function RopeType() {
  const { theme, reduceMotion } = useTheme();

  // Client-only mount guard: keeps canvas / window access out of SSR so the
  // static export render stays clean (same effect as dynamic ssr:false).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [phraseIdx, setPhraseIdx] = useState(0);
  const [mode, setMode] = useState<"grab" | "cut">("grab");
  const [secret, setSecret] = useState(false);

  // Refs the render loop reads without re-subscribing.
  const themeRef = useRef(theme);
  const reduceRef = useRef(reduceMotion);
  const modeRef = useRef(mode);
  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);
  useEffect(() => {
    reduceRef.current = reduceMotion;
  }, [reduceMotion]);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const phrase = useMemo(() => {
    if (secret) return SECRET_PHRASE;
    return PHRASES[phraseIdx % PHRASES.length];
  }, [phraseIdx, secret]);

  // Konami listener -> reveal the hidden "MADE BY AGENTS" phrase.
  useEffect(() => {
    if (!mounted) return;
    let progress = 0;
    const onKey = (e: KeyboardEvent) => {
      const key = KONAMI[progress];
      if (e.key.toLowerCase() === key.toLowerCase()) {
        progress++;
        if (progress === KONAMI.length) {
          setSecret((s) => !s);
          progress = 0;
        }
      } else {
        // Allow restart if the wrong key was actually the first key.
        progress = e.key === KONAMI[0] ? 1 : 0;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mounted]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<Model | null>(null);
  // A version counter forces a model rebuild (phrase change / resize) inside the
  // animation effect without re-creating the whole loop.
  const rebuildKey = `${phrase}`;

  const reset = useCallback(() => {
    const m = modelRef.current;
    if (!m) return;
    for (const p of m.points) {
      p.x = p.hx;
      p.y = p.hy;
      p.px = p.hx;
      p.py = p.hy;
      p.attached = true;
    }
    for (const c of m.constraints) c.cut = false;
  }, []);

  // Main physics + render loop. Rebuilds the model when the phrase or size
  // changes; runs Verlet integration + Jakobsen relaxation each frame.
  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let W = 0;
    let H = 0;
    let dpr = 1;

    // Pointer / interaction state.
    const pointer = { x: 0, y: 0, down: false, has: false };
    let grabbed = -1; // index of grabbed point, or -1
    let prevPx = 0;
    let prevPy = 0;

    const rebuild = () => {
      const rect = wrap.getBoundingClientRect();
      W = Math.max(1, rect.width);
      H = Math.max(1, rect.height);
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      // Preserve grab/cut state isn't meaningful across a rebuild; just rebuild.
      modelRef.current = buildModel(phrase, W, H);
      grabbed = -1;
    };

    rebuild();

    const ro = new ResizeObserver(() => {
      // Only rebuild if the size actually changed meaningfully.
      const rect = wrap.getBoundingClientRect();
      if (
        Math.abs(rect.width - W) > 2 ||
        Math.abs(rect.height - H) > 2 ||
        !modelRef.current
      ) {
        rebuild();
      }
    });
    ro.observe(wrap);

    // ---- pointer handlers -------------------------------------------------
    const toLocal = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.has = true;
    };

    const pickNearest = (maxDist: number): number => {
      const m = modelRef.current;
      if (!m) return -1;
      let best = -1;
      let bestD = maxDist;
      for (let i = 0; i < m.points.length; i++) {
        const p = m.points[i];
        if (p.pinned) continue;
        const d = dist(p.x, p.y, pointer.x, pointer.y);
        // Prefer beads, but allow filler when nothing closer.
        const eff = p.isBead ? d : d * 1.6;
        if (eff < bestD) {
          bestD = eff;
          best = i;
        }
      }
      return best;
    };

    const cutNear = () => {
      const m = modelRef.current;
      if (!m) return;
      // Cut every constraint whose midpoint is within blade range of the
      // pointer (so dragging the scissors slices through strands).
      const R = Math.max(14, H * 0.03);
      let didCut = false;
      for (const c of m.constraints) {
        if (c.cut) continue;
        const a = m.points[c.a];
        const b = m.points[c.b];
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        if (dist(mx, my, pointer.x, pointer.y) < R) {
          c.cut = true;
          didCut = true;
        }
      }
      if (didCut) recomputeAttachment(m);
    };

    const onDown = (e: PointerEvent) => {
      toLocal(e);
      pointer.down = true;
      canvas.setPointerCapture(e.pointerId);
      if (modeRef.current === "cut") {
        cutNear();
      } else {
        grabbed = pickNearest(Math.max(28, H * 0.07));
        prevPx = pointer.x;
        prevPy = pointer.y;
      }
    };
    const onMove = (e: PointerEvent) => {
      toLocal(e);
      if (pointer.down && modeRef.current === "cut") cutNear();
    };
    const onUp = (e: PointerEvent) => {
      pointer.down = false;
      grabbed = -1;
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {}
    };
    const onLeave = () => {
      pointer.has = false;
      if (!pointer.down) grabbed = -1;
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointerleave", onLeave);

    // ---- simulation -------------------------------------------------------
    const GRAVITY = 1400; // px/s^2
    const ITERATIONS = 8; // Jakobsen relaxation passes
    const FRICTION = 0.985;
    const REST_DRIFT = 0.012; // gentle pull back to home pose (~2s settle)

    let last = performance.now();

    const step = (dt: number) => {
      const m = modelRef.current;
      if (!m) return;
      const pts = m.points;
      const cons = m.constraints;

      // Move grabbed point straight to the pointer; record its velocity so the
      // release "flings" it (Verlet carries this naturally via px/py).
      if (grabbed >= 0 && modeRef.current === "grab") {
        const p = pts[grabbed];
        p.px = prevPx;
        p.py = prevPy;
        p.x = pointer.x;
        p.y = pointer.y;
        prevPx = p.x;
        prevPy = p.y;
      }

      // Integrate.
      const g = GRAVITY * dt * dt;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        if (p.pinned) continue;
        if (i === grabbed && modeRef.current === "grab") continue;
        const vx = (p.x - p.px) * FRICTION;
        const vy = (p.y - p.py) * FRICTION;
        p.px = p.x;
        p.py = p.y;
        p.x += vx;
        p.y += vy + g;
        // Gentle homing drift so the connected phrase reassembles after being
        // flung (rope still sags under gravity at rest). Detached pieces — a
        // strand you've cut — skip homing and simply fall.
        if (p.attached) {
          p.x += (p.hx - p.x) * REST_DRIFT;
          p.y += (p.hy - p.y) * REST_DRIFT;
        }
      }

      // Relax distance constraints.
      for (let k = 0; k < ITERATIONS; k++) {
        for (let c = 0; c < cons.length; c++) {
          const con = cons[c];
          if (con.cut) continue;
          const a = pts[con.a];
          const b = pts[con.b];
          let dx = b.x - a.x;
          let dy = b.y - a.y;
          const d = Math.hypot(dx, dy) || 1e-6;
          const diff = (d - con.rest) / d;
          // links are a touch springier (let the phrase swing); strokes stiff.
          const stiff = con.kind === "link" ? 0.5 : 1;
          const f = 0.5 * diff * stiff;
          dx *= f;
          dy *= f;
          if (!a.pinned) {
            a.x += dx;
            a.y += dy;
          }
          if (!b.pinned) {
            b.x -= dx;
            b.y -= dy;
          }
        }
      }

      // Keep attached beads inside the stage horizontally so the live phrase
      // never escapes the frame. Detached (cut) pieces are free to fall off.
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        if (p.pinned || !p.attached) continue;
        const r = p.r || 2;
        if (p.x < r) p.x = r;
        else if (p.x > W - r) p.x = W - r;
      }
    };

    // ---- draw -------------------------------------------------------------
    const draw = () => {
      const m = modelRef.current;
      if (!m) return;
      const pal = PALETTES[themeRef.current];
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      const pts = m.points;
      const cons = m.constraints;

      // 1) Rope strands (under the beads). Tethers + links drawn thin & soft.
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (const c of cons) {
        if (c.cut) continue;
        if (c.kind === "stroke") continue; // strokes are rendered via beads
        const a = pts[c.a];
        const b = pts[c.b];
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = pal.rope;
        ctx.globalAlpha = c.kind === "tether" ? 0.55 : 0.4;
        ctx.lineWidth = c.kind === "tether" ? 1.4 : 1.1;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // 2) Letter strokes drawn as a continuous glowing strand under the beads,
      //    so the letterforms stay legible even between bead centers.
      for (const c of cons) {
        if (c.cut || c.kind !== "stroke") continue;
        const a = pts[c.a];
        const b = pts[c.b];
        const accentLetter = secret; // tint when in the secret phrase
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = accentLetter ? pal.accent : pal.bead;
        ctx.globalAlpha = 0.85;
        ctx.lineWidth = Math.max(2.5, (a.r + b.r) * 0.7);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // 3) Anchors on the rail.
      for (const p of pts) {
        if (!p.pinned) continue;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = pal.anchor;
        ctx.fill();
      }

      // 4) Glowing beads. Glow pass uses additive blending so overlapping
      //    halos brighten — beads read as lit, brightest in dark/sunset.
      const grabbedIdx = grabbed;
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        if (!p.isBead) continue;
        const isGrabbedLetter =
          grabbedIdx >= 0 && pts[grabbedIdx].glyph === p.glyph;
        const r = p.r;
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3.4);
        const intensity = isGrabbedLetter ? 0.6 : 0.34;
        grad.addColorStop(0, `rgba(${pal.glow}, ${intensity})`);
        grad.addColorStop(1, `rgba(${pal.glow}, 0)`);
        ctx.beginPath();
        ctx.fillStyle = grad;
        ctx.arc(p.x, p.y, r * 3.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
      // bead bodies + hot cores (second pass so cores sit above glows)
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        if (!p.isBead) continue;
        const isGrabbedLetter =
          grabbedIdx >= 0 && pts[grabbedIdx].glyph === p.glyph;
        const r = p.r;
        ctx.beginPath();
        ctx.fillStyle =
          isGrabbedLetter || secret ? pal.accent : pal.bead;
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
        // hot inner core, offset slightly up-left for a lit look
        ctx.beginPath();
        ctx.fillStyle = pal.beadCore;
        ctx.globalAlpha = 0.9;
        ctx.arc(p.x - r * 0.28, p.y - r * 0.28, r * 0.42, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // 5) Cursor affordance.
      if (pointer.has) {
        if (modeRef.current === "cut") {
          ctx.beginPath();
          ctx.strokeStyle = pal.accent;
          ctx.globalAlpha = 0.7;
          ctx.lineWidth = 1.2;
          ctx.setLineDash([4, 4]);
          ctx.arc(pointer.x, pointer.y, Math.max(14, H * 0.03), 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.globalAlpha = 1;
        }
      }
    };

    const loop = (now: number) => {
      const m = modelRef.current;
      if (!m) {
        raf = requestAnimationFrame(loop);
        return;
      }
      let dt = (now - last) / 1000;
      last = now;
      // Clamp dt for stability after tab switches / hitches.
      dt = Math.min(dt, 1 / 30);

      const reduce = reduceRef.current;
      if (reduce) {
        // Quiet mode: hold the home pose (no integration), still allow grabbing
        // is disabled since nothing simulates — just present the legible phrase.
        for (const p of m.points) {
          p.x = p.hx;
          p.y = p.hy;
          p.px = p.hx;
          p.py = p.hy;
        }
      } else {
        // Fixed-step substeps for stable constraints regardless of frame time.
        const SUB = 2;
        const sdt = dt / SUB;
        for (let s = 0; s < SUB; s++) step(sdt);
      }
      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointerleave", onLeave);
    };
    // rebuildKey drives a full rebuild when the phrase changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, rebuildKey, secret]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-bg">
      <div ref={wrapRef} className="absolute inset-0">
        {mounted ? (
          <canvas
            ref={canvasRef}
            className={
              mode === "cut"
                ? "block h-full w-full cursor-crosshair touch-none"
                : "block h-full w-full cursor-grab touch-none active:cursor-grabbing"
            }
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted">
            Loading rope…
          </div>
        )}
      </div>

      {/* Title overlay */}
      <div className="pointer-events-none absolute left-4 top-4 max-w-[75%]">
        <div className="inline-block rounded-lg border border-border bg-bg/60 px-3 py-2 backdrop-blur">
          <p className="text-sm font-medium text-fg">Rope Type</p>
          <p className="text-xs text-muted">
            {reduceMotion
              ? "Reduced motion — phrase held at rest"
              : mode === "cut"
                ? "Drag across a strand to cut it"
                : "Grab a letter and fling it"}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute right-4 top-4 flex items-center gap-1.5">
        <div className="flex overflow-hidden rounded-lg border border-border bg-bg/60 backdrop-blur">
          <button
            type="button"
            onClick={() => setMode("grab")}
            aria-pressed={mode === "grab"}
            title="Grab mode"
            className={[
              "flex items-center gap-1.5 px-3 py-2 text-xs transition-colors",
              mode === "grab"
                ? "bg-accent text-[var(--accent-contrast)]"
                : "text-muted hover:text-fg",
            ].join(" ")}
          >
            <MousePointer2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Grab</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("cut")}
            aria-pressed={mode === "cut"}
            title="Cut mode"
            className={[
              "flex items-center gap-1.5 border-l border-border px-3 py-2 text-xs transition-colors",
              mode === "cut"
                ? "bg-accent text-[var(--accent-contrast)]"
                : "text-muted hover:text-fg",
            ].join(" ")}
          >
            <Scissors className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Cut</span>
          </button>
        </div>
        <button
          type="button"
          onClick={reset}
          title="Reset"
          className="flex items-center gap-1.5 rounded-lg border border-border bg-bg/60 px-3 py-2 text-xs text-muted backdrop-blur transition-colors hover:text-fg"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      {/* Phrase toggle (visible) + hidden Konami hint */}
      <div className="absolute inset-x-0 bottom-3 flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={() => {
            setSecret(false);
            setPhraseIdx((i) => (i + 1) % PHRASES.length);
          }}
          className="pointer-events-auto rounded-full border border-border bg-bg/60 px-3 py-1 text-xs text-muted backdrop-blur transition-colors hover:text-fg"
        >
          {secret ? "made by agents ✦" : `spelling “${phrase}” — tap to change`}
        </button>
      </div>
    </div>
  );
}
