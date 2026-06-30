import { Brain, Play } from "lucide-react";
import { levelFor } from "@/features/learn/levels";
import Burst from "@/features/learn/components/Burst";
import LevelProgress from "@/features/learn/components/LevelProgress";

// Completion celebration (count-up + burst + level progress + new set).
export default function CompleteScreen({
  reduceMotion,
  sets,
  onNewSet,
}: {
  reduceMotion: boolean;
  sets: number;
  onNewSet: () => void;
}) {
  const { current, next, progress, remaining } = levelFor(sets);
  return (
    <div className="mt-12 flex flex-col items-center text-center">
      <div
        className={`relative mb-2 flex items-center gap-2 text-2xl font-semibold text-fg ${
          reduceMotion ? "" : "learn-countup"
        }`}
      >
        {!reduceMotion && <Burst />}
        <Brain className="h-6 w-6 text-accent" aria-hidden /> {current.name}
      </div>
      <p className="mb-8 text-sm text-muted">
        {sets} {sets === 1 ? "set" : "sets"} done
      </p>

      {/* level progress: current on the left, next on the right */}
      <LevelProgress
        current={current}
        next={next}
        progress={progress}
        remaining={remaining}
        reduceMotion={reduceMotion}
      />

      <button
        type="button"
        onClick={onNewSet}
        className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 font-medium text-accent-contrast hover:opacity-90"
      >
        <Play className="h-4 w-4" aria-hidden /> New set
      </button>
      <p className="mt-3 text-xs text-muted">
        Pick card types &amp; topics for the next one
      </p>
    </div>
  );
}
