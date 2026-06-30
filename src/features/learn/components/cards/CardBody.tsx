import type { LearnCard } from "@/features/learn/types";
import QuizCard from "@/features/learn/components/cards/QuizCard";
import NonQuizCard from "@/features/learn/components/cards/NonQuizCard";

// Type-specific content for the interactive (current) card: quiz cards are
// playable, everything else renders its read-and-go payoff.
export default function CardBody({
  card,
  chosen,
  reduceMotion,
  trans,
  onChoose,
}: {
  card: LearnCard;
  chosen: number | null;
  reduceMotion: boolean;
  trans: string;
  onChoose: (i: number) => void;
}) {
  if (card.type === "quiz") {
    return (
      <QuizCard
        card={card}
        chosen={chosen}
        reduceMotion={reduceMotion}
        onChoose={onChoose}
        trans={trans}
      />
    );
  }
  return <NonQuizCard card={card} />;
}
