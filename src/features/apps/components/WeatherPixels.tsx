"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  BoxGeometry,
  Color,
  type InstancedMesh,
  MeshStandardMaterial,
  Object3D,
  type PerspectiveCamera,
  Raycaster,
  Vector2,
  Vector3,
} from "three";
import { CloudRain, RotateCcw, Zap } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { GLOBE_COLORS, THEME_SWATCHES, type Theme } from "@/lib/theme";

/**
 * Weather Pixels — a living 3D pixel sky.
 *
 * A single GPU-instanced grid of voxel cubes is laid out on a gently domed
 * plane. Every frame an allocation-free useFrame loop drives each cube's height
 * and color from three layered fields of cheap value-noise:
 *   • a slow PRESSURE field (the rolling weather front — sets base height),
 *   • a drifting CLOUD mask (carved out as dark, sunken gaps),
 *   • a time-of-day RAMP (dawn → noon → dusk → storm) that color-grades the lot.
 * Lightning is a per-column emissive pulse that flashes a whole strip white.
 * Tapping injects a moving low-pressure gaussian that pulls a region of cubes
 * down into a churning squall dimple.
 *
 * Real instanced animation (one InstancedMesh, per-instance matrices + colors
 * rewritten each frame) — not a shader quad. Drag to orbit; reduced-motion
 * freezes the scene to a fully graded still. Uses only three + r3f.
 */

// ---------------------------------------------------------------------------
// Grid + dome geometry constants. GRID×GRID cubes ≈ a few thousand instances —
// instanced, so it is one draw call regardless.
// ---------------------------------------------------------------------------
const GRID = 56; // cubes per side → 3136 instances
const COUNT = GRID * GRID;
const SPACING = 0.62; // gap between cube centers in the plane
const CUBE = 0.5; // cube footprint (a touch smaller than spacing → grid lines)
const DOME = 5.5; // dome depth: how far (world units) the rim sinks vs. center
const HALF = (GRID - 1) / 2;
const SPAN = HALF * SPACING;

// ---------------------------------------------------------------------------
// Cheap value-noise (2D), allocation-free. Hash → smooth bilinear interp.
// Good enough for layered weather fields; far cheaper than simplex per frame.
// ---------------------------------------------------------------------------
function hash(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}
function fade(t: number): number {
  return t * t * (3 - 2 * t);
}
function vnoise(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fade(fx);
  const uy = fade(fy);
  const a = hash(ix, iy);
  const b = hash(ix + 1, iy);
  const c = hash(ix, iy + 1);
  const d = hash(ix + 1, iy + 1);
  const top = a + (b - a) * ux;
  const bot = c + (d - c) * ux;
  return top + (bot - top) * uy; // 0..1
}
// Two-octave fbm for the pressure field — broad swells + finer texture.
function fbm2(x: number, y: number): number {
  return vnoise(x, y) * 0.65 + vnoise(x * 2.13 + 5.2, y * 2.13 - 1.7) * 0.35;
}

// ---------------------------------------------------------------------------
// Per-theme sky gradient. Each theme gets a 4-stop ramp from horizon-floor to
// the bright crown of the sky, plus a storm tint and a lightning flash color.
// Pulled from the shared palette so it tracks light / dark / sunset.
// ---------------------------------------------------------------------------
type SkyPalette = {
  low: Color; // sunken / cloud-shadow cubes
  mid: Color; // resting sky
  high: Color; // raised / lit crests
  glow: Color; // hot accent on the tallest cubes
  storm: Color; // cool storm wash mixed in during the storm phase
  flash: Color; // lightning
};

function skyPalette(theme: Theme): SkyPalette {
  const sw = THEME_SWATCHES[theme];
  const globe = GLOBE_COLORS[theme];
  if (theme === "dark") {
    return {
      low: new Color("#0d1726"),
      mid: new Color("#27406b"),
      high: new Color(sw.accent), // #6aa8ff
      glow: new Color("#ffd27a"),
      storm: new Color("#3a2f6b"),
      flash: new Color("#e9f3ff"),
    };
  }
  if (theme === "sunset") {
    return {
      low: new Color("#6b2f1a"),
      mid: new Color("#d8743a"),
      high: new Color("#f6c178"),
      glow: new Color("#fff0c2"),
      storm: new Color(globe.cat.lived), // deep indigo wash
      flash: new Color("#fff4d8"),
    };
  }
  // light
  return {
    low: new Color("#8fb2da"),
    mid: new Color("#bfd8f2"),
    high: new Color(sw.accent), // #2563eb
    glow: new Color("#fff6cf"),
    storm: new Color("#5b6b80"),
    flash: new Color("#ffffff"),
  };
}

// Scratch objects reused every frame (no per-frame allocation).
const tmpObj = new Object3D();
const tmpColor = new Color();
const cLow = new Color();
const cMid = new Color();
const cHigh = new Color();
const cGlow = new Color();
const cStorm = new Color();
const cFlash = new Color();

// A squall: a moving low-pressure gaussian injected on tap. Drifts and decays.
type Squall = {
  x: number; // grid-space center
  y: number;
  vx: number; // drift
  vy: number;
  age: number;
  life: number;
};

function WeatherField({
  theme,
  reduceMotion,
  squalls,
  lightning,
}: {
  theme: Theme;
  reduceMotion: boolean;
  squalls: React.RefObject<Squall[]>;
  // current lightning column (-1 = none) + its 0..1 intensity, mutated in-frame
  lightning: React.RefObject<{ col: number; t: number }>;
}) {
  const meshRef = useRef<InstancedMesh>(null);
  const palette = useMemo(() => skyPalette(theme), [theme]);
  // Demand-mode (reduceMotion) needs an explicit invalidate after an imperative
  // bake so the renderer paints the freshly-graded still.
  const invalidate = useThree((s) => s.invalidate);

  const geom = useMemo(() => new BoxGeometry(CUBE, 1, CUBE), []);
  const mat = useMemo(
    () =>
      new MeshStandardMaterial({
        roughness: 0.62,
        metalness: 0.08,
        // instanceColor multiplies vertex colors; keep the base white.
        color: new Color("#ffffff"),
      }),
    []
  );

  useEffect(() => {
    return () => {
      geom.dispose();
      mat.dispose();
    };
  }, [geom, mat]);

  // Time accumulator (frozen under reduceMotion). Start at a luminous, clear
  // mid-morning (sun ≈ 0.84, no storm) so the very first frame is an
  // already-graded, screenshot-worthy skyscape — no warm-up needed.
  const clock = useRef(7.0);
  const builtOnce = useRef(false);

  // Core field evaluation, shared by the live loop and the static first build.
  const rebuild = useCallback(
    (time: number) => {
      const mesh = meshRef.current;
      if (!mesh) return;

      cLow.copy(palette.low);
      cMid.copy(palette.mid);
      cHigh.copy(palette.high);
      cGlow.copy(palette.glow);
      cStorm.copy(palette.storm);
      cFlash.copy(palette.flash);

      // Time-of-day in 0..1 (loops): dawn→noon→dusk→storm→dawn …
      const dayPhase = (time * 0.045) % 1;
      // Brightness ramp: dim at the dawn/dusk ends, bright at midday, then a
      // dark storm trough centered ~0.78.
      const sun = Math.sin(dayPhase * Math.PI); // 0→1→0 across the "day"
      const stormPhase = Math.max(
        0,
        Math.sin((dayPhase - 0.62) * Math.PI * 2.6)
      ); // ramps up into the storm window
      const storm = Math.min(1, stormPhase * 1.15);

      // Front scroll — the whole pressure field slides across the dome.
      const frontX = time * 0.16;
      const frontY = time * 0.07;
      // Cloud band drift (independent, faster, mostly along X).
      const cloudX = time * 0.33;
      const cloudY = time * 0.05;

      const sq = squalls.current ?? [];
      const lt = lightning.current ?? { col: -1, t: 0 };

      let i = 0;
      for (let gy = 0; gy < GRID; gy++) {
        for (let gx = 0; gx < GRID; gx++) {
          // Normalized grid coords centered at 0 (−1..1-ish).
          const nx = (gx - HALF) / HALF;
          const ny = (gy - HALF) / HALF;

          // --- PRESSURE FIELD → base height ---------------------------------
          const p = fbm2(gx * 0.11 + frontX, gy * 0.11 + frontY); // 0..1
          // Bias toward the crown so the dome reads as a sky (taller in middle).
          const radial = 1 - Math.min(1, Math.hypot(nx, ny));
          let h = p * 1.7 + radial * 0.5;

          // --- CLOUD MASK → carve dark sunken gaps --------------------------
          const cloud = vnoise(gx * 0.16 + cloudX, gy * 0.16 + cloudY);
          // Sharpen into bands: where cloud noise is high, push the cube DOWN.
          const band = Math.max(0, (cloud - 0.52) / 0.48); // 0..~1
          const cloudCut = band * band; // 0..1, soft edges
          h -= cloudCut * 1.35;

          // --- SQUALLS → moving low-pressure gaussian dimples ---------------
          let squallPull = 0;
          for (let s = 0; s < sq.length; s++) {
            const q = sq[s];
            const dx = gx - q.x;
            const dy = gy - q.y;
            const d2 = dx * dx + dy * dy;
            const env = Math.min(1, q.age / 0.6) * (1 - q.age / q.life);
            const fall = Math.exp(-d2 / 70);
            squallPull += fall * env;
          }
          squallPull = Math.min(1.6, squallPull);
          // Churn: a fast ripple inside the dimple so it reads as turbulent.
          const churn =
            squallPull > 0.02 ? Math.sin(gx * 0.7 + gy * 0.55 + time * 6.0) : 0;
          h -= squallPull * 2.0 + squallPull * churn * 0.25;

          // Settle to a sensible range; floor so cubes never invert.
          if (h < 0.12) h = 0.12;

          // --- LIGHTNING → whole-column flash -------------------------------
          // A single grid column (constant gx) blasts white briefly.
          const isStrikeCol = lt.col >= 0 && Math.abs(gx - lt.col) <= 1;
          const strike = isStrikeCol
            ? lt.t * (1 - Math.abs(gx - lt.col) * 0.45)
            : 0;

          // --- COLOR GRADE --------------------------------------------------
          // Normalized height for color (cloud-sunk → low, crests → high/glow).
          const hn = Math.min(1, h / 2.3);
          // base sky ramp by height
          tmpColor.copy(cLow).lerp(cMid, smooth(hn, 0.0, 0.55));
          tmpColor.lerp(cHigh, smooth(hn, 0.5, 0.92));
          tmpColor.lerp(cGlow, smooth(hn, 0.86, 1.0) * (0.5 + sun * 0.5));
          // global day dimming
          const dim = 0.42 + sun * 0.58;
          tmpColor.multiplyScalar(dim);
          // storm wash — cool the cloudy / low cubes during the storm window
          if (storm > 0.001) {
            const stormAmt = storm * (0.35 + cloudCut * 0.5 + squallPull * 0.4);
            tmpColor.lerp(cStorm, Math.min(0.85, stormAmt));
          }
          // lightning over-blast
          if (strike > 0.001) {
            tmpColor.lerp(cFlash, Math.min(1, strike));
            h += strike * 0.6; // columns jolt up on a strike
          }

          // --- WRITE INSTANCE ----------------------------------------------
          // Plane position with a gentle dome: the rim sinks below the crown so
          // the field reads as a bowed sky. Uses normalized radius (nx,ny in
          // −1..1) so curvature is bounded regardless of grid size. A slow
          // breathing term gives the whole dome a living undulation.
          const px = (gx - HALF) * SPACING;
          const pz = (gy - HALF) * SPACING;
          const r2 = nx * nx + ny * ny; // 0 (center) .. 2 (corners)
          const breathe = Math.sin(time * 0.5 + r2 * 1.4) * 0.4;
          const domeY = -r2 * 0.5 * DOME + breathe;
          tmpObj.position.set(px, domeY + h / 2, pz);
          tmpObj.scale.set(1, h, 1);
          tmpObj.rotation.set(0, 0, 0);
          tmpObj.updateMatrix();
          mesh.setMatrixAt(i, tmpObj.matrix);
          mesh.setColorAt(i, tmpColor);
          i++;
        }
      }

      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    },
    [palette, squalls, lightning]
  );

  // Bake a strong, fully-graded first frame synchronously on mount (and on
  // theme change) so the very first paint is the finished skyscape — and so the
  // demand-driven reduceMotion render has data even if no frame loop runs.
  useEffect(() => {
    builtOnce.current = false;
    rebuild(clock.current);
    builtOnce.current = true;
    invalidate(); // paint the baked still even in demand mode
  }, [theme, rebuild, invalidate]);

  useFrame((_, delta) => {
    if (!builtOnce.current) {
      rebuild(clock.current);
      builtOnce.current = true;
      return;
    }
    if (reduceMotion) return; // frozen graded still

    const dt = Math.min(delta, 0.05);
    clock.current += dt;

    // advance squalls
    const sq = squalls.current;
    if (sq && sq.length) {
      for (let s = 0; s < sq.length; s++) {
        const q = sq[s];
        q.age += dt;
        q.x += q.vx * dt;
        q.y += q.vy * dt;
      }
      // cull dead
      for (let s = sq.length - 1; s >= 0; s--) {
        if (sq[s].age >= sq[s].life) sq.splice(s, 1);
      }
    }

    // advance / decay lightning
    const lt = lightning.current;
    if (lt) {
      if (lt.col >= 0) {
        lt.t -= dt * 3.2;
        if (lt.t <= 0) {
          lt.t = 0;
          lt.col = -1;
        }
      } else if (Math.random() < dt * 0.28) {
        // spontaneous strikes, more likely during the storm window
        lt.col = Math.floor(Math.random() * GRID);
        lt.t = 1;
      }
    }

    rebuild(clock.current);
  });

  return (
    <instancedMesh ref={meshRef} args={[geom, mat, COUNT]} frustumCulled={false} />
  );
}

function smooth(x: number, a: number, b: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

// ---------------------------------------------------------------------------
// Drag-to-orbit rig + lights + tap-to-squall raycasting onto the dome plane.
// ---------------------------------------------------------------------------
function Rig({
  reduceMotion,
  drag,
  onTapWorld,
}: {
  reduceMotion: boolean;
  drag: React.RefObject<{ azim: number; elev: number; tAzim: number; tElev: number }>;
  onTapWorld: (gx: number, gy: number) => void;
}) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const size = useThree((s) => s.size);
  const gl = useThree((s) => s.gl);

  // Fit + tasteful resting tilt: orbit around the dome center.
  useFrame((_, delta) => {
    const d = drag.current;
    if (!d) return;
    if (!reduceMotion) {
      // idle drift adds life when the user is not dragging
      d.tAzim += delta * 0.04;
    }
    const ease = reduceMotion ? 1 : Math.min(1, delta * 5);
    d.azim += (d.tAzim - d.azim) * ease;
    d.elev += (d.tElev - d.elev) * ease;

    const aspect = size.width / Math.max(size.height, 1);
    // distance keeps the dome framed across aspect ratios
    const radius = SPAN * (aspect < 0.85 ? 3.0 : 2.35);
    const cx = Math.sin(d.azim) * Math.cos(d.elev) * radius;
    const cy = Math.sin(d.elev) * radius + 2.2;
    const cz = Math.cos(d.azim) * Math.cos(d.elev) * radius;
    camera.position.set(cx, cy, cz);
    camera.lookAt(0, 0.4, 0);
  });

  // Pointer interaction: distinguish a drag (orbit) from a tap (squall).
  const downPt = useRef<{ x: number; y: number; az: number; el: number } | null>(
    null
  );
  const moved = useRef(false);
  const raycaster = useMemo(() => new Raycaster(), []);
  const ndc = useMemo(() => new Vector2(), []);

  useEffect(() => {
    const el = gl.domElement;

    const onDown = (e: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      downPt.current = { x: e.clientX, y: e.clientY, az: d.tAzim, el: d.tElev };
      moved.current = false;
      el.setPointerCapture?.(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      const start = downPt.current;
      const d = drag.current;
      if (!start || !d) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (Math.abs(dx) + Math.abs(dy) > 5) moved.current = true;
      d.tAzim = start.az - dx * 0.006;
      // clamp elevation to a pleasant band (never under the dome)
      const next = start.el + dy * 0.005;
      d.tElev = Math.max(0.12, Math.min(0.95, next));
    };
    const onUp = (e: PointerEvent) => {
      const start = downPt.current;
      downPt.current = null;
      el.releasePointerCapture?.(e.pointerId);
      if (!start || moved.current) return;
      // It was a tap → raycast to the dome plane (y≈0) and convert to grid.
      const rect = el.getBoundingClientRect();
      ndc.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(ndc, camera);
      // Intersect with the horizontal plane y=0.4 (mid dome height).
      const origin = raycaster.ray.origin;
      const dir = raycaster.ray.direction;
      if (Math.abs(dir.y) < 1e-4) return;
      const t = (0.4 - origin.y) / dir.y;
      if (t < 0) return;
      const hit = new Vector3(
        origin.x + dir.x * t,
        0,
        origin.z + dir.z * t
      );
      const gx = hit.x / SPACING + HALF;
      const gy = hit.z / SPACING + HALF;
      if (gx >= -4 && gx <= GRID + 4 && gy >= -4 && gy <= GRID + 4) {
        onTapWorld(gx, gy);
      }
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
    };
  }, [gl, camera, drag, onTapWorld, raycaster, ndc]);

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[6, 10, 4]} intensity={0.9} />
      <directionalLight position={[-5, 4, -6]} intensity={0.35} />
    </>
  );
}

function Scene({
  theme,
  reduceMotion,
  squalls,
  lightning,
  drag,
}: {
  theme: Theme;
  reduceMotion: boolean;
  squalls: React.RefObject<Squall[]>;
  lightning: React.RefObject<{ col: number; t: number }>;
  drag: React.RefObject<{ azim: number; elev: number; tAzim: number; tElev: number }>;
}) {
  const spawnSquall = useCallback(
    (gx: number, gy: number) => {
      const list = squalls.current;
      if (!list) return;
      // cap concurrent squalls so the loop stays cheap
      if (list.length >= 4) list.shift();
      list.push({
        x: gx,
        y: gy,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        age: 0,
        life: 3.6,
      });
      // a tap also tends to trigger a nearby strike
      const lt = lightning.current;
      if (lt && lt.col < 0) {
        lt.col = Math.max(0, Math.min(GRID - 1, Math.round(gx)));
        lt.t = 1;
      }
    },
    [squalls, lightning]
  );

  return (
    <>
      <Rig reduceMotion={reduceMotion} drag={drag} onTapWorld={spawnSquall} />
      <WeatherField
        theme={theme}
        reduceMotion={reduceMotion}
        squalls={squalls}
        lightning={lightning}
      />
    </>
  );
}

export default function WeatherPixels() {
  const { theme, reduceMotion } = useTheme();

  // Client-only mount guard: keeps the WebGL <Canvas> (and any `window` access
  // inside three / r3f) out of the server render so static export stays clean.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Long-lived mutable simulation state (never triggers re-render).
  const squalls = useRef<Squall[]>([]);
  const lightning = useRef<{ col: number; t: number }>({ col: -1, t: 0 });
  const drag = useRef({ azim: 0.65, elev: 0.42, tAzim: 0.65, tElev: 0.42 });

  const bg = THEME_SWATCHES[theme].bg;

  return (
    <div className="relative h-full w-full select-none">
      {mounted ? (
        <Canvas
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: false }}
          camera={{ position: [10, 6, 14], fov: 42, near: 0.1, far: 200 }}
          frameloop={reduceMotion ? "demand" : "always"}
          style={{ touchAction: "none", background: bg }}
        >
          <color attach="background" args={[bg]} />
          {/* Atmospheric depth: the far rim of the dome melts into the sky
              color. Tuned to the resting camera distance so the back third
              fogs out while the foreground stays crisp. */}
          <fog attach="fog" args={[bg, 34, 78]} />
          <Scene
            theme={theme}
            reduceMotion={reduceMotion}
            squalls={squalls}
            lightning={lightning}
            drag={drag}
          />
        </Canvas>
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm text-muted">
          Loading sky…
        </div>
      )}

      {/* Title card — semantic tokens so it tracks the theme. */}
      <div className="pointer-events-none absolute left-4 top-4 max-w-[78%] rounded-lg border border-border bg-bg/55 px-3 py-2 backdrop-blur">
        <p className="flex items-center gap-1.5 text-sm font-medium text-fg">
          <CloudRain className="h-4 w-4 text-accent" aria-hidden />
          Weather Pixels
        </p>
        <p className="text-xs text-muted">a voxel skyscape</p>
      </div>

      {/* Hint pill */}
      <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center px-4">
        <p className="flex items-center gap-2 rounded-full border border-border bg-bg/55 px-3 py-1.5 text-xs text-muted backdrop-blur">
          {reduceMotion ? (
            <>
              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              Reduced motion — sky frozen to a graded still
            </>
          ) : (
            <>
              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              Drag to orbit
              <span className="text-border">·</span>
              <Zap className="h-3.5 w-3.5" aria-hidden />
              Tap to summon a squall
            </>
          )}
        </p>
      </div>
    </div>
  );
}
