"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const navStroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const Icon = {
  home: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" {...navStroke}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h5v-6h4v6h5V9.5" />
    </svg>
  ),
  posts: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" {...navStroke}>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M9 9h4M9 13h6M9 17h6" />
    </svg>
  ),
  travel: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" {...navStroke}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.6 2.8 2.6 15.2 0 18M12 3c-2.6 2.8-2.6 15.2 0 18" />
    </svg>
  ),
  about: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" {...navStroke}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.6 3.1-5.5 7-5.5s7 1.9 7 5.5" />
    </svg>
  ),
  resume: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" {...navStroke}>
      <path d="M7 3h7l4 4v14H7z" />
      <path d="M14 3v4h4M10 12h4M10 16h4" />
    </svg>
  ),
  github: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor">
      <path d="M12 .5C5.37.5 0 5.78 0 12.29c0 5.21 3.44 9.63 8.21 11.19.6.11.82-.26.82-.58 0-.28-.01-1.02-.02-2-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.96 0-1.31.47-2.39 1.24-3.23-.12-.31-.54-1.53.12-3.2 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.67.24 2.89.12 3.2.77.84 1.23 1.92 1.23 3.23 0 4.63-2.81 5.65-5.49 5.95.43.37.81 1.1.81 2.22 0 1.6-.01 2.89-.01 3.29 0 .32.22.7.83.58A12.01 12.01 0 0 0 24 12.29C24 5.78 18.63.5 12 .5z" />
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor">
      <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.68l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64z" />
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
    </svg>
  ),
  email: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" {...navStroke}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 7 8.5 6 8.5-6" />
    </svg>
  ),
};

export default function SiteMenu({ resumeUrl }: { resumeUrl: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const nav = [
    { href: resumeUrl, label: "Résumé", icon: Icon.resume, external: true },
  ];
  const social = [
    { href: "https://github.com/Monte9", label: "GitHub", icon: Icon.github },
    { href: "https://x.com/montethakkar", label: "X", icon: Icon.x },
    {
      href: "https://www.linkedin.com/in/montethakkar/",
      label: "LinkedIn",
      icon: Icon.linkedin,
    },
    { href: "mailto:manthan.thakkar@gmail.com", label: "Email", icon: Icon.email },
  ];

  const rowCls =
    "flex items-center gap-3 px-4 py-2.5 text-sm text-fg hover:bg-surface-2";

  const renderRow = (item: {
    href: string;
    label: string;
    icon: React.ReactNode;
    external?: boolean;
  }) => {
    const content = (
      <>
        <span className="text-muted">{item.icon}</span>
        {item.label}
      </>
    );
    return item.external || item.href.startsWith("http") || item.href.startsWith("mailto") ? (
      <a key={item.label} href={item.href} className={rowCls} onClick={() => setOpen(false)}>
        {content}
      </a>
    ) : (
      <Link key={item.label} href={item.href} className={rowCls} onClick={() => setOpen(false)}>
        {content}
      </Link>
    );
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="-mr-1 flex h-9 w-9 items-center justify-center rounded-md text-fg hover:bg-surface-2"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" {...navStroke}>
          {open ? (
            <path d="M6 6l12 12M18 6 6 18" />
          ) : (
            <path d="M4 7h16M4 12h16M4 17h16" />
          )}
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-bg py-1.5 shadow-lg">
          {nav.map(renderRow)}
          <hr className="my-1.5 border-border" />
          {social.map(renderRow)}
        </div>
      )}
    </div>
  );
}
