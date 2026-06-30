import type { LearnCard } from "@/features/learn/types";
import Quote from "@/features/learn/components/cards/Quote";

// The always-shown payoff content for non-quiz cards (the "why" / definition
// rendered inline as quote blocks). Shared by the live card and the history feed.
export default function NonQuizCard({
  card,
}: {
  card: Exclude<LearnCard, { type: "quiz" }>;
}) {
  if (card.type === "trivia") {
    return (
      <div>
        <p className="text-lg leading-relaxed text-fg">{card.fact}</p>
        <Quote>{card.why}</Quote>
      </div>
    );
  }
  if (card.type === "news") {
    return (
      <div>
        <h2 className="text-lg font-semibold leading-snug text-fg">
          {card.headline}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-fg">{card.summary}</p>
        <Quote>{card.why}</Quote>
        {card.source && (
          <a
            href={card.source.url}
            className="mt-2 inline-block text-xs text-accent hover:underline"
          >
            {card.source.name} →
          </a>
        )}
      </div>
    );
  }
  if (card.type === "flashcard") {
    return (
      <div>
        <p className="text-lg font-semibold text-fg">{card.term}</p>
        <Quote tone="fg">{card.definition}</Quote>
      </div>
    );
  }
  // thisday
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-accent">
        On this day · {card.year}
      </p>
      <p className="mt-1 text-lg leading-relaxed text-fg">{card.event}</p>
      <Quote>{card.why}</Quote>
    </div>
  );
}
