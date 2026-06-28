import type { Metadata } from "next";
import JourneyGlobe from "@/components/apps/JourneyGlobe";

export const metadata: Metadata = { title: "The Journey" };

export default function JourneyPage() {
  return <JourneyGlobe />;
}
