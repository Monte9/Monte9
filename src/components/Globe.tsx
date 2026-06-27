"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Color, DoubleSide, type PerspectiveCamera } from "three";
import { TRAVEL_COUNTRIES, type TravelCountry } from "@/data/travel";
import { buildBorderPositions, buildCountryFill } from "@/components/globe-utils";
import { useTheme } from "@/components/ThemeProvider";
import { GLOBE_COLORS } from "@/lib/theme";

const GLOBE_RADIUS = 1;

type Handlers = {
  activeName: string | null;
  onHover: (c: TravelCountry | null) => void;
  onSelect: (c: TravelCountry | null) => void;
  paused: boolean;
};

function lighten(hex: string, amt: number): string {
  const c = new Color(hex);
  c.lerp(new Color(1, 1, 1), amt);
  return `#${c.getHexString()}`;
}

function CountryFill({
  country,
  color,
  active,
  onHover,
  onSelect,
}: {
  country: TravelCountry;
  color: string;
  active: boolean;
} & Pick<Handlers, "onHover" | "onSelect">) {
  const positions = useMemo(
    () => buildCountryFill(country.atlasName, GLOBE_RADIUS * 1.004),
    [country.atlasName]
  );
  return (
    <mesh
      scale={active ? 1.012 : 1}
      renderOrder={active ? 2 : 1}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(country);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        onHover(null);
        document.body.style.cursor = "auto";
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(country);
      }}
    >
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <meshBasicMaterial
        color={active ? lighten(color, 0.4) : color}
        transparent
        opacity={active ? 1 : 0.88}
        side={DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

function FitCamera() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const size = useThree((s) => s.size);
  useEffect(() => {
    const aspect = size.width / Math.max(size.height, 1);
    const halfFov = ((camera.fov * Math.PI) / 180) / 2;
    const margin = 1.1;
    const distForHeight = margin / Math.tan(halfFov);
    const distForWidth = margin / (Math.tan(halfFov) * aspect);
    camera.position.set(0, 0, Math.max(distForHeight, distForWidth));
    camera.updateProjectionMatrix();
  }, [camera, size]);
  return null;
}

function Scene({ activeName, onHover, onSelect, paused }: Handlers) {
  const { theme, reduceMotion } = useTheme();
  const colors = GLOBE_COLORS[theme];
  const borders = useMemo(() => buildBorderPositions(GLOBE_RADIUS * 1.002), []);
  const [interacting, setInteracting] = useState(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  return (
    <>
      <FitCamera />
      <ambientLight intensity={0.9} />
      <directionalLight position={[3, 2, 2]} intensity={0.45} />

      {/* Sphere occludes far-side picking; clicking the ocean deselects. */}
      <mesh
        onPointerOver={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(null);
        }}
      >
        <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
        <meshStandardMaterial color={colors.sphere} roughness={1} metalness={0} />
      </mesh>

      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[borders, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={colors.border} transparent opacity={0.5} />
      </lineSegments>

      {TRAVEL_COUNTRIES.map((c) => (
        <CountryFill
          key={c.name}
          country={c}
          color={colors.cat[c.category]}
          active={activeName === c.name}
          onHover={onHover}
          onSelect={onSelect}
        />
      ))}

      <OrbitControls
        makeDefault
        enableZoom={false}
        enablePan={false}
        rotateSpeed={0.5}
        autoRotate={!interacting && !reduceMotion && !paused}
        autoRotateSpeed={0.55}
        onStart={() => {
          if (resumeTimer.current) clearTimeout(resumeTimer.current);
          setInteracting(true);
        }}
        onEnd={() => {
          resumeTimer.current = setTimeout(() => setInteracting(false), 1500);
        }}
      />
    </>
  );
}

export default function Globe(props: Handlers) {
  return (
    <Canvas camera={{ position: [0, 0, 2.6], fov: 45 }} dpr={[1, 2]}>
      <Scene {...props} />
    </Canvas>
  );
}
