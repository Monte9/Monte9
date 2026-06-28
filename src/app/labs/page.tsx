import type { Metadata } from "next";
import LabsList from "@/components/labs/LabsList";

export const metadata: Metadata = { title: "Labs" };

export default function LabsPage() {
  return (
    <div>
      <h1 className="mb-2 hidden text-2xl font-semibold sm:block">Labs</h1>
      <p className="mb-8 text-muted">
        A growing gallery of web-dev experiments — each one designed, built, and
        evaluated agentically. Rough edges expected; that&apos;s the point.
      </p>
      <LabsList />
    </div>
  );
}
