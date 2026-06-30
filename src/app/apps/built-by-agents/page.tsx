import type { Metadata } from "next";
import BuildTimeline from "@/features/apps/components/BuildTimeline";

export const metadata: Metadata = { title: "Built by Agents" };

export default function BuiltByAgentsPage() {
  return <BuildTimeline />;
}
