import type { Metadata } from "next";
import RopeType from "@/features/apps/components/RopeType";
import FullBleedStage from "@/components/ui/FullBleedStage";

export const metadata: Metadata = { title: "Rope Type" };

export default function RopeTypePage() {
  return (
    <FullBleedStage>
      <div className="absolute inset-0">
        <RopeType />
      </div>
    </FullBleedStage>
  );
}
