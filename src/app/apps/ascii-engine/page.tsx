import type { Metadata } from "next";
import AsciiEngine from "@/features/apps/components/AsciiEngine";
import FullBleedStage from "@/components/ui/FullBleedStage";

export const metadata: Metadata = { title: "ASCII Engine" };

export default function AsciiEnginePage() {
  return (
    <FullBleedStage>
      <div className="absolute inset-0">
        <AsciiEngine />
      </div>
    </FullBleedStage>
  );
}
