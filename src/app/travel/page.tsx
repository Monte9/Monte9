import type { Metadata } from "next";
import TravelGlobe from "@/components/TravelGlobe";
import { VISITED_NEWEST_FIRST } from "@/data/travel";

export const metadata: Metadata = { title: "Travel" };

export default function TravelPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">Travel</h1>
      <p className="mb-6 text-gray-600">
        Places I&apos;ve been, on a globe you can spin. Drag to rotate; hover or
        tap a pin to see where and when.
      </p>

      <TravelGlobe />

      <h2 className="mt-10 mb-3 text-lg font-semibold">Countries</h2>
      <ul className="space-y-1">
        {VISITED_NEWEST_FIRST.map((c) => (
          <li key={c.name} className="text-gray-700">
            <span className="mr-1">{c.flag}</span>
            <span className="font-medium">{c.name}</span>
            <span className="text-gray-500"> — {c.visited}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
