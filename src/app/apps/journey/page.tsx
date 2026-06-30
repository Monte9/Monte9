import type { Metadata } from "next";
import JourneyGlobe from "@/features/apps/components/JourneyGlobe";

export const metadata: Metadata = { title: "The Journey" };

export default function JourneyPage() {
  return <JourneyGlobe />;
}
