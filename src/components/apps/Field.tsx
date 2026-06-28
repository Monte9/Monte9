"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Color, ShaderMaterial, Vector2, type IUniform } from "three";
import { useTheme } from "@/components/ThemeProvider";
import { GLOBE_COLORS, THEME_SWATCHES, type Theme } from "@/lib/theme";

/**
 * Field — an interactive fragment-shader flow field.
 *
 * A single full-screen quad runs a domain-warped fbm noise field whose
 * isolines flow over time and bend toward the pointer. Colors are mixed from
 * the active theme's accent + globe palette so it tracks light/dark/sunset.
 */

// Per-theme color stops, derived from the shared palette so the shader matches
// the rest of the site. `a` = background floor, `b`..`d` = accent + globe cats.
function themePalette(theme: Theme): {
  a: Color;
  b: Color;
  c: Color;
  d: Color;
} {
  const swatch = THEME_SWATCHES[theme];
  const globe = GLOBE_COLORS[theme];
  return {
    a: new Color(swatch.bg),
    b: new Color(swatch.accent),
    c: new Color(globe.cat.lived),
    d: new Color(globe.cat.visited),
  };
}

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    // Fullscreen pass: position already in clip space (PlaneGeometry 2x2).
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform float uTime;
  uniform vec2  uResolution;
  uniform vec2  uPointer;   // 0..1, y up
  uniform float uPointerActive;
  uniform vec3  uColorA;    // background floor
  uniform vec3  uColorB;    // accent
  uniform vec3  uColorC;
  uniform vec3  uColorD;
  uniform float uIsDark;

  // --- value noise + fbm ---------------------------------------------------
  vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(dot(hash2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
          dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
      mix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
          dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
      u.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float amp = 0.55;
    mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
    for (int i = 0; i < 5; i++) {
      v += amp * noise(p);
      p = rot * p * 2.0;
      amp *= 0.5;
    }
    return v;
  }

  void main() {
    // Aspect-correct coordinates centered at 0.
    vec2 uv = vUv;
    vec2 p = (uv - 0.5);
    p.x *= uResolution.x / max(uResolution.y, 1.0);

    float t = uTime * 0.08;

    // Pointer pull: warp the sample space toward the cursor so the field
    // "leans" into the pointer. Falls off smoothly with distance.
    vec2 ptr = uPointer - 0.5;
    ptr.x *= uResolution.x / max(uResolution.y, 1.0);
    vec2 toPtr = ptr - p;
    float pd = length(toPtr);
    float pull = uPointerActive * exp(-pd * 2.2) * 0.35;
    vec2 warp = normalize(toPtr + 1e-4) * pull;

    // Domain warping: two layers of fbm feeding the next for organic flow.
    vec2 q = vec2(
      fbm(p * 1.6 + vec2(0.0, t)),
      fbm(p * 1.6 + vec2(5.2, 1.3) - t)
    );
    vec2 r = vec2(
      fbm(p * 1.6 + 2.4 * q + vec2(1.7 - t, 9.2)),
      fbm(p * 1.6 + 2.4 * q + vec2(8.3, 2.8 + t))
    );

    float f = fbm(p * 1.6 + 3.0 * r + warp * 4.0);
    f = f * 0.5 + 0.5;

    // Color ramp across accent stops.
    vec3 col = mix(uColorA, uColorB, smoothstep(0.15, 0.55, f));
    col = mix(col, uColorC, smoothstep(0.45, 0.8, length(q)));
    col = mix(col, uColorD, smoothstep(0.55, 0.95, length(r)));

    // Flowing isolines for definition (subtle in light, brighter in dark).
    float lines = abs(sin((f + length(r) * 0.5) * 18.0 - uTime * 0.3));
    lines = smoothstep(0.0, 0.06, lines);
    float lineMix = mix(0.10, 0.22, uIsDark);
    col = mix(col, mix(col, uColorB, 0.6), (1.0 - lines) * lineMix);

    // Pointer halo — a soft accent bloom under the cursor.
    float halo = uPointerActive * exp(-pd * 3.5) * 0.5;
    col += uColorB * halo;

    // Gentle vignette to seat the composition.
    float vig = smoothstep(1.25, 0.25, length(uv - 0.5));
    col *= mix(0.82, 1.0, vig);

    // r3f enables color management, so Color uniforms arrive in linear space and
    // raw ShaderMaterial output is not auto-encoded — encode to sRGB so the
    // palette matches the rest of the (sRGB) UI.
    col = pow(max(col, 0.0), vec3(1.0 / 2.2));

    gl_FragColor = vec4(col, 1.0);
  }
`;

type FieldUniforms = {
  uTime: IUniform<number>;
  uResolution: IUniform<Vector2>;
  uPointer: IUniform<Vector2>;
  uPointerActive: IUniform<number>;
  uColorA: IUniform<Color>;
  uColorB: IUniform<Color>;
  uColorC: IUniform<Color>;
  uColorD: IUniform<Color>;
  uIsDark: IUniform<number>;
};

function FieldPlane({
  theme,
  reduceMotion,
  activeTarget,
}: {
  theme: Theme;
  reduceMotion: boolean;
  // Set by DOM pointer handlers on the wrapper (1 = pointer present, 0 = gone).
  activeTarget: { current: number };
}) {
  const size = useThree((s) => s.size);

  // Smoothed pointer + activity, so motion eases instead of snapping.
  const pointer = useRef(new Vector2(0.5, 0.5));
  const pointerTarget = useRef(new Vector2(0.5, 0.5));
  const active = useRef(0);

  const material = useMemo(() => {
    const pal = themePalette(theme);
    const uniforms: FieldUniforms = {
      uTime: { value: 0 },
      uResolution: { value: new Vector2(1, 1) },
      uPointer: { value: new Vector2(0.5, 0.5) },
      uPointerActive: { value: 0 },
      uColorA: { value: pal.a },
      uColorB: { value: pal.b },
      uColorC: { value: pal.c },
      uColorD: { value: pal.d },
      uIsDark: { value: theme === "dark" ? 1 : 0 },
    };
    return new ShaderMaterial({
      uniforms,
      vertexShader: VERT,
      fragmentShader: FRAG,
      depthTest: false,
      depthWrite: false,
    });
    // Rebuild only when the theme changes; pointer/time are mutated in-frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  // Keep colors live if the palette object identity changes within a theme.
  useEffect(() => {
    const pal = themePalette(theme);
    const u = material.uniforms as FieldUniforms;
    u.uColorA.value.copy(pal.a);
    u.uColorB.value.copy(pal.b);
    u.uColorC.value.copy(pal.c);
    u.uColorD.value.copy(pal.d);
    u.uIsDark.value = theme === "dark" ? 1 : 0;
  }, [theme, material]);

  // Resolution uniform tracks the canvas size.
  useEffect(() => {
    const u = material.uniforms as FieldUniforms;
    u.uResolution.value.set(size.width, size.height);
  }, [size, material]);

  // Dispose GLSL resources on unmount.
  useEffect(() => {
    return () => material.dispose();
  }, [material]);

  useFrame((state, delta) => {
    const u = material.uniforms as FieldUniforms;

    // Pointer in 0..1, y up. `state.pointer` is NDC (-1..1, y up).
    pointerTarget.current.set(
      state.pointer.x * 0.5 + 0.5,
      state.pointer.y * 0.5 + 0.5
    );

    // Ease toward targets (frame-rate independent-ish).
    const ease = reduceMotion ? 1 : Math.min(1, delta * 6);
    pointer.current.lerp(pointerTarget.current, ease);
    active.current += (activeTarget.current - active.current) * ease;

    u.uPointer.value.copy(pointer.current);
    u.uPointerActive.value = active.current;

    // Freeze time under reduceMotion; otherwise advance smoothly.
    if (!reduceMotion) u.uTime.value += delta;
  });

  return (
    <mesh material={material} frustumCulled={false}>
      {/* 2x2 plane already covers clip space; the vert shader bypasses MVP. */}
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}

export default function Field() {
  const { theme, reduceMotion } = useTheme();

  // Client-only mount guard: keeps the WebGL <Canvas> (and any `window` access
  // inside three / r3f) out of the server render, so static export stays clean
  // — the same effect as a `dynamic(..., { ssr: false })` import, but in-file.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Pointer presence drives the halo/warp strength. Tracked via DOM events on
  // the wrapper (covers the whole canvas regardless of r3f raycasting) and read
  // each frame inside FieldPlane. `state.pointer` supplies the position.
  const activeTarget = useRef(0);

  return (
    <div
      className="relative h-full w-full"
      onPointerMove={() => {
        activeTarget.current = 1;
      }}
      onPointerLeave={() => {
        activeTarget.current = 0;
      }}
    >
      {mounted ? (
        <Canvas
          // Orthographic-ish fullscreen pass; camera is unused by the shader
          // but r3f requires one. dpr capped at 2 to keep fill-rate sane.
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: false }}
          camera={{ position: [0, 0, 1] }}
          frameloop={reduceMotion ? "demand" : "always"}
        >
          <FieldPlane
            theme={theme}
            reduceMotion={reduceMotion}
            activeTarget={activeTarget}
          />
        </Canvas>
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm text-muted">
          Loading field…
        </div>
      )}

      {/* Caption overlay — semantic tokens so it tracks the theme. */}
      <div className="pointer-events-none absolute left-4 top-4 max-w-[80%] rounded-lg border border-border bg-bg/60 px-3 py-2 backdrop-blur">
        <p className="text-sm font-medium text-fg">Field</p>
        <p className="text-xs text-muted">an interactive shader</p>
      </div>

      <p className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-xs text-muted">
        {reduceMotion ? "Reduced motion — field is at rest" : "Move your pointer across the field"}
      </p>
    </div>
  );
}
