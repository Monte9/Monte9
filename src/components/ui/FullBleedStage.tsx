import type { ReactNode } from "react";

// Full-bleed stage for the immersive canvas / WebGL demos and the travel globe:
// cancels the page padding and fills from below the header toward the tab bar
// (mobile) / viewport bottom (desktop). Children position themselves inside
// (typically an `absolute inset-0` layer, plus any overlays on top).
export default function FullBleedStage({ children }: { children: ReactNode }) {
  return (
    <div className="relative -mx-5 -mt-10 -mb-28 h-[calc(100svh-8.5rem)] sm:-mb-12 sm:h-[calc(100svh-4.5rem)]">
      {children}
    </div>
  );
}
