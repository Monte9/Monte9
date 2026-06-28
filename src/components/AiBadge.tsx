import { Sparkles } from "lucide-react";

// Small, theme-aware "AI-generated" badge for posts the agent wrote.
export default function AiBadge({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-border bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-muted ${className ?? ""}`}
    >
      <Sparkles className="h-3 w-3" aria-hidden />
      AI-generated
    </span>
  );
}
