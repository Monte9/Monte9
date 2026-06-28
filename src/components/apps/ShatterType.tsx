"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw, Sparkles } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import type { Theme } from "@/lib/theme";

/**
 * ShatterType — a word rendered as a pane of glass, fractured into a real
 * Voronoi mosaic. Click anywhere and the shards nearest the impact explode
 * outward and tumble under gravity with spin and shadow, then drift back and
 * re-fuse into the legible word.
 *
 * Technique — a from-scratch computational-geometry shatter engine on 2D canvas:
 *   1. The word is rasterized to an offscreen buffer. Only pixels covered by the
 *      glyphs are eligible to seed Voronoi cell sites, so the fracture follows
 *      the letterforms (dense inside strokes, none in the negative space).
 *   2. A Voronoi diagram is computed over those sites by clipping a bounding
 *      polygon against the perpendicular bisector half-planes between each site
 *      and its neighbours (Sutherland–Hodgman) — no library, no Delaunay table.
 *   3. Each cell becomes a textured polygon shard. Its slice of the rasterized
 *      letterform is sampled per-vertex from the offscreen buffer and drawn with
 *      a clipped image blit, so every fragment literally carries its piece of
 *      the glyph — a real fracture, not an opacity trick.
 *   4. A click injects a radial blast: each shard gets velocity + angular
 *      velocity + a depth impulse falling off with distance from impact. Shards
 *      tumble under gravity, fade with depth, then ease back along return springs
 *      and re-fuse into the word.
 *
 * Spells MONTE by default — the word that shatters and re-fuses — a light nod to
 * building things back together, but it stands as a pure interaction toy.
 *
 * Pure 2D canvas: no WebGL, no Three.js, deliberately distinct from the rope
 * (Verlet) and ascii (render-to-text) pieces in the gallery.
 */

// ---------------------------------------------------------------------------
// Theme palette — canvas can't read CSS tokens, so mirror the semantic colors
// so the piece tracks light / dark / sunset.
// ---------------------------------------------------------------------------

type Palette = {
  glass: string; // shard body fill
  glassEdge: string; // bevel / crack lines between shards
  ink: string; // the letterform painted onto the glass
  accent: string; // highlight + impact ring
  accentGlow: string; // rgb triplet for additive glow
  spec: string; // specular sheen on the pane
  shadow: string; // rgba shadow under flung shards
};

const PALETTES: Record<Theme, Palette> = {
  light: {
    glass: "#dbe6f5",
    glassEdge: "#9fb2cc",
    ink: "#1d3a66",
    accent: "#2563eb",
    accentGlow: "37, 99, 235",
    spec: "#ffffff",
    shadow: "15, 23, 42",
  },
  dark: {
    glass: "#1e2a3a",
    glassEdge: "#3a4d66",
    ink: "#bcd4ff",
    accent: "#6aa8ff",
    accentGlow: "106, 168, 255",
    spec: "#cfe2ff",
    shadow: "0, 0, 0",
  },
  sunset: {
    glass: "#efd9bf",
    glassEdge: "#c19a6b",
    ink: "#7a3310",
    accent: "#c2410c",
    accentGlow: "194, 65, 12",
    spec: "#fff5e8",
    shadow: "60, 30, 8",
  },
};

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

type Pt = { x: number; y: number };
type Poly = Pt[];

function polyCentroid(poly: Poly): Pt {
  // Area-weighted centroid; falls back to vertex average for degenerate polys.
  let a = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    const cross = p.x * q.y - q.x * p.y;
    a += cross;
    cx += (p.x + q.x) * cross;
    cy += (p.y + q.y) * cross;
  }
  a *= 0.5;
  if (Math.abs(a) < 1e-6) {
    let sx = 0;
    let sy = 0;
    for (const p of poly) {
      sx += p.x;
      sy += p.y;
    }
    return { x: sx / poly.length, y: sy / poly.length };
  }
  return { x: cx / (6 * a), y: cy / (6 * a) };
}

function polyBounds(poly: Poly) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of poly) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY };
}

/**
 * Clip a convex/closed polygon by the half-plane that keeps points closer to
 * `site` than to `other` — i.e. the side of the perpendicular bisector that
 * contains `site`. Sutherland–Hodgman against a single line. This is the core
 * of the Voronoi construction: a cell is the input bounding box clipped by the
 * bisector of the site against each of its (nearby) neighbours.
 */
function clipByBisector(poly: Poly, site: Pt, other: Pt): Poly {
  // Bisector: points p with dot(p - mid, n) <= 0 are on the `site` side, where
  // n = (other - site). Keep those.
  const nx = other.x - site.x;
  const ny = other.y - site.y;
  const mx = (site.x + other.x) * 0.5;
  const my = (site.y + other.y) * 0.5;
  const side = (p: Pt) => (p.x - mx) * nx + (p.y - my) * ny; // <=0 keeps

  const out: Poly = [];
  const n = poly.length;
  for (let i = 0; i < n; i++) {
    const cur = poly[i];
    const nxt = poly[(i + 1) % n];
    const dCur = side(cur);
    const dNxt = side(nxt);
    const curIn = dCur <= 0;
    const nxtIn = dNxt <= 0;
    if (curIn) out.push(cur);
    if (curIn !== nxtIn) {
      // Edge crosses the bisector — add the intersection point.
      const t = dCur / (dCur - dNxt);
      out.push({
        x: cur.x + (nxt.x - cur.x) * t,
        y: cur.y + (nxt.y - cur.y) * t,
      });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Shard model
// ---------------------------------------------------------------------------

type Shard = {
  // Local-space polygon (vertices relative to home centroid), so the shard can
  // be drawn with a single translate + rotate transform.
  local: Poly;
  home: Pt; // rest centroid in stage pixels
  bounds: { minX: number; minY: number; maxX: number; maxY: number }; // local
  // Live transform.
  x: number;
  y: number;
  rot: number;
  // Velocity.
  vx: number;
  vy: number;
  vr: number;
  // Depth: 0 = seated in the pane, >0 = lifted toward the viewer (scaled up +
  // shadow cast); negative is allowed transiently (pushed "into" the glass).
  depth: number;
  vDepth: number;
  // 0 = fully home (re-fused), 1 = fully disturbed. Drives the spring strength
  // and the visible crack glow.
  energy: number;
  seed: number; // per-shard random for sparkle/jitter
  hasInk: boolean; // whether this shard carries any glyph ink (drives glow)
};

type Scene = {
  shards: Shard[];
  // The rasterized word, drawn once and reused as the per-shard texture source.
  tex: HTMLCanvasElement;
  W: number;
  H: number;
};

// ---------------------------------------------------------------------------
// Scene construction
// ---------------------------------------------------------------------------

const WORDS = ["MONTE", "SHATTER", "GLASS"] as const;

/**
 * Rasterize `word` centered in a W×H buffer and return the buffer plus a
 * coverage test (alpha > threshold) sampled from its pixels.
 */
function rasterizeWord(
  word: string,
  W: number,
  H: number,
  ink: string,
): { tex: HTMLCanvasElement; covered: (x: number, y: number) => boolean } {
  const tex = document.createElement("canvas");
  tex.width = W;
  tex.height = H;
  const tctx = tex.getContext("2d")!;
  tctx.clearRect(0, 0, W, H);

  // Fit the word to the stage with margins. Binary-ish: pick a font size whose
  // measured width fits ~82% of the stage and whose cap height fits ~48%.
  const family =
    '"Helvetica Neue", Helvetica, Arial, "Segoe UI", system-ui, sans-serif';
  const targetW = W * 0.84;
  const targetH = H * 0.46;
  let size = targetH; // start from height budget
  tctx.font = `800 ${size}px ${family}`;
  let measured = tctx.measureText(word).width;
  if (measured > targetW) size *= targetW / measured;
  tctx.font = `800 ${Math.round(size)}px ${family}`;
  measured = tctx.measureText(word).width;

  tctx.textAlign = "center";
  tctx.textBaseline = "middle";
  tctx.fillStyle = ink;
  tctx.fillText(word, W / 2, H / 2);

  // Read back coverage. Cache the ImageData once.
  const img = tctx.getImageData(0, 0, W, H);
  const data = img.data;
  const covered = (x: number, y: number) => {
    const ix = x | 0;
    const iy = y | 0;
    if (ix < 0 || iy < 0 || ix >= W || iy >= H) return false;
    return data[(iy * W + ix) * 4 + 3] > 40;
  };

  return { tex, covered };
}

/**
 * Seed Voronoi sites: a jittered grid over the whole stage, but a site is only
 * KEPT if it (or a tight neighbourhood) covers glyph ink — so the fracture is
 * dense across the letters and sparse/large in the surrounding pane. A thin
 * ring of background sites is also kept so the letters sit inside a few big
 * "pane" shards rather than floating, which reads more like real glass.
 */
function seedSites(
  W: number,
  H: number,
  covered: (x: number, y: number) => boolean,
): Pt[] {
  const sites: Pt[] = [];
  // Cell size scales with stage so shard count stays sane on small screens.
  const minDim = Math.min(W, H);
  const inkStep = Math.max(16, minDim * 0.05); // dense on glyphs
  const bgStep = Math.max(46, minDim * 0.14); // sparse on the pane

  const jitter = (s: number) => (Math.random() - 0.5) * s * 0.7;

  // 1) Ink sites — only where the glyph is, on a fine jittered grid.
  for (let gy = inkStep * 0.5; gy < H; gy += inkStep) {
    for (let gx = inkStep * 0.5; gx < W; gx += inkStep) {
      const x = gx + jitter(inkStep);
      const y = gy + jitter(inkStep);
      // Sample a small neighbourhood so thin strokes still attract sites.
      if (
        covered(x, y) ||
        covered(x - inkStep * 0.4, y) ||
        covered(x + inkStep * 0.4, y) ||
        covered(x, y - inkStep * 0.4) ||
        covered(x, y + inkStep * 0.4)
      ) {
        sites.push({ x, y });
      }
    }
  }

  // 2) Background pane sites — coarse jittered grid everywhere NOT near ink, so
  //    the surrounding glass also cracks (large facets) and the whole pane
  //    shatters as one, not just the letters.
  for (let gy = bgStep * 0.5; gy < H; gy += bgStep) {
    for (let gx = bgStep * 0.5; gx < W; gx += bgStep) {
      const x = gx + jitter(bgStep);
      const y = gy + jitter(bgStep);
      // Skip if very close to an existing ink site (avoid slivers).
      let near = false;
      for (const s of sites) {
        const dx = s.x - x;
        const dy = s.y - y;
        if (dx * dx + dy * dy < inkStep * inkStep * 0.7) {
          near = true;
          break;
        }
      }
      if (!near) sites.push({ x, y });
    }
  }

  return sites;
}

/**
 * Build Voronoi cells for `sites` inside the stage rectangle. For each site we
 * clip the stage rectangle by the bisectors against its nearest neighbours
 * (K-nearest is enough for a Voronoi cell and keeps it O(n·k) instead of
 * O(n²)). Returns one polygon per site (some may be empty and are dropped).
 */
function buildVoronoi(sites: Pt[], W: number, H: number): Poly[] {
  const rect: Poly = [
    { x: 0, y: 0 },
    { x: W, y: 0 },
    { x: W, y: H },
    { x: 0, y: H },
  ];
  const N = sites.length;
  const K = Math.min(N - 1, 22); // neighbours to clip against
  const cells: Poly[] = [];

  // Precompute nothing fancy — N is a few hundred, K small; brute neighbour
  // sort per site is fine and avoids a spatial index.
  const order = new Array<number>(N);
  const distSq = new Float64Array(N);

  for (let i = 0; i < N; i++) {
    const s = sites[i];
    for (let j = 0; j < N; j++) {
      const dx = sites[j].x - s.x;
      const dy = sites[j].y - s.y;
      distSq[j] = j === i ? Infinity : dx * dx + dy * dy;
      order[j] = j;
    }
    // Partial selection of the K nearest (simple sort is fine at this scale).
    order.sort((a, b) => distSq[a] - distSq[b]);

    let cell: Poly = rect;
    for (let k = 0; k < K; k++) {
      const j = order[k];
      cell = clipByBisector(cell, s, sites[j]);
      if (cell.length < 3) break;
    }
    if (cell.length >= 3) cells.push(cell);
  }

  return cells;
}

function buildScene(word: string, W: number, H: number, ink: string): Scene {
  const { tex, covered } = rasterizeWord(word, W, H, ink);
  const sites = seedSites(W, H, covered);
  const cells = buildVoronoi(sites, W, H);

  const shards: Shard[] = cells.map((cell) => {
    const c = polyCentroid(cell);
    const local = cell.map((p) => ({ x: p.x - c.x, y: p.y - c.y }));
    const bounds = polyBounds(local);
    // Does this shard carry glyph ink? Sample its centroid + a few inset points.
    let hasInk = covered(c.x, c.y);
    if (!hasInk) {
      for (const p of cell) {
        const sx = c.x + (p.x - c.x) * 0.6;
        const sy = c.y + (p.y - c.y) * 0.6;
        if (covered(sx, sy)) {
          hasInk = true;
          break;
        }
      }
    }
    return {
      local,
      home: c,
      bounds,
      x: c.x,
      y: c.y,
      rot: 0,
      vx: 0,
      vy: 0,
      vr: 0,
      depth: 0,
      vDepth: 0,
      energy: 0,
      seed: Math.random(),
      hasInk,
    };
  });

  return { shards, tex, W, H };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ShatterType() {
  const { theme, reduceMotion } = useTheme();

  // Client-only mount guard: keeps canvas / window access out of SSR so the
  // static export render stays clean (same effect as dynamic ssr:false).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [wordIdx, setWordIdx] = useState(0);
  const word = WORDS[wordIdx % WORDS.length];

  // Refs the render loop reads without re-subscribing.
  const themeRef = useRef(theme);
  const reduceRef = useRef(reduceMotion);
  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);
  useEffect(() => {
    reduceRef.current = reduceMotion;
  }, [reduceMotion]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<Scene | null>(null);
  // Imperatively-set "blast at this point" request, consumed by the loop.
  const blastRef = useRef<Pt | null>(null);
  // Ripple ring(s) drawn at impact points, purely decorative.
  const ringsRef = useRef<{ x: number; y: number; t: number }[]>([]);

  // Trigger a rebuild on word / theme(ink) change via a string key.
  const inkColor = PALETTES[theme].ink;
  const rebuildKey = `${word}|${inkColor}`;

  const shatterAll = useCallback((cx: number, cy: number) => {
    blastRef.current = { x: cx, y: cy };
  }, []);

  const reset = useCallback(() => {
    const s = sceneRef.current;
    if (!s) return;
    for (const sh of s.shards) {
      sh.x = sh.home.x;
      sh.y = sh.home.y;
      sh.rot = 0;
      sh.vx = 0;
      sh.vy = 0;
      sh.vr = 0;
      sh.depth = 0;
      sh.vDepth = 0;
      sh.energy = 0;
    }
    ringsRef.current = [];
  }, []);

  // Main build + physics + render loop. Rebuilds the scene when the word, theme
  // ink, or stage size changes.
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

    const rebuild = () => {
      const rect = wrap.getBoundingClientRect();
      W = Math.max(1, rect.width);
      H = Math.max(1, rect.height);
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      sceneRef.current = buildScene(word, W, H, PALETTES[themeRef.current].ink);
      ringsRef.current = [];
    };

    rebuild();

    const ro = new ResizeObserver(() => {
      const rect = wrap.getBoundingClientRect();
      if (
        Math.abs(rect.width - W) > 2 ||
        Math.abs(rect.height - H) > 2 ||
        !sceneRef.current
      ) {
        rebuild();
      }
    });
    ro.observe(wrap);

    // ---- interaction ------------------------------------------------------
    const toLocal = (e: PointerEvent): Pt => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onDown = (e: PointerEvent) => {
      const p = toLocal(e);
      blastRef.current = p;
    };
    canvas.addEventListener("pointerdown", onDown);

    // ---- physics constants ------------------------------------------------
    const GRAVITY = 1500; // px/s²
    const AIR = 0.992; // linear air drag per substep
    const SPIN_DRAG = 0.99;
    const FLOOR_DAMP = 0.5; // velocity kept after touching the floor

    // Apply a radial blast from a point: shards near the impact get the biggest
    // outward velocity, spin and lift. Falls off smoothly with distance.
    const applyBlast = (bx: number, by: number) => {
      const s = sceneRef.current;
      if (!s) return;
      // Radius scaled to stage; the "shatter from a new point each time" feel.
      const R = Math.max(W, H) * 0.55;
      for (const sh of s.shards) {
        const dx = sh.home.x - bx;
        const dy = sh.home.y - by;
        const d = Math.hypot(dx, dy) || 1;
        const falloff = Math.exp(-(d / R) * 1.7); // 1 at impact → ~0 far away
        if (falloff < 0.015) continue;
        const ux = dx / d;
        const uy = dy / d;
        // Outward impulse + a touch of upward bias so shards arc.
        const power = 520 + 900 * falloff;
        const jit = 0.7 + sh.seed * 0.6;
        sh.vx += ux * power * jit;
        sh.vy += uy * power * jit - 240 * falloff;
        sh.vr += (sh.seed - 0.5) * 22 * falloff;
        sh.vDepth += (140 + 320 * falloff) * (0.6 + sh.seed * 0.8);
        sh.energy = Math.min(1, sh.energy + 0.4 + falloff);
      }
      ringsRef.current.push({ x: bx, y: by, t: 0 });
      if (ringsRef.current.length > 4) ringsRef.current.shift();
    };

    // Integrate one substep of dt seconds.
    const step = (dt: number) => {
      const s = sceneRef.current;
      if (!s) return;
      const g = GRAVITY * dt;
      for (const sh of s.shards) {
        if (sh.energy <= 0.0005) {
          // Fully fused — snap clean to avoid endless tiny springing.
          sh.x = sh.home.x;
          sh.y = sh.home.y;
          sh.rot = 0;
          sh.depth = 0;
          continue;
        }

        // Free-flight integration.
        sh.vy += g;
        sh.vx *= AIR;
        sh.vy *= AIR;
        sh.vr *= SPIN_DRAG;

        sh.x += sh.vx * dt;
        sh.y += sh.vy * dt;
        sh.rot += sh.vr * dt;

        // Depth: lifted shards settle back toward the pane.
        sh.depth += sh.vDepth * dt;
        sh.vDepth -= sh.depth * 9 * dt; // spring toward depth 0
        sh.vDepth *= 0.9;

        // Soft floor near the bottom so flung shards bounce once before homing.
        const floor = H + 40;
        if (sh.y > floor && sh.vy > 0) {
          sh.y = floor;
          sh.vy = -sh.vy * FLOOR_DAMP;
          sh.vr *= 0.7;
        }

        // Return spring — the re-fuse. Strength ramps as energy decays so shards
        // first fly freely, then are pulled home and rotation/depth eased out.
        // (1 - energy) grows from 0 → ~1 over the life, so the pull strengthens.
        const pull = (1 - sh.energy) * 14 + 1.5;
        const ax = (sh.home.x - sh.x) * pull;
        const ay = (sh.home.y - sh.y) * pull;
        sh.vx += ax * dt;
        sh.vy += ay * dt;
        // Ease rotation back to 0 (shortest way) as it settles.
        sh.rot += (0 - sh.rot) * Math.min(1, pull * dt * 0.5);

        // Bleed energy → eventually the shard re-fuses and snaps clean above.
        sh.energy -= dt * 0.42;
        if (sh.energy < 0) sh.energy = 0;
      }
    };

    // ---- draw -------------------------------------------------------------
    const draw = () => {
      const s = sceneRef.current;
      if (!s) return;
      const pal = PALETTES[themeRef.current];
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      // Backdrop: a subtle vertical wash + faint frame so the pane reads as a
      // pane of glass seated in the stage.
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, `rgba(${pal.accentGlow}, ${themeRef.current === "dark" ? 0.05 : 0.04})`);
      bg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Draw order: shards lower / deeper first so lifted shards sit on top.
      // Sort by depth ascending (a shallow stable copy of indices).
      const idx = s.shards.map((_, i) => i);
      idx.sort((a, b) => s.shards[a].depth - s.shards[b].depth);

      const tex = s.tex;

      for (const i of idx) {
        const sh = s.shards[i];
        const lifted = sh.depth > 0.5;
        const scale = 1 + sh.depth * 0.0009; // gentle perspective grow

        // ---- shadow (only while clearly lifted) ----
        if (lifted) {
          const off = Math.min(26, sh.depth * 0.05);
          const sa = Math.max(0, 0.28 - sh.depth * 0.00035) * Math.min(1, sh.energy * 1.4);
          if (sa > 0.01) {
            ctx.save();
            ctx.translate(sh.x + off, sh.y + off);
            ctx.rotate(sh.rot);
            ctx.scale(scale, scale);
            ctx.beginPath();
            traceLocal(ctx, sh.local);
            ctx.fillStyle = `rgba(${pal.shadow}, ${sa})`;
            ctx.fill();
            ctx.restore();
          }
        }

        // ---- shard body ----
        ctx.save();
        ctx.translate(sh.x, sh.y);
        ctx.rotate(sh.rot);
        ctx.scale(scale, scale);

        // Clip to the shard polygon, then paint: glass fill, the glyph slice
        // (sampled from the offscreen texture at this shard's HOME position so
        // each fragment carries its slice of the letterform), and a sheen.
        ctx.beginPath();
        traceLocal(ctx, sh.local);
        ctx.save();
        ctx.clip();

        // Glass fill.
        ctx.fillStyle = pal.glass;
        ctx.globalAlpha = 1;
        ctx.fill();

        // The glyph slice: blit the offscreen word texture aligned so its home
        // pixels land back inside this shard's local frame. We translate by
        // -home so texture pixel (home.x, home.y) maps to local (0,0).
        ctx.globalAlpha = lifted ? 0.92 : 1;
        ctx.drawImage(tex, -sh.home.x, -sh.home.y);

        // Specular sheen — a diagonal bright streak that shifts with depth, so
        // lifted glass catches the light.
        const b = sh.bounds;
        const sheen = ctx.createLinearGradient(b.minX, b.minY, b.maxX, b.maxY);
        const sStr = (themeRef.current === "dark" ? 0.16 : 0.34) + sh.depth * 0.0004;
        sheen.addColorStop(0, `rgba(255,255,255,0)`);
        sheen.addColorStop(0.45 + sh.seed * 0.1, hexToRgba(pal.spec, Math.min(0.6, sStr)));
        sheen.addColorStop(0.6 + sh.seed * 0.1, `rgba(255,255,255,0)`);
        ctx.fillStyle = sheen;
        ctx.globalAlpha = 1;
        ctx.fill();

        ctx.restore(); // remove clip

        // ---- crack / bevel edge ----
        // Edge brightens with energy (a hot fracture line) and with ink shards.
        const edgeGlow = sh.energy * (sh.hasInk ? 0.9 : 0.5);
        ctx.beginPath();
        traceLocal(ctx, sh.local);
        if (edgeGlow > 0.02) {
          ctx.strokeStyle = hexToRgba(pal.accent, Math.min(0.85, 0.25 + edgeGlow));
          ctx.lineWidth = 1 + edgeGlow * 1.4;
          ctx.shadowColor = `rgba(${pal.accentGlow}, ${Math.min(0.9, edgeGlow)})`;
          ctx.shadowBlur = 6 + edgeGlow * 10;
        } else {
          ctx.strokeStyle = pal.glassEdge;
          ctx.lineWidth = 1;
          ctx.shadowBlur = 0;
        }
        ctx.lineJoin = "round";
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.restore();
      }

      // ---- impact rings ----
      for (const r of ringsRef.current) {
        const life = r.t; // 0..1
        if (life >= 1) continue;
        const rad = 10 + life * Math.max(W, H) * 0.5;
        ctx.beginPath();
        ctx.arc(r.x, r.y, rad, 0, Math.PI * 2);
        ctx.strokeStyle = hexToRgba(pal.accent, (1 - life) * 0.5);
        ctx.lineWidth = 2 * (1 - life);
        ctx.stroke();
      }
    };

    // ---- main loop --------------------------------------------------------
    let last = performance.now();
    const loop = (now: number) => {
      const s = sceneRef.current;
      if (!s) {
        raf = requestAnimationFrame(loop);
        return;
      }
      let dt = (now - last) / 1000;
      last = now;
      dt = Math.min(dt, 1 / 30); // clamp after tab switches

      // Consume a pending blast.
      const blast = blastRef.current;
      if (blast) {
        applyBlast(blast.x, blast.y);
        blastRef.current = null;
      }

      const reduce = reduceRef.current;
      if (reduce) {
        // Quiet mode: hold the legible word at rest, ignore physics, but still
        // honor a click as a single gentle settle to home (no churn).
        for (const sh of s.shards) {
          sh.x = sh.home.x;
          sh.y = sh.home.y;
          sh.rot = 0;
          sh.depth = 0;
          sh.energy = 0;
        }
        ringsRef.current = [];
      } else {
        const SUB = 2;
        const sdt = dt / SUB;
        for (let k = 0; k < SUB; k++) step(sdt);
        // Advance impact rings.
        for (const r of ringsRef.current) r.t += dt * 1.3;
        ringsRef.current = ringsRef.current.filter((r) => r.t < 1);
      }

      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
    };
    // rebuildKey forces a full rebuild on word / ink change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, rebuildKey]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-bg">
      <div ref={wrapRef} className="absolute inset-0">
        {mounted ? (
          <canvas
            ref={canvasRef}
            className="block h-full w-full cursor-crosshair touch-none select-none"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted">
            Loading glass…
          </div>
        )}
      </div>

      {/* Title overlay */}
      <div className="pointer-events-none absolute left-4 top-4 max-w-[70%]">
        <div className="inline-block rounded-lg border border-border bg-bg/60 px-3 py-2 backdrop-blur">
          <p className="text-sm font-medium text-fg">Shatter Type</p>
          <p className="text-xs text-muted">
            {reduceMotion
              ? "Reduced motion — word held intact"
              : "Click anywhere to crack the pane"}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute right-4 top-4 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => {
            const wrap = wrapRef.current;
            if (wrap && !reduceMotion) {
              const r = wrap.getBoundingClientRect();
              // Blast from a random point each press for variety.
              shatterAll(
                r.width * (0.25 + Math.random() * 0.5),
                r.height * (0.3 + Math.random() * 0.4),
              );
            }
          }}
          disabled={reduceMotion}
          title="Shatter"
          className="flex items-center gap-1.5 rounded-lg border border-border bg-bg/60 px-3 py-2 text-xs text-muted backdrop-blur transition-colors hover:text-fg disabled:opacity-40 disabled:hover:text-muted"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Shatter</span>
        </button>
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

      {/* Word toggle */}
      <div className="absolute inset-x-0 bottom-3 flex justify-center">
        <button
          type="button"
          onClick={() => setWordIdx((i) => (i + 1) % WORDS.length)}
          className="pointer-events-auto rounded-full border border-border bg-bg/60 px-3 py-1 text-xs text-muted backdrop-blur transition-colors hover:text-fg"
        >
          {`spelling “${word}” — tap to change`}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small canvas utilities
// ---------------------------------------------------------------------------

// Trace a local-space polygon into the current path (caller manages save/clip).
function traceLocal(ctx: CanvasRenderingContext2D, poly: Poly) {
  if (poly.length === 0) return;
  ctx.moveTo(poly[0].x, poly[0].y);
  for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
  ctx.closePath();
}

// Convert a #rrggbb hex to an rgba() string with the given alpha. Falls back to
// the input if it isn't a 6-digit hex.
function hexToRgba(hex: string, alpha: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
