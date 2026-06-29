"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/format";
import type { PostMeta } from "@/lib/posts";

type Sort = "recent" | "oldest";

export default function PostsList({ posts }: { posts: PostMeta[] }) {
  const [sort, setSort] = useState<Sort>("recent");

  const items = useMemo(
    () =>
      [...posts].sort((a, b) =>
        sort === "recent"
          ? b.date.localeCompare(a.date)
          : a.date.localeCompare(b.date)
      ),
    [posts, sort]
  );

  return (
    <div>
      <div className="mb-6">
        <div
          className="inline-flex rounded-lg border border-border p-0.5 text-xs"
          role="group"
          aria-label="Sort posts"
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

      <ul className="space-y-4">
        {items.map((post) => (
          <li key={post.slug}>
            <Link
              href={`/posts/${post.slug}`}
              className="group block rounded-xl border border-border p-4 transition-colors hover:bg-surface-2"
            >
              {/* Full-width title; date stacked beneath so the title never wraps narrow. */}
              <span className="block text-lg font-semibold text-fg">
                {post.title}
              </span>
              <span className="mt-0.5 block text-xs text-muted">
                {formatDate(post.date)}
              </span>
              {post.description && (
                <span className="mt-1.5 block text-sm text-muted">
                  {post.description}
                </span>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {post.tags.map((t) => (
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
