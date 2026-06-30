import type { Metadata } from "next";
import TravelGlobe from "@/features/travel/components/TravelGlobe";

export const metadata: Metadata = { title: "Travel" };

export default function TravelPage() {
  return <TravelGlobe />;
}
