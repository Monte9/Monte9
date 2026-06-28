import Link from "next/link";
import { getAllPosts, formatDate } from "@/lib/posts";
import { VISITED_NEWEST_FIRST } from "@/data/travel";
import { LAB_EXPERIMENTS, formatLabDate } from "@/data/labs";
import LabThumb from "@/components/labs/LabThumb";

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="mt-12 mb-4 flex items-baseline justify-between">
      <h2 className="text-lg font-semibold">{title}</h2>
      <Link href={href} className="text-sm text-muted hover:text-accent">
        All →
      </Link>
    </div>
  );
}

export default function Home() {
  const posts = getAllPosts().slice(0, 3);
  const travel = VISITED_NEWEST_FIRST.slice(0, 3);
  const labs = [...LAB_EXPERIMENTS]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);

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

      {/* Recent posts */}
      <SectionHeader title="Recent posts" href="/posts" />
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

      {/* Recent travel */}
      <SectionHeader title="Recent travel" href="/travel" />
      <ul className="space-y-3">
        {travel.map((c) => (
          <li key={c.name} className="flex items-center gap-3">
            <span className="text-xl leading-none">{c.flag}</span>
            <span className="font-medium text-fg">{c.name}</span>
            <span className="ml-auto text-sm text-muted">{c.detail}</span>
          </li>
        ))}
      </ul>

      {/* Recent labs */}
      <SectionHeader title="Recent labs" href="/labs" />
      <ul className="space-y-3">
        {labs.map((e) => (
          <li key={e.slug}>
            <Link
              href={`/labs/${e.slug}`}
              className="group flex items-center gap-3"
            >
              <LabThumb slug={e.slug} className="h-11 w-11" />
              <span className="min-w-0">
                <span className="block truncate font-medium text-fg group-hover:text-accent">
                  {e.title}
                </span>
                <span className="block text-sm text-muted">
                  {formatLabDate(e.date)}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
