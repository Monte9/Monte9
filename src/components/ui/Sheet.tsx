"use client";

import { useEffect, useRef } from "react";

// Shared modal surface: a bottom sheet on mobile, a centered dialog on desktop.
// Sits above the mobile tab bar (z-[60]) and clears the iOS home indicator.
// Handles backdrop-click + Escape to close and focuses itself on open. Callers
// provide the content (header, body, actions) and a width via `className`.
export default function Sheet({
  onClose,
  ariaLabel,
  className = "",
  children,
}: {
  onClose: () => void;
  ariaLabel?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <div
        className="fixed inset-0 z-[55] bg-black/30"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        tabIndex={-1}
        style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
        className={`fixed inset-x-0 bottom-0 z-[60] max-h-[88vh] overflow-y-auto rounded-t-2xl border-t border-border bg-bg px-5 pt-5 shadow-xl outline-none sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-[85vh] sm:max-w-[calc(100vw-2rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border ${className}`}
      >
        {children}
      </div>
    </>
  );
}
