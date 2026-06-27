"use client";

import { useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { VISITED_COUNTRIES, type VisitedCountry } from "@/data/travel";
import { buildBorderPositions, latLngToVec3 } from "@/components/globe-utils";

const GLOBE_RADIUS = 1;

type Handlers = {
  activeName: string | null;
  onHover: (c: VisitedCountry | null) => void;
  onSelect: (c: VisitedCountry | null) => void;
};

function Pin({
  country,
  active,
  onHover,
  onSelect,
}: {
  country: VisitedCountry;
  active: boolean;
} & Pick<Handlers, "onHover" | "onSelect">) {
  const pos = useMemo(
    () => latLngToVec3(country.lat, country.lng, GLOBE_RADIUS * 1.02),
    [country]
  );
  return (
    <mesh
      position={pos}
      scale={active ? 2.6 : 1}
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
      <sphereGeometry args={[0.022, 16, 16]} />
      <meshBasicMaterial color={active ? "#f97316" : "#2563eb"} />
    </mesh>
  );
}

function Scene({ activeName, onHover, onSelect }: Handlers) {
  const borders = useMemo(() => buildBorderPositions(GLOBE_RADIUS * 1.002), []);
  const [interacting, setInteracting] = useState(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[3, 2, 2]} intensity={0.5} />

      {/* The globe occludes pin picking: as the nearest hit on empty-ocean
          rays it stops propagation, so pins on the far hemisphere can't be
          hovered/clicked through the sphere. Clicking the ocean deselects. */}
      <mesh
        onPointerOver={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(null);
        }}
      >
        <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
        <meshStandardMaterial color="#cfe0f5" roughness={1} metalness={0} />
      </mesh>

      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[borders, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#5b6b80" transparent opacity={0.55} />
      </lineSegments>

      {VISITED_COUNTRIES.map((c) => (
        <Pin
          key={c.name}
          country={c}
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
        autoRotate={!interacting}
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
