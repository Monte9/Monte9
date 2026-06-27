"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { DoubleSide, type PerspectiveCamera } from "three";
import { TRAVEL_COUNTRIES } from "@/data/travel";
import { buildBorderPositions, buildCountryFill } from "@/components/globe-utils";
import { useTheme } from "@/components/ThemeProvider";
import { GLOBE_COLORS } from "@/lib/theme";

const GLOBE_RADIUS = 1;

function CountryFill({
  atlasName,
  color,
}: {
  atlasName: string;
  color: string;
}) {
  const positions = useMemo(
    () => buildCountryFill(atlasName, GLOBE_RADIUS * 1.004),
    [atlasName]
  );
  return (
    <mesh>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.88}
        side={DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

// Pull the camera back so the radius-1 globe always fits the canvas, including
// narrow/portrait mobile widths. Recomputes on resize.
function FitCamera() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const size = useThree((s) => s.size);
  useEffect(() => {
    const aspect = size.width / Math.max(size.height, 1);
    const halfFov = ((camera.fov * Math.PI) / 180) / 2;
    const margin = 1.2;
    const distForHeight = margin / Math.tan(halfFov);
    const distForWidth = margin / (Math.tan(halfFov) * aspect);
    camera.position.set(0, 0, Math.max(distForHeight, distForWidth));
    camera.updateProjectionMatrix();
  }, [camera, size]);
  return null;
}

function Scene() {
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

      <mesh>
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
          atlasName={c.atlasName}
          color={colors.cat[c.category]}
        />
      ))}

      <OrbitControls
        makeDefault
        enableZoom={false}
        enablePan={false}
        rotateSpeed={0.5}
        autoRotate={!interacting && !reduceMotion}
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

export default function Globe() {
  return (
    <Canvas camera={{ position: [0, 0, 2.6], fov: 45 }} dpr={[1, 2]}>
      <Scene />
    </Canvas>
  );
}
