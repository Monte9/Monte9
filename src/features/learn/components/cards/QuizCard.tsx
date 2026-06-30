import { Check, X } from "lucide-react";
import type { LearnCard } from "@/features/learn/types";
import Burst from "@/features/learn/components/Burst";

// The interactive quiz card: tap an option to answer, then the correct option
// and explanation are revealed (with a burst on a correct pick).
export default function QuizCard({
  card,
  chosen,
  onChoose,
  trans,
  reduceMotion,
}: {
  card: Extract<LearnCard, { type: "quiz" }>;
  chosen: number | null;
  onChoose: (i: number) => void;
  trans: string;
  reduceMotion: boolean;
}) {
  const answered = chosen !== null;
  const gotIt = answered && chosen === card.correctIndex;
  return (
    <div>
      <p className="text-lg font-medium leading-snug text-fg">{card.question}</p>
      <div className="relative mt-4 space-y-2">
        {gotIt && !reduceMotion && <Burst />}
        {card.options.map((opt, i) => {
          const isCorrect = i === card.correctIndex;
          const isChosen = i === chosen;
          let cls = "border-border bg-bg text-fg";
          let anim = "";
          if (answered && isCorrect) {
            cls = "border-accent bg-surface-2 text-fg";
            if (!reduceMotion) anim = "learn-pop";
          } else if (answered && isChosen) {
            cls = "border-border bg-surface-2 text-muted line-through";
            if (!reduceMotion) anim = "learn-shake";
          }
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChoose(i)}
              disabled={answered}
              className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm ${trans} ${cls} ${anim} ${
                answered ? "" : "hover:bg-surface-2 active:scale-[0.99]"
              }`}
            >
              <span>{opt}</span>
              {answered && isCorrect && (
                <Check className="h-4 w-4 shrink-0 text-accent" aria-hidden />
              )}
              {answered && isChosen && !isCorrect && (
                <X className="h-4 w-4 shrink-0 text-muted" aria-hidden />
              )}
            </button>
          );
        })}
      </div>
      {answered && (
        <p
          className={`mt-4 border-l-2 border-accent pl-3 text-sm text-muted ${
            reduceMotion ? "" : "learn-reveal"
          }`}
        >
          {card.explanation}
        </p>
      )}
    </div>
  );
}
