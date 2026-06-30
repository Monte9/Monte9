"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Plane, RotateCw, Hand } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import {
  BOARDING_PASSES,
  PASSENGER,
  type BoardingPass as Pass,
} from "@/features/apps/data/boarding-pass";

/**
 * Boarding Pass — Monte's immigration-and-career arc as a tactile stack of
 * airline tickets you can physically handle.
 *
 * Craft notes (all DOM/CSS/canvas, zero WebGL):
 *  - The card itself is a CSS 3D scene: `perspective` on the stage, a flipper
 *    with `transform-style: preserve-3d` and front/back faces at 0deg/180deg.
 *  - Drag is pointer-driven with a rAF spring: you fling the top card and it
 *    eases (overshoot) toward rest. Past a threshold it "tears off" and the
 *    next leg snaps up from the stack with a magnetic settle.
 *  - The barcode and the tear perforation are procedurally drawn on <canvas>
 *    (a Code-128-flavored variable-width bar pattern + punched dot row).
 *
 * Mount guard keeps canvas / window access out of the server render so the
 * static export stays clean (same effect as dynamic ssr:false, in-file).
 */

// ---------------------------------------------------------------------------
// Spring helper — a tiny critically-ish damped spring used for the drag fling.
// ---------------------------------------------------------------------------
type Spring = { value: number; target: number; velocity: number };

function stepSpring(s: Spring, dt: number, stiffness: number, damping: number) {
  // Semi-implicit Euler; clamp dt so a backgrounded tab doesn't explode it.
  const t = Math.min(dt, 0.032);
  const force = (s.target - s.value) * stiffness;
  s.velocity += (force - s.velocity * damping) * t;
  s.value += s.velocity * t;
  return s;
}

// ---------------------------------------------------------------------------
// Canvas: barcode + tear perforation drawn per card.
// ---------------------------------------------------------------------------

// Deterministic PRNG so a given card always draws the same bars (no flicker
// across re-renders / theme changes).
function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function drawBarcode(
  canvas: HTMLCanvasElement,
  seed: number,
  fg: string,
  dpr: number
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (w === 0 || h === 0) return;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const rand = seeded(seed);
  ctx.fillStyle = fg;
  // Code-128-flavored: quiet zone, then variable-width bars/spaces.
  const quiet = 4;
  let x = quiet;
  const widths = [1, 1, 2, 2, 3]; // module widths to pick from
  while (x < w - quiet) {
    const bw = widths[Math.floor(rand() * widths.length)] * 1.6;
    // ~60% of modules are bars; the rest are gaps (leave white).
    if (rand() > 0.4) {
      ctx.fillRect(x, 0, Math.max(0.8, bw - 0.6), h);
    }
    x += bw;
  }
}

function drawPerforation(
  canvas: HTMLCanvasElement,
  color: string,
  dpr: number
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (w === 0 || h === 0) return;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  // A horizontal punched row: hollow dots = where the ticket would tear.
  const cy = h / 2;
  const r = Math.min(2.2, h / 2 - 0.5);
  const gap = 9;
  ctx.lineWidth = 1;
  for (let x = gap / 2; x < w; x += gap) {
    ctx.beginPath();
    ctx.arc(x, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.9;
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// Resolve a CSS custom-property color to a concrete rgb string for canvas.
function readVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return v || fallback;
}

// ---------------------------------------------------------------------------
// A single boarding-pass card (front + back faces, canvas bits).
// ---------------------------------------------------------------------------

function PassCard({
  pass,
  index,
  flipped,
  depthOffset,
  isTop,
  dragX,
  dragRot,
  lift,
  theme,
  onFlip,
}: {
  pass: Pass;
  index: number;
  flipped: boolean;
  depthOffset: number; // 0 = top of stack, 1,2,3 = behind
  isTop: boolean;
  dragX: number;
  dragRot: number; // degrees
  lift: number; // 0..1 hover/active lift
  theme: string;
  onFlip: () => void;
}) {
  const barcodeRef = useRef<HTMLCanvasElement>(null);
  const perfRef = useRef<HTMLCanvasElement>(null);

  // Redraw canvases on theme change / mount. Bars are seeded per-card so the
  // pattern is stable; theme only changes the ink color. If layout isn't ready
  // (clientWidth 0 on first paint) we retry once on the next frame.
  useEffect(() => {
    let raf = 0;
    const draw = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const ink = readVar("--fg", "#1a1a1a");
      const border = readVar("--border", "#e5e7eb");
      const bc = barcodeRef.current;
      const pf = perfRef.current;
      if (bc) drawBarcode(bc, index * 1337 + 7, ink, dpr);
      if (pf) drawPerforation(pf, border, dpr);
      // Retry next frame if the canvas had no measured size yet.
      if (bc && bc.clientWidth === 0) raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [index, theme]);

  // Stack depth: cards behind the top sit slightly lower, smaller, dimmer.
  const behind = depthOffset > 0;
  const ty = behind ? depthOffset * 14 : -lift * 10;
  const scale = behind ? 1 - depthOffset * 0.04 : 1 + lift * 0.01;
  const z = 100 - depthOffset;

  const accent = `hsl(${pass.hue} 70% 50%)`;
  const accentSoft = `hsl(${pass.hue} 70% 50% / 0.12)`;
  const accentLine = `hsl(${pass.hue} 60% 50% / 0.35)`;

  return (
    <div
      className="absolute left-1/2 top-1/2"
      style={{
        zIndex: z,
        transform: `translate(-50%, -50%) translate(${dragX}px, ${ty}px) rotate(${dragRot}deg) scale(${scale})`,
        transition: isTop
          ? "none"
          : "transform 420ms cubic-bezier(.22,1,.36,1), opacity 300ms",
        opacity: depthOffset > 2 ? 0 : 1 - depthOffset * 0.12,
        willChange: "transform",
        pointerEvents: isTop ? "auto" : "none",
      }}
    >
      {/* 3D flip scene */}
      <div
        style={{
          perspective: "1400px",
          width: "min(82vw, 340px)",
        }}
      >
        <div
          style={{
            position: "relative",
            transformStyle: "preserve-3d",
            transform: `rotateY(${flipped ? 180 : 0}deg)`,
            transition: "transform 650ms cubic-bezier(.2,.8,.2,1)",
            aspectRatio: "1.9 / 1",
            width: "100%",
          }}
        >
          {/* ---------- FRONT ---------- */}
          <div
            className="absolute inset-0 overflow-hidden rounded-2xl border border-border bg-surface"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              boxShadow: isTop
                ? `0 ${18 + lift * 16}px ${36 + lift * 24}px -18px rgba(0,0,0,${0.32 + lift * 0.12})`
                : "0 8px 22px -14px rgba(0,0,0,0.35)",
            }}
          >
            {/* top accent stripe */}
            <div
              className="absolute inset-x-0 top-0 h-1.5"
              style={{ background: `linear-gradient(90deg, ${accent}, ${accentLine})` }}
            />
            {/* faint guilloché wash */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: `radial-gradient(120% 90% at 0% 0%, ${accentSoft}, transparent 55%)`,
              }}
            />

            <div className="relative flex h-full flex-col p-3.5 sm:p-4">
              {/* header row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Plane className="h-3.5 w-3.5" style={{ color: accent }} aria-hidden />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                    {pass.carrier} · Boarding Pass
                  </span>
                </div>
                <span className="text-[10px] font-medium text-muted">{pass.cabin}</span>
              </div>

              {/* route */}
              <div className="mt-1.5 flex items-end justify-between gap-2">
                <div>
                  <div className="text-2xl font-bold leading-none tracking-tight text-fg sm:text-3xl">
                    {pass.fromCode}
                  </div>
                  <div className="mt-0.5 truncate text-[10px] text-muted">{pass.fromCity}</div>
                </div>

                <div className="mb-1 flex flex-1 items-center px-1">
                  <span className="h-px flex-1" style={{ background: accentLine }} />
                  <Plane
                    className="mx-1 h-3.5 w-3.5 rotate-90"
                    style={{ color: accent }}
                    aria-hidden
                  />
                  <span className="h-px flex-1" style={{ background: accentLine }} />
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold leading-none tracking-tight text-fg sm:text-3xl">
                    {pass.toCode}
                  </div>
                  <div className="mt-0.5 truncate text-[10px] text-muted">{pass.toCity}</div>
                </div>
              </div>

              {/* perforation tear line */}
              <div className="relative my-2">
                <canvas
                  ref={perfRef}
                  className="block h-2 w-full"
                  aria-hidden
                />
                {/* notches at the ends */}
                <span className="absolute -left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-bg" />
                <span className="absolute -right-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-bg" />
              </div>

              {/* meta grid */}
              <div className="grid grid-cols-4 gap-1.5 text-[9px] uppercase tracking-wide">
                <Field label="Flight" value={`${pass.carrier}${pass.flightNo}`} />
                <Field label="Gate" value={pass.gate} accent={accent} />
                <Field label="Seat" value={pass.seat} />
                <Field label="Year" value={pass.year} />
              </div>

              {/* passenger + role + barcode */}
              <div className="mt-auto flex items-end justify-between gap-3 pt-2">
                <div className="min-w-0">
                  <div className="text-[8px] uppercase tracking-wide text-muted">Passenger</div>
                  <div className="truncate text-[11px] font-semibold text-fg">{PASSENGER}</div>
                  <div className="mt-0.5 truncate text-[10px]" style={{ color: accent }}>
                    {pass.role}
                  </div>
                </div>
                <canvas
                  ref={barcodeRef}
                  className="h-7 w-20 shrink-0 sm:w-24"
                  aria-label={`Barcode for flight ${pass.carrier}${pass.flightNo}`}
                />
              </div>
            </div>
          </div>

          {/* ---------- BACK ---------- */}
          <div
            className="absolute inset-0 overflow-hidden rounded-2xl border border-border bg-surface-2"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              boxShadow: "0 18px 36px -18px rgba(0,0,0,0.4)",
            }}
          >
            <div
              className="absolute inset-x-0 top-0 h-1.5"
              style={{ background: `linear-gradient(90deg, ${accentLine}, ${accent})` }}
            />
            {/* magnetic stripe */}
            <div
              className="absolute inset-x-0 top-7 h-7"
              style={{
                background:
                  "repeating-linear-gradient(90deg, rgba(0,0,0,0.55) 0 2px, rgba(0,0,0,0.35) 2px 4px)",
                opacity: 0.5,
              }}
              aria-hidden
            />
            <div className="relative flex h-full flex-col justify-end p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                {pass.fromCode} → {pass.toCode} · {pass.year}
              </div>
              <p className="mt-1 text-[12px] leading-snug text-fg">{pass.story}</p>
              <div className="mt-2 text-[10px]" style={{ color: accent }}>
                {pass.role} — {pass.org}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* per-card flip affordance (top card only) */}
      {isTop && (
        <button
          type="button"
          // Stop pointer-down so tapping Story never starts a stage drag.
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onFlip();
          }}
          className="absolute bottom-1 right-1 z-10 flex items-center gap-1 rounded-full border border-border bg-bg/80 px-2 py-1 text-[10px] text-muted backdrop-blur transition-colors hover:text-fg"
          style={{ transform: "translateY(140%)" }}
        >
          <RotateCw className="h-3 w-3" aria-hidden />
          {flipped ? "Front" : "Story"}
        </button>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div>
      <div className="text-[8px] text-muted">{label}</div>
      <div className="text-[11px] font-semibold" style={{ color: accent ?? "var(--fg)" }}>
        {value}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main: the stack + drag/tear orchestration.
// ---------------------------------------------------------------------------

export default function BoardingPass() {
  const { theme, reduceMotion } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const passes = BOARDING_PASSES;
  const total = passes.length;

  // Which leg is currently the top of the stack (cycles 0..total-1).
  const [top, setTop] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Drag spring state for the top card (x position + rotation), in a ref so the
  // rAF loop mutates without re-rendering every frame.
  const springX = useRef<Spring>({ value: 0, target: 0, velocity: 0 });
  const lift = useRef<Spring>({ value: 0, target: 0, velocity: 0 });
  const [, force] = useState(0); // tick to flush ref values into transforms

  const dragging = useRef(false);
  const startX = useRef(0);
  const lastX = useRef(0);
  const lastT = useRef(0);
  const pointerVel = useRef(0);
  const tearing = useRef(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const prevT = useRef(0);

  const TEAR_THRESHOLD = 150;

  const advance = useCallback(() => {
    setTop((t) => (t + 1) % total);
    setFlipped(false);
  }, [total]);

  // Single rAF loop, stored in a ref so the latest closure (with current
  // `advance`) is always used. The loop integrates both springs each frame,
  // pushes one render tick, recycles the stack when a tear completes, and stops
  // itself once everything has settled. `kick()` (re)starts it on demand; it
  // never free-runs, so an idle stack costs zero frames.
  const loopRef = useRef<(t: number) => void>(() => {});
  useEffect(() => {
    const settled = () =>
      Math.abs(springX.current.value - springX.current.target) < 0.3 &&
      Math.abs(springX.current.velocity) < 0.3 &&
      Math.abs(lift.current.value - lift.current.target) < 0.003;

    loopRef.current = (t: number) => {
      const dt = prevT.current ? (t - prevT.current) / 1000 : 0.016;
      prevT.current = t;

      stepSpring(springX.current, dt, 170, 22);
      stepSpring(lift.current, dt, 200, 26);

      // Tear completed: card has flown far enough — recycle to the next leg.
      if (tearing.current && Math.abs(springX.current.value) > 600) {
        tearing.current = false;
        springX.current.value = 0;
        springX.current.target = 0;
        springX.current.velocity = 0;
        advance();
      }

      force((n) => (n + 1) & 0xffff);

      if (dragging.current || tearing.current || !settled()) {
        rafRef.current = requestAnimationFrame(loopRef.current);
      } else {
        rafRef.current = null;
        prevT.current = 0;
      }
    };
  }, [advance]);

  const kick = useCallback(() => {
    if (reduceMotion) {
      // No rAF under reduced motion — just flush a single render so direct
      // (non-animated) drag/teleport updates still paint.
      force((n) => (n + 1) & 0xffff);
      return;
    }
    if (rafRef.current === null) {
      prevT.current = 0;
      rafRef.current = requestAnimationFrame(loopRef.current);
    }
  }, [reduceMotion]);

  // Clean up any in-flight frame on unmount.
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      prevT.current = 0;
    };
  }, []);

  // ----- Pointer handlers (drag the top card) -----
  const onPointerDown = (e: React.PointerEvent) => {
    if (flipped) return; // don't drag while reading the back
    dragging.current = true;
    tearing.current = false;
    startX.current = e.clientX;
    lastX.current = e.clientX;
    lastT.current = performance.now();
    pointerVel.current = 0;
    lift.current.target = 1;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    kick();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - startX.current;
    const now = performance.now();
    const dt = Math.max(1, now - lastT.current);
    pointerVel.current = (e.clientX - lastX.current) / dt; // px/ms
    lastX.current = e.clientX;
    lastT.current = now;
    // Directly track the finger (no spring while held); the spring takes over
    // on release.
    springX.current.value = dx;
    springX.current.target = dx;
    springX.current.velocity = 0;
    if (reduceMotion) force((n) => (n + 1) & 0xffff);
  };

  const endDrag = () => {
    if (!dragging.current) return;
    dragging.current = false;
    lift.current.target = 0;
    lift.current.value = 0;
    const v = pointerVel.current * 1000; // px/s
    const dx = springX.current.value;
    // Tear if dragged far enough OR flung hard enough.
    const willTear = Math.abs(dx) > TEAR_THRESHOLD || Math.abs(v) > 900;

    if (reduceMotion) {
      // No spring/animation: resolve instantly to the end state.
      springX.current = { value: 0, target: 0, velocity: 0 };
      if (willTear) advance();
      else force((n) => (n + 1) & 0xffff);
      return;
    }

    if (willTear) {
      const dir = dx === 0 ? Math.sign(v) || 1 : Math.sign(dx);
      tearing.current = true;
      springX.current.target = dir * 900;
      springX.current.velocity = v;
    } else {
      // Snap back to the magnetic center.
      springX.current.target = 0;
      springX.current.velocity = v;
    }
    kick();
  };

  // Derived render values from the spring.
  const x = springX.current.value;
  const liftV = Math.max(0, Math.min(1, lift.current.value));
  // Rotation follows displacement + a touch of velocity for a paper feel.
  const rot = Math.max(-16, Math.min(16, x * 0.04));
  // Progress toward tear (drives hint + edge glow).
  const tearProgress = Math.min(1, Math.abs(x) / TEAR_THRESHOLD);

  // Build the visible stack order: top card first, then the ones behind.
  const order = useMemo(() => {
    const arr: { pass: Pass; index: number; depth: number }[] = [];
    for (let d = 0; d < total; d++) {
      const idx = (top + d) % total;
      arr.push({ pass: passes[idx], index: idx, depth: d });
    }
    // Render back-to-front so the top card paints last (and on top).
    return arr.reverse();
  }, [top, total, passes]);

  return (
    <div className="relative -mx-5 -mt-10 -mb-28 h-[calc(100svh-8.5rem)] overflow-hidden sm:-mb-12 sm:h-[calc(100svh-4.5rem)]">
      {/* ambient backdrop */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(80% 60% at 50% 30%, var(--surface) 0%, var(--bg) 70%)",
        }}
      />

      {/* header */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 px-5 pt-4 text-center">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted">
          Boarding Pass
        </p>
        <h1 className="mt-1 text-lg font-semibold text-fg">
          A life in four legs
        </h1>
      </div>

      {/* the stack stage */}
      <div
        ref={stageRef}
        className="absolute inset-0 flex touch-none select-none items-center justify-center overflow-hidden"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={endDrag}
        role="group"
        aria-label="Draggable stack of boarding passes"
      >
        {!mounted ? (
          <div className="text-sm text-muted">Loading boarding passes…</div>
        ) : (
          order.map(({ pass, index, depth }) => (
            <PassCard
              key={pass.id}
              pass={pass}
              index={index}
              flipped={depth === 0 ? flipped : false}
              depthOffset={depth}
              isTop={depth === 0}
              dragX={depth === 0 ? x : 0}
              dragRot={depth === 0 ? rot : 0}
              lift={depth === 0 ? liftV : 0}
              theme={theme}
              onFlip={() => setFlipped((f) => !f)}
            />
          ))
        )}

        {/* tear hint glow on the leading edge while dragging */}
        {mounted && !reduceMotion && tearProgress > 0.05 && !flipped && (
          <div
            className="pointer-events-none absolute top-1/2 z-[60] -translate-y-1/2 text-[10px] font-semibold uppercase tracking-widest"
            style={{
              left: x >= 0 ? undefined : "8%",
              right: x >= 0 ? "8%" : undefined,
              color: `hsl(${passes[top].hue} 70% 50%)`,
              opacity: tearProgress,
            }}
          >
            {tearProgress >= 1 ? "Release to tear" : x >= 0 ? "Tear ⟶" : "⟵ Tear"}
          </div>
        )}
      </div>

      {/* progress dots */}
      <div className="pointer-events-none absolute inset-x-0 bottom-16 z-20 flex items-center justify-center gap-1.5 sm:bottom-10">
        {passes.map((p, i) => (
          <span
            key={p.id}
            className="h-1 rounded-full transition-all duration-300"
            style={{
              width: i === top ? 22 : 7,
              background:
                i === top ? `hsl(${p.hue} 70% 50%)` : "var(--border)",
            }}
          />
        ))}
      </div>

      {/* footer hint */}
      <div className="pointer-events-none absolute inset-x-0 bottom-7 z-20 flex items-center justify-center gap-2 text-center sm:bottom-3">
        <Hand className="h-3.5 w-3.5 text-muted" aria-hidden />
        <p className="text-xs text-muted">
          {reduceMotion
            ? "Reduced motion — drag to tear, tap Story to flip"
            : "Drag a pass to tear it off · tap Story to flip"}
        </p>
      </div>
    </div>
  );
}
