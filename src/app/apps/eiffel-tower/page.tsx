import type { Metadata } from "next";
import EiffelTower from "@/features/apps/components/EiffelTower";
import FullBleedStage from "@/components/ui/FullBleedStage";

export const metadata: Metadata = {
  title: "Eiffel Tower",
  description:
    "A 3D Eiffel Tower you can orbit, zoom, and pan — its wrought-iron lattice, three platforms, and grand arches modeled procedurally from the monument's real proportions.",
};

export default function EiffelTowerPage() {
  return (
    <FullBleedStage>
      <div className="absolute inset-0">
        <EiffelTower />
      </div>
    </FullBleedStage>
  );
}
