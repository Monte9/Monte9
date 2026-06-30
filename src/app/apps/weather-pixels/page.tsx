import type { Metadata } from "next";
import WeatherPixels from "@/features/apps/components/WeatherPixels";
import FullBleedStage from "@/components/ui/FullBleedStage";

export const metadata: Metadata = {
  title: "Weather Pixels",
  description:
    "A living 3D pixel sky — thousands of GPU-instanced voxel cubes on a slow-undulating dome, color-graded through a dawn-to-storm cycle with drifting cloud bands and lightning. Drag to orbit; tap to summon a rain squall.",
};

export default function WeatherPixelsPage() {
  return (
    <FullBleedStage>
      <div className="absolute inset-0">
        <WeatherPixels />
      </div>
    </FullBleedStage>
  );
}
