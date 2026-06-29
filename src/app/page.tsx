import type { Metadata } from "next";
import LearnFeed from "@/components/learn/LearnFeed";

export const metadata: Metadata = { title: "Learn" };

export default function LearnPage() {
  return (
    <div>
      <h1 className="mb-6 hidden text-2xl font-semibold sm:block">Learn</h1>
      <LearnFeed />
    </div>
  );
}
