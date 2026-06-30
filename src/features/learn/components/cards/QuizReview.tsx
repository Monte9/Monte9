import { Check } from "lucide-react";
import type { LearnCard } from "@/features/learn/types";
import Quote from "@/features/learn/components/cards/Quote";

// Read-only quiz: shows the question, the correct option, and the explanation.
export default function QuizReview({
  card,
}: {
  card: Extract<LearnCard, { type: "quiz" }>;
}) {
  return (
    <div>
      <p className="text-base font-medium leading-snug text-fg">
        {card.question}
      </p>
      <div className="mt-3 space-y-2">
        {card.options.map((opt, i) => {
          const isCorrect = i === card.correctIndex;
          return (
            <div
              key={i}
              className={`flex items-center justify-between rounded-xl border px-4 py-2.5 text-sm ${
                isCorrect
                  ? "border-accent bg-surface-2 text-fg"
                  : "border-border bg-bg text-muted"
              }`}
            >
              <span>{opt}</span>
              {isCorrect && (
                <Check className="h-4 w-4 shrink-0 text-accent" aria-hidden />
              )}
            </div>
          );
        })}
      </div>
      <Quote>{card.explanation}</Quote>
    </div>
  );
}
