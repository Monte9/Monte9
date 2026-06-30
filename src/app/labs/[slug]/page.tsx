import Redirect from "@/components/ui/Redirect";
import { APP_EXPERIMENTS } from "@/features/apps/data/apps";

// Legacy per-experiment routes: /labs/<slug> → /apps/<slug>. Only the slugs that
// ever existed under /labs are generated; new apps live only under /apps.
export function generateStaticParams() {
  return APP_EXPERIMENTS.map((e) => ({ slug: e.slug }));
}

export const dynamicParams = false;

export default async function LabsSlugRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <Redirect to={`/apps/${slug}/`} />;
}
