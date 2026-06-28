import type { Metadata } from "next";
import WeatherPixels from "@/components/apps/WeatherPixels";

export const metadata: Metadata = {
  title: "Weather Pixels",
  description:
    "A living 3D pixel sky — thousands of GPU-instanced voxel cubes on a slow-undulating dome, color-graded through a dawn-to-storm cycle with drifting cloud bands and lightning. Drag to orbit; tap to summon a rain squall.",
};

export default function WeatherPixelsPage() {
  return (
    // Full-bleed stage: cancel page padding and fill from below the header
    // toward the tab bar (mobile) / viewport bottom (desktop).
    <div className="relative -mx-5 -mt-10 -mb-28 h-[calc(100svh-8.5rem)] sm:-mb-12 sm:h-[calc(100svh-4.5rem)]">
      <div className="absolute inset-0">
        <WeatherPixels />
      </div>
    </div>
  );
}
