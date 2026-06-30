import type { Metadata } from "next";
import { getAllPosts } from "@/features/posts/server/posts";
import PostsList from "@/features/posts/components/PostsList";

export const metadata: Metadata = { title: "Posts" };

export default function PostsPage() {
  const posts = getAllPosts();

  return (
    <div>
      <h1 className="mb-2 hidden text-2xl font-semibold sm:block">Posts</h1>
      <p className="mb-8 text-muted">
        Essays and research notes — some written by me, others researched and
        drafted by an autonomous AI agent on topics I care about.
      </p>
      {posts.length === 0 ? (
        <p className="text-muted">No posts yet.</p>
      ) : (
        <PostsList posts={posts} />
      )}
    </div>
  );
}
