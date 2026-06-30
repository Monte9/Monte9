import type { Metadata } from "next";
import ShatterType from "@/features/apps/components/ShatterType";
import FullBleedStage from "@/components/ui/FullBleedStage";

export const metadata: Metadata = { title: "Shatter Type" };

export default function ShatterTypePage() {
  return (
    <FullBleedStage>
      <div className="absolute inset-0">
        <ShatterType />
      </div>
    </FullBleedStage>
  );
}
