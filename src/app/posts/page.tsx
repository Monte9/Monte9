import type { Metadata } from "next";
import { getAllPosts } from "@/lib/posts";
import PostsList from "@/components/PostsList";

export const metadata: Metadata = { title: "Posts" };

export default function PostsPage() {
  const posts = getAllPosts();

  return (
    <div>
      <h1 className="mb-2 hidden text-2xl font-semibold sm:block">Posts</h1>
      <p className="mb-8 text-muted">
        Essays and research notes. Some are written by me; others (badged{" "}
        <span className="text-fg">AI-generated</span>) are researched and drafted
        by an autonomous agent on topics I care about.
      </p>
      {posts.length === 0 ? (
        <p className="text-muted">No posts yet.</p>
      ) : (
        <PostsList posts={posts} />
      )}
    </div>
  );
}
