"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Newspaper, Globe, UserRound, Settings } from "lucide-react";

const TABS = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/posts", label: "Posts", Icon: Newspaper },
  { href: "/travel", label: "Travel", Icon: Globe },
  { href: "/about", label: "About", Icon: UserRound },
  { href: "/settings", label: "Settings", Icon: Settings },
];

export default function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-bg/90 backdrop-blur sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      <ul className="mx-auto flex max-w-2xl">
        {TABS.map(({ href, label, Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 py-2 text-[11px] ${
                  active ? "text-accent" : "text-muted"
                }`}
              >
                <Icon className="h-[22px] w-[22px]" strokeWidth={1.8} aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
