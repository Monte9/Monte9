// Client-safe route info for the header. Detail pages (/posts/<slug>,
// /apps/<slug>) get special treatment: a Back control / the app's own title, and
// no hamburger — so an app link reads as a clean standalone page when shared.
import { APP_EXPERIMENTS } from "@/data/apps";

export type PageKind = "home" | "list" | "post-detail" | "app-detail";

const LIST_TITLES: Record<string, string> = {
  "/posts": "Posts",
  "/apps": "Apps",
  "/travel": "Travel",
  "/about": "About",
  "/settings": "Settings",
};

export function routeInfo(pathname: string): { kind: PageKind; title: string } {
  // Static export uses trailing-slash paths (e.g. "/apps/field/").
  const p =
    pathname !== "/" && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;
  if (p === "/") return { kind: "home", title: "Monte Thakkar" };
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
