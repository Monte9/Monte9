import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";

export { formatDate } from "@/lib/format";

const postsDir = path.join(process.cwd(), "content", "posts");

export type PostMeta = {
  slug: string;
  title: string;
  date: string;
  description: string;
  tags: string[];
  aiGenerated: boolean;
};

export type Post = PostMeta & { html: string };

export function getAllPosts(): PostMeta[] {
  if (!fs.existsSync(postsDir)) return [];
  return fs
    .readdirSync(postsDir)
    .filter((f) => f.endsWith(".md"))
    .map((file) => {
      const slug = file.replace(/\.md$/, "");
      const { data } = matter(fs.readFileSync(path.join(postsDir, file), "utf8"));
      return {
        slug,
        title: data.title ?? slug,
        date: data.date ?? "",
        description: data.description ?? "",
        tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
        aiGenerated: data.aiGenerated === true,
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getPost(slug: string): Promise<Post | null> {
  const file = path.join(postsDir, `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  const { data, content } = matter(fs.readFileSync(file, "utf8"));
  const html = await Promise.resolve(marked.parse(content));
  return {
    slug,
    title: data.title ?? slug,
    date: data.date ?? "",
    description: data.description ?? "",
    tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
    aiGenerated: data.aiGenerated === true,
    html,
  };
}
