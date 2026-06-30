import type { RefObject } from "react";
import { ArrowRight } from "lucide-react";
import type { LearnCard } from "@/features/learn/types";
import CardChrome from "@/features/learn/components/cards/CardChrome";
import CardBody from "@/features/learn/components/cards/CardBody";

// The interactive (current) card: segmented progress bar, the card itself, and
// the full-width advance button. Only quiz cards gate Next (engaged).
export default function CardStage({
  cards,
  idx,
  card,
  chosen,
  reduceMotion,
  engaged,
  cardTopRef,
  onChoose,
  onNext,
}: {
  cards: LearnCard[];
  idx: number;
  card: LearnCard;
  chosen: number | null;
  reduceMotion: boolean;
  engaged: boolean;
  cardTopRef: RefObject<HTMLDivElement | null>;
  onChoose: (i: number) => void;
  onNext: () => void;
}) {
  const trans = reduceMotion ? "" : "transition-colors";
  return (
    <div ref={cardTopRef} className="mt-6 scroll-mt-20">
      {/* segmented progress bar (replaces the carousel dots) */}
      <div className="flex gap-1.5" aria-hidden>
        {cards.map((_, i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full ${
              reduceMotion ? "" : "transition-colors"
            } ${i <= idx ? "bg-accent" : "bg-border"}`}
          />
        ))}
      </div>
      <p className="mt-2 text-xs text-muted">
        {idx + 1} of {cards.length}
      </p>

      {/* card sizes to its content — every option visible, nothing clipped */}
      <div
        key={card.id}
        className={`mt-3 rounded-2xl border border-border bg-surface p-5 shadow-[0_18px_40px_-22px_rgba(0,0,0,0.35)] ${
          reduceMotion ? "" : "learn-card-in"
        }`}
      >
        <CardChrome type={card.type} topic={card.topic} seenAt={card.seenAt} />
        <CardBody
          card={card}
          chosen={chosen}
          reduceMotion={reduceMotion}
          trans={trans}
          onChoose={onChoose}
        />
      </div>

      {/* full-width primary advance button */}
      <button
        type="button"
        onClick={onNext}
        disabled={!engaged}
        className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-colors ${
          engaged
            ? "bg-accent text-accent-contrast hover:opacity-90"
            : "cursor-not-allowed border border-border text-muted"
        }`}
      >
        {idx === cards.length - 1 ? "Finish" : "Next"}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
