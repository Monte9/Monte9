import type { Metadata } from "next";
import BoardingPass from "@/components/apps/BoardingPass";

export const metadata: Metadata = { title: "Boarding Pass" };

export default function BoardingPassPage() {
  return <BoardingPass />;
}
