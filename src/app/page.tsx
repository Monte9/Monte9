import Link from "next/link";
import { getAllPosts, formatDate } from "@/lib/posts";
import { APP_EXPERIMENTS, formatAppDate } from "@/data/apps";
import AppThumb from "@/components/apps/AppThumb";

function SectionHeader({
  title,
  href,
  count,
}: {
  title: string;
  href: string;
  count: number;
}) {
  return (
    <div className="mt-12 mb-4 flex items-baseline justify-between">
      <h2 className="text-lg font-semibold">{title}</h2>
      <Link href={href} className="text-sm text-muted hover:text-accent">
        All ({count}) →
      </Link>
    </div>
  );
}

export default function Home() {
  const allPosts = getAllPosts();
  const posts = allPosts.slice(0, 3);
  const allApps = [...APP_EXPERIMENTS].sort((a, b) =>
    b.date.localeCompare(a.date)
  );
  const apps = allApps.slice(0, 3);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Hi, I&apos;m Monte 👋</h1>
      <p className="mt-4 text-fg leading-relaxed">
        Full-stack software engineer in Los Angeles with a strong product
        sense. I&apos;m a founding engineer at{" "}
        <a
          href="https://www.rosebud.app/"
          className="text-accent underline underline-offset-2"
        >
          Rosebud
        </a>
        , the AI journaling startup, maintain{" "}
        <a
          href="https://github.com/react-native-elements/react-native-elements"
          className="text-accent underline underline-offset-2"
        >
          react-native-elements
        </a>
        , and spend my nights and weekends building full apps end-to-end with AI
        agents — including this site.
      </p>

      {/* Posts */}
      <SectionHeader title="Posts" href="/posts" count={allPosts.length} />
      {posts.length === 0 ? (
        <p className="text-muted">No posts yet.</p>
      ) : (
        <ul className="space-y-4">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/posts/${post.slug}`}
                className="font-medium hover:text-accent"
              >
                {post.title}
              </Link>
              <div className="text-sm text-muted">{formatDate(post.date)}</div>
            </li>
          ))}
        </ul>
      )}

      {/* Apps */}
      <SectionHeader title="Apps" href="/apps" count={allApps.length} />
      <ul className="space-y-3">
        {apps.map((e) => (
          <li key={e.slug}>
            <Link
              href={`/apps/${e.slug}`}
              className="group flex items-center gap-3"
            >
              <AppThumb slug={e.slug} motif={e.motif} className="h-11 w-11" />
              <span className="min-w-0">
                <span className="block truncate font-medium text-fg group-hover:text-accent">
                  {e.title}
                </span>
                <span className="block text-sm text-muted">
                  {formatAppDate(e.date)}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
