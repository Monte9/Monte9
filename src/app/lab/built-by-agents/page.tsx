import type { Metadata } from "next";
import BuildTimeline from "@/components/lab/BuildTimeline";

export const metadata: Metadata = { title: "Built by Agents" };

export default function BuiltByAgentsPage() {
  return <BuildTimeline />;
}
