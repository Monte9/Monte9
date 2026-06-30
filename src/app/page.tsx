import LearnFeed from "@/features/learn/components/LearnFeed";

// No static `metadata.title` here on purpose: the Learn feed owns the tab title
// client-side (streak / "new set ready" — the variable-reward trigger), and a
// route-level title would clobber it after hydration. The layout default title
// covers SSR/SEO.
export default function LearnPage() {
  return <LearnFeed />;
}
