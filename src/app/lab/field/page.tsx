import type { Metadata } from "next";
import Field from "@/components/lab/Field";

export const metadata: Metadata = { title: "Field" };

export default function FieldPage() {
  return (
    // Full-bleed stage: cancel page padding and fill from below the header
    // toward the tab bar (mobile) / viewport bottom (desktop), matching travel.
    <div className="relative -mx-5 -mt-10 -mb-28 h-[calc(100svh-8.5rem)] sm:-mb-12 sm:h-[calc(100svh-4.5rem)]">
      <div className="absolute inset-0">
        <Field />
      </div>
    </div>
  );
}
