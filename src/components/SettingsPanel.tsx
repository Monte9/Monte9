"use client";

import { useTheme } from "@/components/ThemeProvider";
import { THEMES, THEME_LABELS, THEME_SWATCHES } from "@/lib/theme";

export default function SettingsPanel() {
  const { theme, setTheme, reduceMotion, setReduceMotion } = useTheme();

  return (
    <div>
      <h1 className="text-2xl font-semibold">Settings</h1>
      <p className="mt-2 mb-8 text-muted">Make this site yours. Saved on this device.</p>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">Theme</h2>
        <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-3">
          {THEMES.map((t) => {
            const active = theme === t;
            return (
              <button
                key={t}
                role="radio"
                aria-checked={active}
                aria-label={THEME_LABELS[t]}
                onClick={() => setTheme(t)}
                className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-sm transition ${
                  active
                    ? "border-accent ring-2 ring-accent"
                    : "border-border hover:bg-surface-2"
                }`}
              >
                <span
                  className="flex h-10 w-full items-center justify-center rounded-md border border-border"
                  style={{ background: THEME_SWATCHES[t].bg }}
                >
                  <span
                    className="h-4 w-4 rounded-full"
                    style={{ background: THEME_SWATCHES[t].accent }}
                  />
                </span>
                <span className={active ? "font-medium text-accent" : "text-fg"}>
                  {THEME_LABELS[t]}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Motion</h2>
        <div className="flex items-center justify-between gap-4 rounded-xl border border-border p-4">
          <div>
            <div className="font-medium">Reduce motion</div>
            <div className="text-sm text-muted">
              Stop the globe from auto-spinning and minimize transitions.
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={reduceMotion}
            aria-label="Reduce motion"
            onClick={() => setReduceMotion(!reduceMotion)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
              reduceMotion ? "bg-accent" : "border border-border bg-surface-2"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
                reduceMotion ? "left-[22px]" : "left-0.5"
              }`}
            />
          </button>
        </div>
      </section>
    </div>
  );
}
