"use client";

import { X } from "lucide-react";
import { type TravelCountry, CATEGORY_LABELS } from "@/features/travel/data/travel";
import { useTheme } from "@/components/theme/ThemeProvider";
import { GLOBE_COLORS } from "@/lib/theme";
import Sheet from "@/components/ui/Sheet";

// Rich-info surface for a country — uses the shared Sheet (bottom sheet on
// mobile, centered dialog on desktop).
export default function CountryInfo({
  country,
  onClose,
}: {
  country: TravelCountry;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const catColor = GLOBE_COLORS[theme].cat[country.category];

  return (
    <Sheet onClose={onClose} ariaLabel={country.name} className="sm:w-[22rem]">
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
    </Sheet>
  );
}
