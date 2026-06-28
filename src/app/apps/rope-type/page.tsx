import type { Metadata } from "next";
import RopeType from "@/components/apps/RopeType";

export const metadata: Metadata = { title: "Rope Type" };

export default function RopeTypePage() {
  return (
    // Full-bleed stage: cancel page padding and fill from below the header
    // toward the tab bar (mobile) / viewport bottom (desktop).
    <div className="relative -mx-5 -mt-10 -mb-28 h-[calc(100svh-8.5rem)] sm:-mb-12 sm:h-[calc(100svh-4.5rem)]">
      <div className="absolute inset-0">
        <RopeType />
      </div>
    </div>
  );
}
