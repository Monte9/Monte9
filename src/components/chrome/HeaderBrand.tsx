"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { usePathname } from "next/navigation";
import { routeInfo } from "@/lib/nav";

// Header left side, route-aware:
// - post detail → a "← Back" link to /posts (no page title; keeps reading clean)
// - app detail  → the app's own name as the title (standalone-link friendly)
// - everything else → the wordmark (desktop) / page title (mobile)
export default function HeaderBrand() {
  const pathname = usePathname();
  const info = routeInfo(pathname);

  if (info.kind === "post-detail") {
    return (
      <Link
        href="/posts"
        className="-ml-1 flex items-center gap-0.5 text-lg font-semibold hover:text-accent"
      >
        <ChevronLeft className="h-5 w-5" aria-hidden />
        Back
      </Link>
    );
  }

  if (info.kind === "app-detail") {
    return <div className="truncate text-lg font-semibold">{info.title}</div>;
  }

  return (
    <div className="text-lg font-semibold">
      <Link href="/" className="hidden hover:text-accent sm:inline">
        Monte Thakkar
      </Link>
      <span className="sm:hidden">{info.title}</span>
    </div>
  );
}
