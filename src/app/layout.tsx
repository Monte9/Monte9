import type { Metadata } from "next";
import fs from "fs";
import path from "path";
import MobileTabBar from "@/components/MobileTabBar";
import DesktopNav from "@/components/DesktopNav";
import HeaderBrand from "@/components/HeaderBrand";
import SiteMenu from "@/components/SiteMenu";
import { ThemeProvider } from "@/components/ThemeProvider";
import { NO_FOUC_SCRIPT } from "@/lib/theme";
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FOUC_SCRIPT }} />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <header className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur">
            <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-5">
              <HeaderBrand />
              <div className="flex items-center gap-5">
                <DesktopNav />
                <SiteMenu resumeUrl={resumeUrl} />
              </div>
            </div>
          </header>
          <div className="mx-auto max-w-2xl px-5 pt-10 pb-28 sm:pb-12">
            <main>{children}</main>
          </div>
          <MobileTabBar />
        </ThemeProvider>
      </body>
    </html>
  );
}
