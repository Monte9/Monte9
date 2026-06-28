import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Lab" };

const EXPERIMENTS = [
  {
    href: "/lab/built-by-agents",
    title: "Built by Agents",
    blurb:
      "How this site assembles itself — planner → build → evaluator — visualized from the real sprint history.",
  },
  {
    href: "/lab/journey",
    title: "The Journey",
    blurb:
      "Scroll a globe through my path: Bangalore → San Francisco → Austin → Los Angeles.",
  },
  {
    href: "/lab/field",
    title: "Field",
    blurb: "An interactive GPU shader that reacts to your cursor.",
  },
];

export default function LabPage() {
  return (
    <div>
      <h1 className="mb-2 hidden text-2xl font-semibold sm:block">Lab</h1>
      <p className="mb-8 text-muted">
        Experiments — pushing web dev, built agentically. Rough edges expected.
      </p>
      <ul className="space-y-4">
        {EXPERIMENTS.map((e) => (
          <li key={e.href}>
            <Link
              href={e.href}
              className="block rounded-xl border border-border p-4 transition-colors hover:bg-surface-2"
            >
              <span className="text-lg font-semibold text-fg">{e.title}</span>
              <span className="mt-1 block text-sm text-muted">{e.blurb}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
