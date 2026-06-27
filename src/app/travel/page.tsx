import type { Metadata } from "next";
import TravelGlobe from "@/components/TravelGlobe";

export const metadata: Metadata = { title: "Travel" };

export default function TravelPage() {
  return <TravelGlobe />;
}
