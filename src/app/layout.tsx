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
  // Build-time check: only show the Resume link once public/resume.pdf exists.
  const hasResume = fs.existsSync(path.join(process.cwd(), "public", "resume.pdf"));

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
              {hasResume && (
                <a href="/resume.pdf" className="hover:text-blue-600">
                  Resume
                </a>
              )}
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
