import type { Metadata } from "next";
import Field from "@/features/apps/components/Field";
import FullBleedStage from "@/components/ui/FullBleedStage";

export const metadata: Metadata = { title: "Field" };

export default function FieldPage() {
  return (
    <FullBleedStage>
      <div className="absolute inset-0">
        <Field />
      </div>
    </FullBleedStage>
  );
}
