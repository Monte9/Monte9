"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Group,
  Matrix4,
  Quaternion,
  Vector3,
  type PerspectiveCamera,
} from "three";
import { latLngToVec3, buildBorderPositions } from "@/components/globe-utils";
import { useTheme } from "@/components/ThemeProvider";
import { GLOBE_COLORS } from "@/lib/theme";
import { JOURNEY_STOPS, type JourneyStop } from "@/data/journey";

const GLOBE_RADIUS = 1;

// Stable camera so re-renders (theme/active changes) never reset the view.
const CAMERA_PROPS: { position: [number, number, number]; fov: number } = {
  position: [0, 0, 2.6],
  fov: 45,
};

// Orientation that brings a stop to front-center (+Z) AND keeps the globe's
// north pointing up on screen (no roll), so the country reads upright. A plain
// setFromUnitVectors(dir, +Z) centers the city but leaves the roll arbitrary,
// which is why India looked tilted — building a full north-up basis fixes it.
function targetQuaternion(stop: JourneyStop): Quaternion {
  const [x, y, z] = latLngToVec3(stop.lat, stop.lng, GLOBE_RADIUS);
  const f = new Vector3(x, y, z).normalize(); // city → +Z (faces camera)
  const north = new Vector3(0, 1, 0);
  const right = new Vector3().crossVectors(north, f).normalize(); // → +X (screen right)
  const up = new Vector3().crossVectors(f, right); // → +Y (screen up, toward north)
  // makeBasis(right,up,f) maps local x,y,z → those axes; invert so the globe
  // rotates to put the city at +Z with north up.
  const m = new Matrix4().makeBasis(right, up, f);
  return new Quaternion().setFromRotationMatrix(m).invert();
}

// Keep the globe fully framed regardless of viewport aspect; only adjusts
// distance, never the orientation (that is driven by the scroll target).
function FitCamera() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const size = useThree((s) => s.size);
  useEffect(() => {
    const aspect = size.width / Math.max(size.height, 1);
    const halfFov = ((camera.fov * Math.PI) / 180) / 2;
    const margin = 1.25;
    const dist = Math.max(
      margin / Math.tan(halfFov),
      margin / (Math.tan(halfFov) * aspect)
    );
    camera.position.set(0, 0, dist);
    camera.updateProjectionMatrix();
  }, [camera, size]);
  return null;
}

function Marker({
  stop,
  color,
  pulse,
}: {
  stop: JourneyStop;
  color: string;
  pulse: boolean;
}) {
  const ref = useRef<Group>(null);
  const pos = useMemo(
    () => latLngToVec3(stop.lat, stop.lng, GLOBE_RADIUS * 1.01),
    [stop.lat, stop.lng]
  );

  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    // Gentle pulse on the active marker; static otherwise.
    const t = state.clock.getElapsedTime();
    const s = pulse ? 1 + Math.sin(t * 3) * 0.18 : 0.8;
    g.scale.setScalar(s);
  });

  return (
    <group ref={ref} position={pos}>
      <mesh>
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {/* Soft halo ring that reads as a pulse on the active stop. */}
      <mesh>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={pulse ? 0.25 : 0} />
      </mesh>
    </group>
  );
}

function Scene({
  activeIndex,
  reduceMotion,
}: {
  activeIndex: number;
  reduceMotion: boolean;
}) {
  const { theme } = useTheme();
  const colors = GLOBE_COLORS[theme];
  const borders = useMemo(
    () => buildBorderPositions(GLOBE_RADIUS * 1.002),
    []
  );
  const targets = useMemo(() => JOURNEY_STOPS.map(targetQuaternion), []);

  const groupRef = useRef<Group>(null);
  const didInit = useRef(false);

  // Snap to the first target on mount so the opening stop is already framed.
  useEffect(() => {
    if (groupRef.current && !didInit.current) {
      groupRef.current.quaternion.copy(targets[0]);
      didInit.current = true;
    }
  }, [targets]);

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;
    const target = targets[activeIndex] ?? targets[0];
    if (reduceMotion) {
      g.quaternion.copy(target);
      return;
    }
    // Frame-rate independent slerp toward the active stop's orientation.
    const alpha = 1 - Math.pow(0.0015, Math.min(delta, 0.05));
    g.quaternion.slerp(target, alpha);
  });

  return (
    <>
      <FitCamera />
      <ambientLight intensity={0.9} />
      <directionalLight position={[3, 2, 2]} intensity={0.45} />

      <group ref={groupRef}>
        <mesh>
          <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
          <meshStandardMaterial
            color={colors.sphere}
            roughness={1}
            metalness={0}
          />
        </mesh>

        <lineSegments>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[borders, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color={colors.border} transparent opacity={0.5} />
        </lineSegments>

        {JOURNEY_STOPS.map((stop, i) => (
          <Marker
            key={stop.id}
            stop={stop}
            color={colors.cat.home}
            pulse={i === activeIndex && !reduceMotion}
          />
        ))}
      </group>
    </>
  );
}

export default function JourneyGlobe() {
  const { reduceMotion } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);

  // Client-only mount guard: keeps the WebGL <Canvas> (and any `window` access
  // inside three / r3f) out of the server render, so static export stays clean
  // — the same effect as a `dynamic(..., { ssr: false })` import, but in-file.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // One ref per caption section; the most-centered one drives the globe.
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the entry with the largest intersection ratio that is on screen.
        let best: { index: number; ratio: number } | null = null;
        for (const e of entries) {
          const idx = Number(
            (e.target as HTMLElement).dataset.index ?? "-1"
          );
          if (idx < 0) continue;
          if (e.isIntersecting && (!best || e.intersectionRatio > best.ratio)) {
            best = { index: idx, ratio: e.intersectionRatio };
          }
        }
        if (best) setActiveIndex(best.index);
      },
      {
        root,
        // Trigger when a section reaches the vertical middle of the stage.
        rootMargin: "-45% 0px -45% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    const els = sectionRefs.current.filter(Boolean) as HTMLElement[];
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    // Globe-first stage: cancel page padding, fill from below the header to the
    // viewport bottom. The globe is sticky inside a tall scroll container so it
    // stays in view while the caption stack scrolls past it.
    <div className="relative -mx-5 -mt-10 -mb-28 sm:-mb-12">
      <div
        ref={scrollRef}
        className="relative h-[calc(100svh-8.5rem)] overflow-y-auto sm:h-[calc(100svh-4.5rem)]"
      >
        {/* Sticky WebGL stage — pinned to the top of the scroll container. */}
        <div className="pointer-events-none sticky top-0 z-0 h-[calc(100svh-8.5rem)] w-full sm:h-[calc(100svh-4.5rem)]">
          {mounted ? (
            <Canvas camera={CAMERA_PROPS} dpr={[1, 2]}>
              <Scene activeIndex={activeIndex} reduceMotion={reduceMotion} />
            </Canvas>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-muted">
              Loading the journey…
            </div>
          )}

          {/* Header overlay */}
          <div className="absolute inset-x-0 top-0 px-5 pt-4 text-center">
            <p className="text-xs uppercase tracking-widest text-muted">
              The Journey
            </p>
            <h1 className="mt-1 text-lg font-semibold text-fg">
              Cities of a life in code
            </h1>
          </div>

          {/* Scroll hint (hidden once you move past the first stop) */}
          {activeIndex === 0 && (
            <p className="absolute inset-x-0 bottom-4 text-center text-xs text-muted">
              Scroll to travel ↓
            </p>
          )}
        </div>

        {/* Caption stack: pulled up to overlap the sticky globe so each stop's
            text sits in front of the globe as it flies into place. The negative
            top margin overlaps the first section onto the sticky stage. */}
        <div className="relative z-10 -mt-[calc(100svh-8.5rem)] sm:-mt-[calc(100svh-4.5rem)]">
          {JOURNEY_STOPS.map((stop, i) => {
            const active = i === activeIndex;
            return (
              <section
                key={stop.id}
                data-index={i}
                ref={(el) => {
                  sectionRefs.current[i] = el;
                }}
                className="flex min-h-[80svh] items-end justify-center px-5 pb-16"
              >
                <div
                  className={[
                    "pointer-events-auto w-full max-w-md rounded-2xl border px-5 py-4 backdrop-blur",
                    "transition-[opacity,transform,border-color] duration-500 ease-out",
                    active
                      ? "border-accent bg-bg/80 opacity-100 translate-y-0"
                      : "border-border bg-bg/55 opacity-60 translate-y-2",
                  ].join(" ")}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <h2
                      className={[
                        "text-base font-semibold",
                        active ? "text-accent" : "text-fg",
                      ].join(" ")}
                    >
                      {stop.city}
                      <span className="text-muted">, {stop.country}</span>
                    </h2>
                    <span className="shrink-0 text-xs text-muted">
                      {stop.period}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-fg">
                    {stop.blurb}
                  </p>
                  <div className="mt-3 flex items-center gap-1.5">
                    {JOURNEY_STOPS.map((s, j) => (
                      <span
                        key={s.id}
                        className={[
                          "h-1 rounded-full transition-all duration-300",
                          j === activeIndex
                            ? "w-6 bg-accent"
                            : "w-2 bg-border",
                        ].join(" ")}
                      />
                    ))}
                  </div>
                </div>
              </section>
            );
          })}
          {/* Tail spacer so the last stop can fully reach the center. */}
          <div className="h-[30svh]" />
        </div>
      </div>
    </div>
  );
}
