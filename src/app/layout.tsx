import type { Metadata } from "next";
import Link from "next/link";
import fs from "fs";
import path from "path";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Monte Thakkar",
    template: "%s · Monte Thakkar",
  },
  description:
    "Full-stack software engineer with a strong product sense. Building with AI agents.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Self-hosted resume once public/resume.pdf is committed; external link until then.
  const resumeUrl = fs.existsSync(path.join(process.cwd(), "public", "resume.pdf"))
    ? "/resume.pdf"
    : "https://assets.super.so/e181e7f6-05b6-4256-a4ce-5a308f123cc1/files/5681e913-e7f9-4cf9-8e35-60f6283b4ea4/MonteThakkarResume.pdf";

  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <div className="mx-auto max-w-2xl px-5 py-10">
          <header className="mb-12 flex items-baseline justify-between">
            <Link href="/" className="text-lg font-semibold hover:text-blue-600">
              Monte Thakkar
            </Link>
            <nav className="flex gap-5 text-sm text-gray-600">
              <Link href="/posts" className="hover:text-blue-600">
                Posts
              </Link>
              <Link href="/about" className="hover:text-blue-600">
                About
              </Link>
              <a href={resumeUrl} className="hover:text-blue-600">
                Resume
              </a>
            </nav>
          </header>
          <main>{children}</main>
          <footer className="mt-16 border-t border-gray-200 pt-6 text-sm text-gray-500">
            <div className="flex gap-4">
              <a href="https://github.com/Monte9" className="hover:text-blue-600">
                GitHub
              </a>
              <a href="https://x.com/montethakkar" className="hover:text-blue-600">
                X
              </a>
              <a
                href="https://www.linkedin.com/in/montethakkar/"
                className="hover:text-blue-600"
              >
                LinkedIn
              </a>
              <a
                href="mailto:manthan.thakkar@gmail.com"
                className="hover:text-blue-600"
              >
                Email
              </a>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
