import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllPosts, getPost, formatDate } from "@/features/posts/server/posts";

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
      <div className="mt-1 mb-8 text-sm text-muted">{formatDate(post.date)}</div>
      <div className="article" dangerouslySetInnerHTML={{ __html: post.html }} />
    </article>
  );
}
