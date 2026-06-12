import Link from "next/link";
import type { Metadata } from "next";
import { getAllPosts, formatDate } from "@/lib/posts";

export const metadata: Metadata = { title: "Posts" };

export default function PostsPage() {
  const posts = getAllPosts();

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Posts</h1>
      {posts.length === 0 ? (
        <p className="text-gray-500">No posts yet.</p>
      ) : (
        <ul className="space-y-6">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/posts/${post.slug}`}
                className="text-lg font-medium hover:text-blue-600"
              >
                {post.title}
              </Link>
              <div className="text-sm text-gray-500">{formatDate(post.date)}</div>
              {post.description && (
                <p className="mt-1 text-gray-700">{post.description}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
