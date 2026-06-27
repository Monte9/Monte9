import type { Metadata } from "next";
import Link from "next/link";
import fs from "fs";
import path from "path";
import MobileTabBar from "@/components/MobileTabBar";
import SiteMenu from "@/components/SiteMenu";
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
        <header className="sticky top-0 z-40 border-b border-gray-200/70 bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-4">
            <Link href="/" className="text-lg font-semibold hover:text-blue-600">
              Monte Thakkar
            </Link>
            <SiteMenu resumeUrl={resumeUrl} />
          </div>
        </header>
        <div className="mx-auto max-w-2xl px-5 pt-10 pb-24 sm:pb-10">
          <main>{children}</main>
        </div>
        <MobileTabBar />
      </body>
    </html>
  );
}
