import { X, Play } from "lucide-react";
import Sheet from "@/components/ui/Sheet";
import { CARD_TYPES, TOPICS } from "@/features/learn/client/learn-client";

// New-set setup sheet — choose card types + topics, then start a fresh set.
export default function SetupSheet({
  open,
  types,
  topics,
  onToggleType,
  onToggleTopic,
  onClose,
  onStart,
}: {
  open: boolean;
  types: string[];
  topics: string[];
  onToggleType: (t: string) => void;
  onToggleTopic: (t: string) => void;
  onClose: () => void;
  onStart: () => void;
}) {
  if (!open) return null;
  const chip = (on: boolean) =>
    `rounded-full border px-3 py-1.5 text-xs transition-colors ${
      on
        ? "border-accent bg-accent/10 text-accent"
        : "border-border text-muted hover:text-fg"
    }`;
  return (
    <Sheet onClose={onClose} ariaLabel="New set" className="sm:w-[26rem]">
      <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-fg">New set</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-fg"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <p className="mb-2 text-xs uppercase tracking-wide text-muted">
          Card types
        </p>
        <div className="mb-5 flex flex-wrap gap-1.5">
          {CARD_TYPES.map((t) => (
            <button
              key={t.key}
              type="button"
              aria-pressed={types.includes(t.key)}
              onClick={() => onToggleType(t.key)}
              className={chip(types.includes(t.key))}
            >
              {t.label}
            </button>
          ))}
        </div>

        <p className="mb-2 text-xs uppercase tracking-wide text-muted">Topics</p>
        <div className="mb-6 flex flex-wrap gap-1.5">
          {TOPICS.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={topics.includes(t)}
              onClick={() => onToggleTopic(t)}
              className={chip(topics.includes(t))}
            >
              {t}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onStart}
          disabled={types.length === 0}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3.5 text-sm font-semibold text-accent-contrast transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Play className="h-4 w-4" aria-hidden />
          {types.length === 0 ? "Pick at least one type" : "Start set"}
        </button>
    </Sheet>
  );
}
