"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LAB_EXPERIMENTS, formatLabDate } from "@/data/labs";

type Sort = "recent" | "oldest";

export default function LabsList() {
  const [sort, setSort] = useState<Sort>("recent");

  const items = useMemo(
    () =>
      [...LAB_EXPERIMENTS].sort((a, b) =>
        sort === "recent"
          ? b.date.localeCompare(a.date)
          : a.date.localeCompare(b.date)
      ),
    [sort]
  );

  return (
    <div>
      {/* Sort toggle */}
      <div className="mb-6">
        <div
          className="inline-flex rounded-lg border border-border p-0.5 text-xs"
          role="group"
          aria-label="Sort experiments"
        >
          {(["recent", "oldest"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSort(s)}
              aria-pressed={sort === s}
              className={`rounded-md px-2.5 py-1 capitalize transition-colors ${
                sort === s ? "bg-surface-2 text-fg" : "text-muted hover:text-fg"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Experiment cards */}
      <ul className="space-y-4">
        {items.map((e) => (
          <li key={e.slug}>
            <Link
              href={`/labs/${e.slug}`}
              className="group block rounded-xl border border-border p-4 transition-colors hover:bg-surface-2"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-lg font-semibold text-fg">{e.title}</span>
                <span className="shrink-0 whitespace-nowrap text-xs text-muted">
                  {formatLabDate(e.date)}
                </span>
              </div>
              <span className="mt-1 block text-sm text-muted">{e.blurb}</span>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {e.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-muted"
                  >
                    {t}
                  </span>
                ))}
                <ArrowRight
                  className="ml-auto h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent"
                  aria-hidden
                />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
