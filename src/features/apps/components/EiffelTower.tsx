"use client";

import { useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import {
  BoxGeometry,
  CatmullRomCurve3,
  CylinderGeometry,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  type Object3D,
  Quaternion,
  SphereGeometry,
  TubeGeometry,
  Vector3,
} from "three";
import { Landmark, RotateCcw } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { THEME_SWATCHES, type Theme } from "@/lib/theme";

// ---------------------------------------------------------------------------
// The Eiffel Tower, modeled procedurally from its real proportions (330 m to the
// tip; platforms at 57 / 115 / 276 m; the inward-curving "Eiffel curve" legs).
// One scaled unit ≈ 66 m. Everything is generated in-code — no external asset —
// so it's self-contained, fast, and there's nothing to license or fetch.
// ---------------------------------------------------------------------------

const ROOF = 4.55; // ~300 m roof
const TIP = 5.0; //   ~330 m antenna tip
const P1 = 0.86; //   1st platform, 57 m
const P2 = 1.74; //   2nd platform, 115 m
const P3 = 4.18; //   3rd platform, 276 m

// Half-side of the square cross-section vs. height — the tapering silhouette.
// Piecewise control points, smoothstep-interpolated for the graceful curve.
const CURVE: [number, number][] = [
  [0.0, 1.0],
  [0.3, 0.82],
  [0.6, 0.7],
  [P1, 0.6],
  [1.2, 0.46],
  [P2, 0.33],
  [2.6, 0.22],
  [3.4, 0.15],
  [P3, 0.1],
  [ROOF, 0.065],
];

function halfSideAt(y: number): number {
  if (y <= CURVE[0][0]) return CURVE[0][1];
  const last = CURVE[CURVE.length - 1];
  if (y >= last[0]) return last[1];
  for (let i = 0; i < CURVE.length - 1; i++) {
    const [y0, s0] = CURVE[i];
    const [y1, s1] = CURVE[i + 1];
    if (y >= y0 && y <= y1) {
      const t = (y - y0) / (y1 - y0);
      const tt = t * t * (3 - 2 * t); // smoothstep
      return s0 + (s1 - s0) * tt;
    }
  }
  return last[1];
}

// Corners ordered so consecutive indices share a vertical face.
const SIGNS: [number, number][] = [
  [1, 1],
  [1, -1],
  [-1, -1],
  [-1, 1],
];
function corner(y: number, i: number): Vector3 {
  const s = halfSideAt(y);
  return new Vector3(SIGNS[i][0] * s, y, SIGNS[i][1] * s);
}

type Palette = {
  iron: string;
  deck: string;
  ground: string;
  sky: string;
  groundLight: string;
  key: string;
  fill: string;
  beacon: string;
};

const PALETTES: Record<Theme, Palette> = {
  light: {
    iron: "#7c6647",
    deck: "#5d4a34",
    ground: "#ece3d3",
    sky: "#eef3fb",
    groundLight: "#d8ccb6",
    key: "#fff3dc",
    fill: "#d3def0",
    beacon: "#ffcf6b",
  },
  dark: {
    iron: "#c4a172",
    deck: "#8a6f4c",
    ground: "#141922",
    sky: "#2a394d",
    groundLight: "#0d1219",
    key: "#ffe7c2",
    fill: "#33465e",
    beacon: "#ffdc8f",
  },
  sunset: {
    iron: "#8f6a3f",
    deck: "#6b4d2c",
    ground: "#f0e1cd",
    sky: "#fde3c6",
    groundLight: "#e7cfa6",
    key: "#ffd9a0",
    fill: "#f3c795",
    beacon: "#ff9d54",
  },
};

// Build the whole tower as one THREE.Group: a single InstancedMesh for the
// wrought-iron lattice (rails + belts + cross-bracing), plus platforms, the four
// base arches, and the antenna.
function buildTower(palette: Palette): Group {
  const group = new Group();
  const iron = new MeshStandardMaterial({
    color: palette.iron,
    metalness: 0.5,
    roughness: 0.52,
  });
  const deckMat = new MeshStandardMaterial({
    color: palette.deck,
    metalness: 0.4,
    roughness: 0.6,
  });

  // Height levels: an even set from ground to roof, plus the exact platforms.
  const levels: number[] = [];
  const N = 26;
  for (let k = 0; k <= N; k++) levels.push((k / N) * ROOF);
  for (const p of [P1, P2, P3])
    if (!levels.some((l) => Math.abs(l - p) < 0.02)) levels.push(p);
  levels.sort((a, b) => a - b);

  const isPlatform = (y: number) => [P1, P2, P3].some((p) => Math.abs(y - p) < 0.02);

  const RAIL_T = 0.034;
  const BELT_T = 0.02;
  const DIAG_T = 0.017;
  type Beam = { a: Vector3; b: Vector3; t: number };
  const beams: Beam[] = [];

  // Four corner rails, following the curve segment by segment.
  for (let i = 0; i < 4; i++)
    for (let k = 0; k < levels.length - 1; k++)
      beams.push({ a: corner(levels[k], i), b: corner(levels[k + 1], i), t: RAIL_T });

  // Horizontal belts squaring the four corners — every other level + platforms.
  for (let k = 0; k < levels.length; k++) {
    const y = levels[k];
    if (k % 2 !== 0 && !isPlatform(y)) continue;
    for (let i = 0; i < 4; i++)
      beams.push({ a: corner(y, i), b: corner(y, (i + 1) % 4), t: BELT_T });
  }

  // X cross-bracing on each of the four faces, per height segment.
  for (let k = 0; k < levels.length - 1; k++) {
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4;
      beams.push({ a: corner(levels[k], i), b: corner(levels[k + 1], j), t: DIAG_T });
      beams.push({ a: corner(levels[k], j), b: corner(levels[k + 1], i), t: DIAG_T });
    }
  }

  // Pack every beam into one InstancedMesh (a unit box stretched along its axis).
  const unit = new BoxGeometry(1, 1, 1);
  const mesh = new InstancedMesh(unit, iron, beams.length);
  const m = new Matrix4();
  const q = new Quaternion();
  const up = new Vector3(0, 1, 0);
  const dir = new Vector3();
  const mid = new Vector3();
  const scale = new Vector3();
  const nrm = new Vector3();
  for (let idx = 0; idx < beams.length; idx++) {
    const { a, b, t } = beams[idx];
    dir.subVectors(b, a);
    const len = dir.length();
    mid.addVectors(a, b).multiplyScalar(0.5);
    nrm.copy(dir).normalize();
    q.setFromUnitVectors(up, nrm);
    scale.set(t, len, t);
    m.compose(mid, q, scale);
    mesh.setMatrixAt(idx, m);
  }
  mesh.instanceMatrix.needsUpdate = true;
  group.add(mesh);

  // Platforms — square decks a touch wider than the section they sit on.
  for (const p of [P1, P2, P3]) {
    const s = halfSideAt(p);
    const side = 2 * s + 0.14;
    const deck = new Mesh(new BoxGeometry(side, 0.05, side), deckMat);
    deck.position.y = p;
    group.add(deck);
  }

  // The four grand base arches (one per face), sweeping up under the 1st platform.
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    const f1 = corner(0.03, i);
    const f2 = corner(0.03, j);
    const midXZ = f1.clone().add(f2).multiplyScalar(0.5);
    const outward = new Vector3(midXZ.x, 0, midXZ.z).normalize().multiplyScalar(0.05);
    const peak = new Vector3(midXZ.x, P1 * 0.82, midXZ.z).add(outward);
    const curve = new CatmullRomCurve3([f1, peak, f2]);
    const tube = new TubeGeometry(curve, 28, 0.032, 8, false);
    group.add(new Mesh(tube, iron));
  }

  // Antenna mast + a warm beacon at the very tip.
  const antH = TIP - ROOF;
  const ant = new Mesh(new CylinderGeometry(0.009, 0.022, antH, 8), iron);
  ant.position.y = ROOF + antH / 2;
  group.add(ant);
  const beaconMat = new MeshStandardMaterial({
    color: palette.beacon,
    emissive: palette.beacon,
    emissiveIntensity: 1.4,
    roughness: 0.4,
  });
  const beacon = new Mesh(new SphereGeometry(0.032, 12, 12), beaconMat);
  beacon.position.y = TIP;
  group.add(beacon);

  return group;
}

function disposeGroup(root: Object3D) {
  const geos = new Set<{ dispose?: () => void }>();
  const mats = new Set<{ dispose?: () => void }>();
  root.traverse((o) => {
    const mesh = o as Mesh;
    if (mesh.geometry) geos.add(mesh.geometry);
    if (mesh.material)
      (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((mm) =>
        mats.add(mm as { dispose?: () => void })
      );
  });
  geos.forEach((g) => g.dispose?.());
  mats.forEach((mm) => mm.dispose?.());
}

function TowerModel({ palette }: { palette: Palette }) {
  const group = useMemo(() => buildTower(palette), [palette]);
  useEffect(() => () => disposeGroup(group), [group]);
  return <primitive object={group} />;
}

function Scene({ palette }: { palette: Palette }) {
  return (
    <>
      <hemisphereLight args={[palette.sky, palette.groundLight, 0.95]} />
      <directionalLight position={[6, 9, 4]} intensity={1.15} color={palette.key} />
      <directionalLight position={[-5, 4, -6]} intensity={0.35} color={palette.fill} />
      <TowerModel palette={palette} />
      {/* Ground plane for spatial reference while panning/zooming. */}
      <mesh rotation-x={-Math.PI / 2} position-y={0}>
        <circleGeometry args={[9, 64]} />
        <meshStandardMaterial color={palette.ground} roughness={1} metalness={0} />
      </mesh>
    </>
  );
}

export default function EiffelTower() {
  const { theme, reduceMotion } = useTheme();

  // Client-only mount guard: keep the WebGL <Canvas> (and any window access in
  // three / r3f) out of the server render.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const palette = PALETTES[theme];
  const bg = THEME_SWATCHES[theme].bg;

  return (
    <div className="relative h-full w-full select-none">
      {mounted ? (
        <Canvas
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: false }}
          camera={{ position: [5.2, 3.5, 7.1], fov: 42, near: 0.1, far: 100 }}
          frameloop={reduceMotion ? "demand" : "always"}
          style={{ touchAction: "none", background: bg }}
        >
          <color attach="background" args={[bg]} />
          <fog attach="fog" args={[bg, 17, 52]} />
          <Scene palette={palette} />
          <OrbitControls
            makeDefault
            target={[0, 2.25, 0]}
            enablePan
            enableZoom
            enableRotate
            enableDamping={!reduceMotion}
            dampingFactor={0.08}
            rotateSpeed={0.7}
            panSpeed={0.7}
            zoomSpeed={0.9}
            minDistance={1.4}
            maxDistance={20}
            maxPolarAngle={1.52}
            autoRotate={!reduceMotion}
            autoRotateSpeed={0.45}
          />
        </Canvas>
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm text-muted">
          Building the tower…
        </div>
      )}

      {/* Title card — semantic tokens so it tracks the theme. */}
      <div className="pointer-events-none absolute left-4 top-4 max-w-[82%] rounded-lg border border-border bg-bg/55 px-3 py-2 backdrop-blur">
        <p className="flex items-center gap-1.5 text-sm font-medium text-fg">
          <Landmark className="h-4 w-4 text-accent" aria-hidden />
          Eiffel Tower
        </p>
        <p className="text-xs text-muted">Paris · 1889 · 330 m of wrought iron</p>
      </div>

      {/* Controls hint */}
      <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center px-4">
        <p className="flex items-center gap-2 rounded-full border border-border bg-bg/55 px-3 py-1.5 text-xs text-muted backdrop-blur">
          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          {reduceMotion ? "Drag to explore" : "Drag to orbit"}
          <span className="text-border">·</span>
          scroll to zoom
          <span className="text-border">·</span>
          right-drag to pan
        </p>
      </div>
    </div>
  );
}
