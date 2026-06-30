import type { CSSProperties } from "react";

// One-shot accent particle burst (the reward beat on a correct answer).
export default function Burst() {
  const dots = Array.from({ length: 14 }, (_, i) => {
    const a = (Math.PI * 2 * i) / 14;
    const r = 34 + (i % 3) * 12;
    return { dx: Math.cos(a) * r, dy: Math.sin(a) * r };
  });
  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
      aria-hidden
    >
      {dots.map((d, i) => (
        <span
          key={i}
          className="learn-burst-dot absolute h-1.5 w-1.5 rounded-full bg-accent"
          style={{ "--dx": `${d.dx}px`, "--dy": `${d.dy}px` } as CSSProperties}
        />
      ))}
    </div>
  );
}
