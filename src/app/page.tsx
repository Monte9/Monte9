import Link from "next/link";
import { getAllPosts, formatDate } from "@/lib/posts";

export default function Home() {
  const posts = getAllPosts().slice(0, 5);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Hi, I&apos;m Monte 👋</h1>
      <p className="mt-4 text-gray-700 leading-relaxed">
        Full-stack software engineer in Los Angeles with a strong product
        sense. I&apos;m a founding engineer at{" "}
        <a
          href="https://www.rosebud.app/"
          className="text-blue-600 underline underline-offset-2"
        >
          Rosebud
        </a>
        , the AI journaling startup, maintain{" "}
        <a
          href="https://github.com/react-native-elements/react-native-elements"
          className="text-blue-600 underline underline-offset-2"
        >
          react-native-elements
        </a>
        , and spend my nights and weekends building full apps end-to-end with
        AI agents — including this site.
      </p>
      <h2 className="mt-12 mb-4 text-lg font-semibold">Around the site</h2>
      <ul className="space-y-3">
        <li>
          <Link href="/about" className="font-medium hover:text-blue-600">
            About
          </Link>
          <span className="text-gray-600">
            {" "}
            — my background, career, and how I like to work.
          </span>
        </li>
        <li>
          <Link href="/posts" className="font-medium hover:text-blue-600">
            Posts
          </Link>
          <span className="text-gray-600">
            {" "}
            — essays on engineering, AI, and whatever I&apos;m chewing on.
          </span>
        </li>
        <li>
          <Link href="/travel" className="font-medium hover:text-blue-600">
            Travel
          </Link>
          <span className="text-gray-600">
            {" "}
            — an interactive 3D globe of the places I&apos;ve been.
          </span>
        </li>
        <li>
          <a href="/resume.pdf" className="font-medium hover:text-blue-600">
            Résumé
          </a>
          <span className="text-gray-600"> — the one-page version, as a PDF.</span>
        </li>
        <li>
          <a
            href="https://github.com/Monte9"
            className="font-medium hover:text-blue-600"
          >
            GitHub
          </a>
          <span className="text-gray-600">
            {" "}
            — what I&apos;m building in the open.
          </span>
        </li>
      </ul>

      <h2 className="mt-12 mb-4 text-lg font-semibold">Recent posts</h2>
      {posts.length === 0 ? (
        <p className="text-gray-500">No posts yet.</p>
      ) : (
        <ul className="space-y-4">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/posts/${post.slug}`}
                className="font-medium hover:text-blue-600"
              >
                {post.title}
              </Link>
              <div className="text-sm text-gray-500">{formatDate(post.date)}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
