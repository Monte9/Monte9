"use client";

import dynamic from "next/dynamic";

const Globe = dynamic(() => import("@/components/Globe"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-sm text-muted">
      Loading globe…
    </div>
  ),
});

export default function TravelGlobe() {
  return (
    <div>
      <div className="h-[420px] w-full sm:h-[480px]">
        <Globe />
      </div>
      <p className="mt-3 text-center text-sm text-muted">
        Drag to spin the globe.
      </p>
    </div>
  );
}
