"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { type TravelCountry } from "@/data/travel";
import CountryInfo from "@/components/CountryInfo";

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

  return (
    <div>
      <div className="h-[420px] w-full sm:h-[480px]">
        <Globe
          activeName={active?.name ?? null}
          onHover={setHovered}
          onSelect={setSelected}
          paused={!!selected}
        />
      </div>
      <p className="mt-3 text-center text-sm text-muted">
        Tap a highlighted country.
      </p>
      {selected && (
        <CountryInfo country={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
