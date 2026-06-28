"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Color,
  Group,
  LinearFilter,
  MeshStandardMaterial,
  PerspectiveCamera,
  WebGLRenderTarget,
} from "three";
import { Pause, Play, RotateCcw, Type } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { THEME_SWATCHES, type Theme } from "@/lib/theme";

/**
 * ASCII Engine — a spinning 3D object rendered entirely in living text.
 *
 * This is a real Three.js scene: a lit mesh rotating under a key + rim light.
 * But it is never shown directly. Every frame the lit mesh is rendered to an
 * offscreen WebGLRenderTarget sized to the glyph grid (one texel per character
 * cell). The pixel buffer is read back with gl.readRenderTargetPixels, each
 * texel's luminance is mapped through a hand-rolled density ramp
 * (" .:-=+*#%@" …), and the result is re-typed onto a 2D <canvas> as a grid of
 * monospace glyphs. A from-scratch luminance → glyph rasterizer — no
 * off-the-shelf ASCII post-process.
 *
 * Two forms: a torus knot (pure rendering experiment) and an extruded "MT"
 * monogram (a nod to building agentically from a terminal). Drag to orbit;
 * it auto-spins otherwise, and freezes under reduced-motion.
 */

// ---------------------------------------------------------------------------
// Glyph grid + density ramp. Dark → light: a space is "empty", @ is "solid".
// Two ramps so the texture of the form can be tuned per mood.
// ---------------------------------------------------------------------------

const RAMPS = {
  classic: " .,:;irsXA253hMHGS#9B&@",
  blocks: " .·:-=+coast*#%@█",
} as const;
type RampId = keyof typeof RAMPS;

// Target character cell count along the larger axis. The render target is sized
// to the grid so each texel maps to exactly one glyph — cheap readback, crisp
// type. Tuned down on small screens for fill-rate + legibility.
const MAX_COLS_DESKTOP = 150;
const MAX_COLS_MOBILE = 86;

// ---------------------------------------------------------------------------
// Per-theme colors for the glyph paint. The 2D canvas can't read CSS tokens, so
// mirror the site's semantic palette. `gridRgb` carries an rgb triple so each
// glyph's alpha can scale with its luminance for a phosphor-like falloff.
// ---------------------------------------------------------------------------

type Palette = {
  bg: string; // stage background
  dim: string; // faint glyphs (low luminance)
  gridRgb: string; // bright glyphs (rgb triple, alpha by luminance)
  scanRgb: string; // scanline / vignette tint
};

const PALETTES: Record<Theme, Palette> = {
  light: {
    bg: "#f4f7fc",
    dim: "rgba(90, 107, 128, 0.30)",
    gridRgb: "37, 99, 235",
    scanRgb: "37, 99, 235",
  },
  dark: {
    bg: "#070a11",
    dim: "rgba(140, 160, 190, 0.22)",
    gridRgb: "120, 200, 255",
    scanRgb: "106, 168, 255",
  },
  sunset: {
    bg: "#1a0f0a",
    dim: "rgba(255, 200, 150, 0.22)",
    gridRgb: "255, 168, 92",
    scanRgb: "234, 120, 40",
  },
} as const;

type FormId = "knot" | "monogram";

// ---------------------------------------------------------------------------
// Shared frame buffer the GL scene writes into and the ASCII painter reads from.
// Kept in a ref-shaped object so both children can hold the same reference
// without re-rendering React on every frame.
// ---------------------------------------------------------------------------

type FrameBuffer = {
  cols: number;
  rows: number;
  // On-screen stage aspect (W/H). The form is rendered with this aspect so it
  // looks undistorted once the cols×rows grid is painted back into the stage.
  aspect: number;
  // RGBA8 readback from the render target, length cols*rows*4.
  pixels: Uint8Array | null;
  // Bumped each time the GL scene writes a fresh frame; the painter reads it to
  // know when to repaint (so a frozen scene paints once and then idles).
  version: number;
  // External "please re-render once" request (resize / drag / reset / theme /
  // ramp). Lets the GL scene idle when nothing is moving — important under
  // reduced-motion and when paused, so a frozen frame costs nothing.
  dirty: boolean;
};

// ---------------------------------------------------------------------------
// "MT" monogram, built from filled rectangles so it reads at low glyph res.
// Returned as unit-square rects (x, y, w, h) in 0..1 with y up, later mapped
// into 3D extruded boxes. Hand-laid rather than a font so it stays crisp at
// ~150 columns.
// ---------------------------------------------------------------------------

function monogramRects(): Array<[number, number, number, number]> {
  const t = 0.12; // stroke thickness
  const rects: Array<[number, number, number, number]> = [];
  // --- M (left half, x 0.04 .. 0.46) ---
  rects.push([0.04, 0.0, t, 1.0]); // left stem
  rects.push([0.34, 0.0, t, 1.0]); // right stem
  // two diagonals approximated with stacked blocks meeting at center
  const steps = 7;
  for (let i = 0; i < steps; i++) {
    const f = i / (steps - 1);
    const y = 1.0 - f * 0.5 - t; // upper half
    rects.push([0.04 + f * 0.15, y, t * 0.9, t * 1.3]); // left → center
    rects.push([0.34 - f * 0.15, y, t * 0.9, t * 1.3]); // right → center
  }
  // --- T (right half, x 0.54 .. 0.96) ---
  rects.push([0.54, 1.0 - t, 0.42, t]); // top bar
  rects.push([0.69, 0.0, t, 1.0 - t]); // vertical stem
  return rects;
}

// ===========================================================================
// GL scene — renders the lit mesh to an offscreen target sized to the grid.
// ===========================================================================

function GlScene({
  theme,
  reduceMotion,
  form,
  spinning,
  frame,
  spinRef,
  dragRef,
}: {
  theme: Theme;
  reduceMotion: boolean;
  form: FormId;
  spinning: boolean;
  frame: { current: FrameBuffer };
  // Continuous auto-spin angle (radians), advanced here, persisted across
  // form/theme changes via a parent ref.
  spinRef: { current: number };
  // Pointer-drag orbit offset { x: yaw, y: pitch } in radians.
  dragRef: { current: { x: number; y: number } };
}) {
  const gl = useThree((s) => s.gl);
  const groupRef = useRef<Group>(null);
  // Last rendered rotation, so we can detect when the view actually moved.
  const lastRot = useRef({ x: Number.NaN, y: Number.NaN });

  // Offscreen target sized to the glyph grid (1 texel per cell). LinearFilter +
  // no depth texture; we only need the color buffer for luminance.
  const target = useMemo(() => {
    const rt = new WebGLRenderTarget(frame.current.cols, frame.current.rows, {
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      depthBuffer: true,
      stencilBuffer: false,
    });
    return rt;
    // Re-create only if the grid dimensions change (handled via effect below).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scratch scene/camera owned by r3f: we render our own group into the target.
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);

  // Material shared by the form meshes; standard lighting gives a clean
  // luminance gradient that the ramp samples well.
  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        color: new Color("#ffffff"),
        roughness: 0.35,
        metalness: 0.1,
        emissive: new Color("#000000"),
      }),
    []
  );

  // Dispose GL resources on unmount.
  useEffect(() => {
    return () => {
      target.dispose();
      material.dispose();
    };
  }, [target, material]);

  // Force a re-render of the offscreen scene whenever the form, theme, or
  // motion mode changes — these can leave the rotation unchanged, so the
  // dirty flag is how a frozen scene knows to repaint.
  useEffect(() => {
    frame.current.dirty = true;
  }, [form, theme, reduceMotion, spinning, frame]);

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;
    const f = frame.current;

    // Keep the offscreen target + readback buffer matched to the live grid
    // (it changes on resize, which mutates the ref without re-rendering React).
    if (target.width !== f.cols || target.height !== f.rows) {
      target.setSize(f.cols, f.rows);
    }
    if (!f.pixels || f.pixels.length !== f.cols * f.rows * 4) {
      f.pixels = new Uint8Array(f.cols * f.rows * 4);
    }

    // Match the camera aspect to the on-screen stage aspect so the form is
    // undistorted after the grid is painted back at the stage's proportions
    // (the cols×rows target itself is non-square, but cells reconstruct W:H).
    if (camera instanceof PerspectiveCamera && f.aspect > 0) {
      if (Math.abs(camera.aspect - f.aspect) > 1e-3) {
        camera.aspect = f.aspect;
        camera.updateProjectionMatrix();
      }
    }

    // Advance auto-spin unless frozen / paused.
    const animating = spinning && !reduceMotion;
    if (animating) {
      spinRef.current += delta * 0.5;
    }
    const ry = spinRef.current + dragRef.current.x;
    const rx = 0.32 + dragRef.current.y;

    // Idle when nothing changed: skip the (relatively costly) render + readback
    // unless we're animating, the view moved (drag), or an external dirty
    // request came in (resize / reset / theme / ramp). Keeps a frozen scene
    // — reduced-motion or paused — essentially free.
    const moved =
      Math.abs(ry - lastRot.current.y) > 1e-4 ||
      Math.abs(rx - lastRot.current.x) > 1e-4;
    if (!animating && !moved && !f.dirty) return;
    f.dirty = false;
    lastRot.current.x = rx;
    lastRot.current.y = ry;

    g.rotation.y = ry;
    g.rotation.x = rx;

    // Render the scene (lights + our group; lights don't draw) into the
    // offscreen target. A dark clear color makes empty areas read as luminance
    // 0 → background. autoClear (on by default) clears before the draw.
    const prevTarget = gl.getRenderTarget();
    gl.setClearColor(0x000000, 1);
    gl.setRenderTarget(target);
    gl.render(scene, camera);
    gl.setRenderTarget(prevTarget);

    // Read the small color buffer back to CPU and hand it to the painter.
    gl.readRenderTargetPixels(target, 0, 0, f.cols, f.rows, f.pixels);
    f.version++;
  });

  const accent = THEME_SWATCHES[theme].accent;

  return (
    <>
      {/* Three-point-ish lighting: key + rim + soft fill, so the form keeps a
          readable luminance gradient (the ramp's whole job). */}
      <ambientLight intensity={0.35} />
      <directionalLight position={[2.5, 3, 2]} intensity={1.5} />
      <directionalLight position={[-3, -1, -2]} intensity={0.7} color={accent} />
      <pointLight position={[0, 0, 3]} intensity={0.5} />

      <group ref={groupRef}>
        {form === "knot" ? (
          <mesh material={material}>
            <torusKnotGeometry args={[0.95, 0.32, 180, 28]} />
          </mesh>
        ) : (
          <Monogram material={material} />
        )}
      </group>
    </>
  );
}

// Extruded "MT" built from boxes; centered around the origin and scaled to sit
// in the same framing as the knot.
function Monogram({ material }: { material: MeshStandardMaterial }) {
  const rects = useMemo(() => monogramRects(), []);
  return (
    <group scale={[2.5, 2.5, 2.5]} position={[-1.25, -1.25, 0]}>
      {rects.map(([x, y, w, h], i) => (
        <mesh
          key={i}
          material={material}
          position={[x + w / 2, y + h / 2, 0]}
        >
          <boxGeometry args={[w, h, 0.18]} />
        </mesh>
      ))}
    </group>
  );
}

// ===========================================================================
// Camera framing for the offscreen render — keep the form centered & fitted.
// ===========================================================================

function FrameCamera() {
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    camera.position.set(0, 0, 4.2);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera]);
  return null;
}

// ===========================================================================
// ASCII painter — reads the shared frame buffer and types it onto a 2D canvas.
// ===========================================================================

function AsciiCanvas({
  theme,
  reduceMotion,
  ramp,
  frame,
  canvasRef,
}: {
  theme: Theme;
  reduceMotion: boolean;
  ramp: RampId;
  frame: { current: FrameBuffer };
  canvasRef: { current: HTMLCanvasElement | null };
}) {
  const lastVersion = useRef(-1);
  const palette = PALETTES[theme];
  const chars = RAMPS[ramp];

  // Repaint on each new GL frame. Runs inside r3f's loop so it stays in step
  // with the offscreen render; returns early when the version is unchanged, so
  // a frozen / idle scene costs almost nothing.
  useFrame(() => {
    const canvas = canvasRef.current;
    const f = frame.current;
    if (!canvas || !f.pixels) return;
    if (f.version === lastVersion.current) return;
    lastVersion.current = f.version;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio : 1);
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    if (W === 0 || H === 0) return;

    // Keep the backing store crisp at the device pixel ratio.
    const bw = Math.round(W * dpr);
    const bh = Math.round(H * dpr);
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const { cols, rows } = f;
    // Cell size in CSS px. The grid aspect already matches the stage aspect
    // (both derived from the same width/height), so cells stay near-square.
    const cw = W / cols;
    const ch = H / rows;
    const fontPx = Math.max(6, Math.min(ch * 1.08, cw * 1.9));

    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `${fontPx}px "SFMono-Regular", ui-monospace, "Menlo", "Consolas", monospace`;

    const px = f.pixels;
    const n = chars.length;
    const [gr, gg, gb] = palette.gridRgb.split(",").map((s) => Number(s.trim()));

    for (let row = 0; row < rows; row++) {
      // The render target's origin is bottom-left; flip vertically so the form
      // is upright in the grid.
      const srcRow = rows - 1 - row;
      const cy = row * ch + ch / 2;
      for (let col = 0; col < cols; col++) {
        const idx = (srcRow * cols + col) * 4;
        const r = px[idx];
        const gC = px[idx + 1];
        const b = px[idx + 2];
        // Rec. 601 luma, 0..1.
        const raw = (0.299 * r + 0.587 * gC + 0.114 * b) / 255;
        if (raw < 0.015) continue; // empty space → leave background
        // The offscreen buffer is linear-light; a gamma lift spreads midtones
        // so the full density ramp is used (otherwise everything clusters
        // bright and the silhouette flattens).
        const lum = Math.pow(raw, 1 / 1.8);
        const ci = Math.min(n - 1, Math.max(0, Math.floor(lum * n)));
        const ch0 = chars[ci];
        if (ch0 === " ") continue;
        const cx = col * cw + cw / 2;
        // Brighter glyphs get more accent + alpha → phosphor falloff.
        if (lum > 0.42) {
          ctx.fillStyle = `rgba(${gr}, ${gg}, ${gb}, ${Math.min(1, 0.35 + lum * 0.85)})`;
        } else {
          ctx.fillStyle = palette.dim;
        }
        ctx.fillText(ch0, cx, cy);
      }
    }

    // Subtle scanlines + vignette to seat the teletype / CRT look. These are
    // part of every repaint, so they're present in the frozen frame too.
    ctx.globalAlpha = theme === "light" ? 0.04 : 0.08;
    ctx.fillStyle = `rgba(${palette.scanRgb}, 1)`;
    for (let y = 0; y < H; y += 3) {
      ctx.fillRect(0, y, W, 1);
    }
    ctx.globalAlpha = 1;

    // Soft vignette.
    const grad = ctx.createRadialGradient(
      W / 2,
      H / 2,
      Math.min(W, H) * 0.25,
      W / 2,
      H / 2,
      Math.max(W, H) * 0.75
    );
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(1, theme === "light" ? "rgba(0,0,0,0.05)" : "rgba(0,0,0,0.45)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  });

  // Repaint when theme/ramp/motion change even if the scene is frozen. Reset
  // the serviced version so the painter redraws on the next frame; the GL scene
  // separately marks itself dirty for theme/ramp so a fresh buffer arrives too.
  useEffect(() => {
    frame.current.dirty = true;
    lastVersion.current = -1;
  }, [theme, ramp, reduceMotion, frame]);

  return null;
}

// ===========================================================================
// Component shell — owns layout, controls, mount guard, and the shared frame.
// ===========================================================================

export default function AsciiEngine() {
  const { theme, reduceMotion } = useTheme();

  // Client-only mount guard: keeps the WebGL <Canvas> out of the server render
  // so static export stays clean (same effect as dynamic ssr:false, in-file).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [form, setForm] = useState<FormId>("knot");
  const [ramp, setRamp] = useState<RampId>("classic");
  const [spinning, setSpinning] = useState(true);

  // Shared, render-driving refs (mutated in-frame, never trigger React renders).
  const spinRef = useRef(0);
  const dragRef = useRef({ x: 0, y: 0 });
  const asciiCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  // Determine the glyph grid from the stage size; recomputed on resize so the
  // render target + readback buffer stay matched to what's painted.
  const frame = useRef<FrameBuffer>({
    cols: 120,
    rows: 60,
    aspect: 2,
    pixels: null,
    version: 0,
    dirty: true,
  });
  const [gridReady, setGridReady] = useState(false);

  const recomputeGrid = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    if (w === 0 || h === 0) return;
    const isMobile = w < 640;
    const maxCols = isMobile ? MAX_COLS_MOBILE : MAX_COLS_DESKTOP;
    // Character cells read best near a 0.52 width:height ratio (monospace cells
    // are taller than wide). Derive rows so the grid matches the stage aspect.
    const cols = Math.max(24, maxCols);
    const cellW = w / cols;
    const cellH = cellW / 0.52; // each glyph cell taller than wide
    const rows = Math.max(16, Math.round(h / cellH));
    const f = frame.current;
    f.aspect = w / h;
    if (f.cols !== cols || f.rows !== rows) {
      f.cols = cols;
      f.rows = rows;
      f.pixels = new Uint8Array(cols * rows * 4);
      f.dirty = true;
    }
    setGridReady(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    recomputeGrid();
    const stage = stageRef.current;
    if (!stage || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => recomputeGrid());
    ro.observe(stage);
    return () => ro.disconnect();
  }, [mounted, recomputeGrid]);

  // ---- Pointer-drag orbit on the stage --------------------------------------
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      dragging.current = true;
      last.current = { x: e.clientX, y: e.clientY };
      (e.target as Element).setPointerCapture?.(e.pointerId);
    },
    []
  );
  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    last.current = { x: e.clientX, y: e.clientY };
    dragRef.current.x += dx * 0.008;
    // Clamp pitch so the form never flips fully over.
    dragRef.current.y = Math.max(
      -0.9,
      Math.min(0.9, dragRef.current.y + dy * 0.006)
    );
    // Mark dirty so a paused/frozen scene still re-renders while dragging.
    frame.current.dirty = true;
  }, []);
  const onPointerUp = useCallback((e: React.PointerEvent) => {
    dragging.current = false;
    (e.target as Element).releasePointerCapture?.(e.pointerId);
  }, []);

  const resetView = useCallback(() => {
    dragRef.current = { x: 0, y: 0 };
    frame.current.dirty = true;
  }, []);

  // Frozen when reduced motion OR paused AND not currently dragging. We still
  // want drag to work, so keep the loop "always" but gate auto-spin via the
  // `spinning`/reduceMotion flags inside GlScene. Demand mode would stall the
  // readback during drag, so "always" is simplest and the scene is tiny.
  const frameloop = "always" as const;

  return (
    <div className="relative h-full w-full overflow-hidden bg-bg">
      {/* The visible ASCII output. The WebGL canvas below is the hidden engine. */}
      <div
        ref={stageRef}
        className="absolute inset-0 touch-none select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <canvas
          ref={asciiCanvasRef}
          className="block h-full w-full"
          aria-label="ASCII rendering of a spinning 3D form"
        />

        {/* The offscreen 3D engine. Kept mounted but visually hidden: it only
            exists to render the mesh into the render target each frame. A 2px
            box keeps the GL context alive without painting anything visible. */}
        {mounted && gridReady ? (
          <div
            className="pointer-events-none absolute left-0 top-0 opacity-0"
            style={{ width: 2, height: 2 }}
            aria-hidden
          >
            <Canvas
              gl={{ antialias: true, alpha: false, preserveDrawingBuffer: false }}
              dpr={1}
              frameloop={frameloop}
              camera={{ fov: 38, position: [0, 0, 4.2] }}
            >
              <FrameCamera />
              <GlScene
                theme={theme}
                reduceMotion={reduceMotion}
                form={form}
                spinning={spinning}
                frame={frame}
                spinRef={spinRef}
                dragRef={dragRef}
              />
              <AsciiCanvas
                theme={theme}
                reduceMotion={reduceMotion}
                ramp={ramp}
                frame={frame}
                canvasRef={asciiCanvasRef}
              />
            </Canvas>
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted">
            Compiling glyphs…
          </div>
        )}
      </div>

      {/* Header overlay */}
      <div className="pointer-events-none absolute left-4 top-4 max-w-[78%] rounded-lg border border-border bg-bg/60 px-3 py-2 backdrop-blur">
        <p className="font-mono text-sm font-medium text-fg">
          <span className="text-accent">$</span> ascii-engine
        </p>
        <p className="text-xs text-muted">
          a 3D scene rasterized to live text
        </p>
      </div>

      {/* Controls */}
      <div className="absolute inset-x-0 bottom-3 flex flex-wrap items-center justify-center gap-2 px-3">
        <SegButton
          active={form === "knot"}
          onClick={() => setForm("knot")}
          label="Knot"
        />
        <SegButton
          active={form === "monogram"}
          onClick={() => setForm("monogram")}
          label="MT"
        />

        <span className="mx-1 h-5 w-px bg-border" aria-hidden />

        <IconButton
          onClick={() => setRamp((r) => (r === "classic" ? "blocks" : "classic"))}
          title={`Density ramp: ${ramp}`}
        >
          <Type size={15} />
          <span className="hidden sm:inline">{ramp === "classic" ? "ASCII" : "Blocks"}</span>
        </IconButton>

        <IconButton onClick={resetView} title="Reset view">
          <RotateCcw size={15} />
          <span className="hidden sm:inline">Reset</span>
        </IconButton>

        {!reduceMotion && (
          <IconButton
            onClick={() => setSpinning((s) => !s)}
            title={spinning ? "Pause spin" : "Resume spin"}
          >
            {spinning ? <Pause size={15} /> : <Play size={15} />}
            <span className="hidden sm:inline">{spinning ? "Pause" : "Spin"}</span>
          </IconButton>
        )}
      </div>

      {/* Footer hint */}
      <p className="pointer-events-none absolute right-4 top-4 hidden text-right font-mono text-[11px] leading-tight text-muted sm:block">
        {reduceMotion ? "reduced motion · drag to orbit" : "drag to orbit"}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small UI atoms — semantic tokens only, so they track light/dark/sunset.
// ---------------------------------------------------------------------------

function SegButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-md border px-3 py-1.5 font-mono text-xs transition-colors",
        active
          ? "border-accent bg-surface text-accent"
          : "border-border bg-bg/60 text-muted hover:text-fg",
        "backdrop-blur",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function IconButton({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="flex items-center gap-1.5 rounded-md border border-border bg-bg/60 px-3 py-1.5 font-mono text-xs text-muted backdrop-blur transition-colors hover:text-fg"
    >
      {children}
    </button>
  );
}
