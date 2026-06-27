"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { type TravelCountry, CATEGORY_LABELS } from "@/data/travel";
import { useTheme } from "@/components/ThemeProvider";
import { GLOBE_COLORS } from "@/lib/theme";

// Rich-info surface: bottom sheet on mobile, centered dialog on desktop.
export default function CountryInfo({
  country,
  onClose,
}: {
  country: TravelCountry;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const catColor = GLOBE_COLORS[theme].cat[country.category];

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
        aria-label={country.name}
        tabIndex={-1}
        className="fixed inset-x-0 bottom-0 z-[60] rounded-t-2xl border-t border-border bg-bg p-5 shadow-xl outline-none sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[22rem] sm:max-w-[calc(100vw-2rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{country.flag}</span>
            <h2 className="text-lg font-semibold">{country.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 -mt-1 rounded-md p-1 text-muted hover:bg-surface-2 hover:text-fg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <span
          className="mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
          style={{ backgroundColor: catColor + "22", color: catColor }}
        >
          {CATEGORY_LABELS[country.category]}
        </span>
        <p className="mt-3 text-sm text-fg">{country.detail}</p>
        {country.blurb && <p className="mt-1 text-sm text-muted">{country.blurb}</p>}
      </div>
    </>
  );
}
