import type { Metadata } from "next";
import Link from "next/link";
import fs from "fs";
import path from "path";
import MobileTabBar from "@/components/MobileTabBar";
import SiteIcons from "@/components/SiteIcons";
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
        <div className="mx-auto max-w-2xl px-5 pt-10 pb-24 sm:pb-10">
          <header className="mb-12 flex items-center justify-between gap-4">
            <Link href="/" className="text-lg font-semibold hover:text-blue-600">
              Monte Thakkar
            </Link>
            <div className="flex items-center gap-5">
              <nav className="hidden gap-5 text-sm text-gray-600 sm:flex">
                <Link href="/posts" className="hover:text-blue-600">
                  Posts
                </Link>
                <Link href="/about" className="hover:text-blue-600">
                  About
                </Link>
                <Link href="/travel" className="hover:text-blue-600">
                  Travel
                </Link>
              </nav>
              <SiteIcons resumeUrl={resumeUrl} />
            </div>
          </header>
          <main>{children}</main>
        </div>
        <MobileTabBar />
      </body>
    </html>
  );
}
