"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { type VisitedCountry } from "@/data/travel";

const Globe = dynamic(() => import("@/components/Globe"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-sm text-muted">
      Loading globe…
    </div>
  ),
});

export default function TravelGlobe() {
  const [hovered, setHovered] = useState<VisitedCountry | null>(null);
  const [selected, setSelected] = useState<VisitedCountry | null>(null);
  const active = hovered ?? selected;

  return (
    <div>
      <div className="h-[420px] w-full sm:h-[480px]">
        <Globe
          activeName={active?.name ?? null}
          onHover={setHovered}
          onSelect={setSelected}
        />
      </div>
      <p
        aria-live="polite"
        data-testid="active-country"
        className="mt-3 text-center text-sm text-fg"
      >
        {active ? (
          <>
            <span className="mr-1">{active.flag}</span>
            <span className="font-medium">{active.name}</span>
            <span className="text-muted"> — {active.visited}</span>
          </>
        ) : (
          <span className="text-muted">Hover or tap a pin to see a country.</span>
        )}
      </p>
    </div>
  );
}
