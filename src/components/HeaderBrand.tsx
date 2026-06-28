"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TITLES: Record<string, string> = {
  "/": "Monte Thakkar",
  "/posts": "Posts",
  "/travel": "Travel",
  "/about": "About",
  "/apps": "Apps",
  "/settings": "Settings",
};

function titleFor(pathname: string): string {
  // Static export uses trailing-slash paths (e.g. "/settings/").
  const p =
    pathname !== "/" && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;
  if (TITLES[p]) return TITLES[p];
  if (p.startsWith("/posts")) return "Posts";
  if (p.startsWith("/apps")) return "Apps";
  return "Monte Thakkar";
}

// Desktop: the "Monte Thakkar" wordmark (links home). Mobile: the current
// page's title, like a native app's top bar.
export default function HeaderBrand() {
  const pathname = usePathname();
  return (
    <div className="text-lg font-semibold">
      <Link href="/" className="hidden hover:text-accent sm:inline">
        Monte Thakkar
      </Link>
      <span className="sm:hidden">{titleFor(pathname)}</span>
    </div>
  );
}
