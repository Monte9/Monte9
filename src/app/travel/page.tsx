import type { Metadata } from "next";
import TravelGlobe from "@/components/TravelGlobe";
import { VISITED_NEWEST_FIRST } from "@/data/travel";

export const metadata: Metadata = { title: "Travel" };

export default function TravelPage() {
  return (
    <div>
      <h1 className="mb-2 hidden text-2xl font-semibold sm:block">Travel</h1>
      <p className="mb-6 text-muted">
        Places I&apos;ve been, on a globe you can spin. Drag to rotate; hover or
        tap a pin to see where and when.
      </p>

      <TravelGlobe />

      <h2 className="mt-10 mb-3 text-lg font-semibold">Countries</h2>
      <ul className="space-y-1">
        {VISITED_NEWEST_FIRST.map((c) => (
          <li key={c.name} className="text-fg">
            <span className="mr-1">{c.flag}</span>
            <span className="font-medium">{c.name}</span>
            <span className="text-muted"> — {c.detail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
