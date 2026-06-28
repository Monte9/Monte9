import type { Metadata } from "next";
import AsciiEngine from "@/components/labs/AsciiEngine";

export const metadata: Metadata = { title: "ASCII Engine" };

export default function AsciiEnginePage() {
  return (
    // Full-bleed stage: cancel page padding and fill from below the header
    // toward the tab bar (mobile) / viewport bottom (desktop).
    <div className="relative -mx-5 -mt-10 -mb-28 h-[calc(100svh-8.5rem)] sm:-mb-12 sm:h-[calc(100svh-4.5rem)]">
      <div className="absolute inset-0">
        <AsciiEngine />
      </div>
    </div>
  );
}
