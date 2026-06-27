"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/posts", label: "Posts" },
  { href: "/travel", label: "Travel" },
  { href: "/about", label: "About" },
  { href: "/settings", label: "Settings" },
];

export default function DesktopNav() {
  const pathname = usePathname();
  return (
    <nav className="hidden items-center gap-5 text-sm sm:flex">
      {LINKS.map((l) => {
        const active = pathname === l.href || pathname.startsWith(l.href + "/");
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={active ? "text-accent" : "text-muted hover:text-accent"}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
