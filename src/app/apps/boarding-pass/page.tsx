import type { Metadata } from "next";
import BoardingPass from "@/features/apps/components/BoardingPass";

export const metadata: Metadata = { title: "Boarding Pass" };

export default function BoardingPassPage() {
  return <BoardingPass />;
}
