// Client-safe route info for the header. Detail pages (/posts/<slug>,
// /apps/<slug>) get special treatment: a Back control / the app's own title, and
// no hamburger — so an app link reads as a clean standalone page when shared.
import {
  GraduationCap,
  Newspaper,
  Globe,
  LayoutGrid,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { APP_EXPERIMENTS } from "@/features/apps/data/apps";

// The primary navigation routes, shared by the desktop nav and the mobile tab
// bar so the two never drift. The icon is used by the tab bar; the desktop nav
// ignores it.
export const PRIMARY_NAV: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: "/", label: "Learn", Icon: GraduationCap },
  { href: "/posts", label: "Posts", Icon: Newspaper },
  { href: "/apps", label: "Apps", Icon: LayoutGrid },
  { href: "/travel", label: "Travel", Icon: Globe },
  { href: "/about", label: "About", Icon: UserRound },
];

export type PageKind = "home" | "list" | "post-detail" | "app-detail";

const LIST_TITLES: Record<string, string> = {
  "/posts": "Posts",
  "/apps": "Apps",
  "/travel": "Travel",
  "/about": "About",
  "/settings": "Settings",
};

export function routeInfo(pathname: string): { kind: PageKind; title: string } {
  // Routes use trailing-slash paths (next.config `trailingSlash: true`),
  // e.g. "/apps/field/" — normalize before matching.
  const p =
    pathname !== "/" && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;
  if (p === "/") return { kind: "home", title: "Learn" };
  if (p.startsWith("/apps/")) {
    const slug = p.slice("/apps/".length);
    const app = APP_EXPERIMENTS.find((e) => e.slug === slug);
    return { kind: "app-detail", title: app?.title ?? "Apps" };
  }
  if (p.startsWith("/posts/")) return { kind: "post-detail", title: "Posts" };
  return { kind: "list", title: LIST_TITLES[p] ?? "Monte Thakkar" };
}

export function isDetailRoute(pathname: string): boolean {
  const k = routeInfo(pathname).kind;
  return k === "post-detail" || k === "app-detail";
}
