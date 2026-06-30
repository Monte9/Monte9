import type { Level } from "@/features/learn/levels";

// Level progress bar — current level on the left, next on the right, with the
// "N more sets to <next>" hint underneath. Driven by levelFor().
export default function LevelProgress({
  current,
  next,
  progress,
  remaining,
  reduceMotion,
}: {
  current: Level;
  next: Level | null;
  progress: number;
  remaining: number;
  reduceMotion: boolean;
}) {
  return (
    <div className="mb-8 w-full max-w-xs">
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-medium text-accent">{current.name}</span>
        <span className="text-muted">{next ? next.name : "Max level"}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-border">
        <div
          className={`h-full rounded-full bg-accent ${
            reduceMotion ? "" : "transition-all duration-500"
          }`}
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-muted">
        {next
          ? `${remaining} more ${remaining === 1 ? "set" : "sets"} to ${
              next.name
            }`
          : "Top level reached 🎉"}
      </p>
    </div>
  );
}
