import type { LearnCard } from "@/features/learn/types";
import CardChrome from "@/features/learn/components/cards/CardChrome";
import QuizReview from "@/features/learn/components/cards/QuizReview";
import NonQuizCard from "@/features/learn/components/cards/NonQuizCard";

// History feed — a scrollable, read-only list of previously-seen cards.
export default function HistoryFeed({ cards }: { cards: LearnCard[] }) {
  if (cards.length === 0) {
    return (
      <div className="mt-16 px-8 text-center text-sm text-muted">
        No history yet — finish a set and the cards you&apos;ve seen show up
        here.
      </div>
    );
  }
  // Newest first (most-recently-dealt at the top).
  const sorted = [...cards].sort((a, b) =>
    (b.seenAt ?? "").localeCompare(a.seenAt ?? "")
  );
  return (
    <div className="mt-6 space-y-3">
      {sorted.map((c) => (
        <div
          key={c.id}
          className="rounded-2xl border border-border bg-surface p-4"
        >
          <CardChrome type={c.type} topic={c.topic} seenAt={c.seenAt} />
          {c.type === "quiz" ? (
            <QuizReview card={c} />
          ) : (
            <NonQuizCard card={c} />
          )}
        </div>
      ))}
    </div>
  );
}
