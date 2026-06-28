import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllPosts, getPost, formatDate } from "@/lib/posts";
import AiBadge from "@/components/AiBadge";

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  return { title: post?.title ?? "Post", description: post?.description };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <article>
      <h1 className="text-2xl font-semibold">{post.title}</h1>
      <div className="mt-1 flex items-center gap-2 text-sm text-muted">
        <span>{formatDate(post.date)}</span>
        {post.aiGenerated && <AiBadge />}
      </div>
      {post.aiGenerated && (
        <p className="mt-4 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-muted">
          Researched and written by an autonomous AI agent on a topic I care
          about, then auto-published. Treat figures and claims as a starting
          point, not gospel.
        </p>
      )}
      <div
        className="article mt-8"
        dangerouslySetInnerHTML={{ __html: post.html }}
      />
    </article>
  );
}
