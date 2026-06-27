"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { CATEGORY_LABELS, type TravelCountry } from "@/data/travel";
import CountryInfo from "@/components/CountryInfo";
import { useTheme } from "@/components/ThemeProvider";
import { GLOBE_COLORS } from "@/lib/theme";

const Globe = dynamic(() => import("@/components/Globe"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-sm text-muted">
      Loading globe…
    </div>
  ),
});

export default function TravelGlobe() {
  const [hovered, setHovered] = useState<TravelCountry | null>(null);
  const [selected, setSelected] = useState<TravelCountry | null>(null);
  const active = selected ?? hovered;
  const { theme } = useTheme();
  const cat = GLOBE_COLORS[theme].cat;

  return (
    // Globe-first stage: cancel the page padding and fill from below the header
    // down toward the tab bar (mobile) / viewport bottom (desktop).
    <div className="relative -mx-5 -mt-10 -mb-28 h-[calc(100svh-8.5rem)] sm:-mb-12 sm:h-[calc(100svh-4.5rem)]">
      <div className="absolute inset-0">
        <Globe
          activeName={active?.name ?? null}
          onHover={setHovered}
          onSelect={setSelected}
          paused={!!selected}
        />
      </div>

      {/* Category legend */}
      <div className="pointer-events-none absolute left-4 top-4 flex flex-col gap-1.5 rounded-lg border border-border bg-bg/70 px-3 py-2 text-xs backdrop-blur">
        {(["home", "lived", "visited"] as const).map((k) => (
          <div key={k} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: cat[k] }}
            />
            <span className="text-fg">{CATEGORY_LABELS[k]}</span>
          </div>
        ))}
      </div>

      {/* Hint */}
      <p className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-xs text-muted">
        Tap a highlighted country
      </p>

      {selected && (
        <CountryInfo country={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
