import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { StudyCard } from "@/components/study-card";
import type { Card, Deck } from "@/types";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface StudySessionProps {
  deck: Deck;
  onExit: () => void;
}

export function StudySession({ deck, onExit }: StudySessionProps) {
  const [remaining, setRemaining] = useState<Card[]>(() => shuffle(deck.cards));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const totalCards = useMemo(() => deck.cards.length, [deck.cards.length]);
  const currentCard = remaining[currentIndex];
  const isFinished = currentIndex >= remaining.length;

  function handleReveal() {
    setRevealed(true);
  }

  function handleNext() {
    setCurrentIndex((i) => i + 1);
    setRevealed(false);
  }

  function handleSkip() {
    setCurrentIndex((i) => i + 1);
    setRevealed(false);
  }

  function handleSaveForLater() {
    setRemaining((prev) => {
      const next = [...prev];
      const [card] = next.splice(currentIndex, 1);
      const remainingAfter = next.length - currentIndex;
      const insertAt =
        remainingAfter > 0
          ? currentIndex + 1 + Math.floor(Math.random() * remainingAfter)
          : next.length;
      next.splice(insertAt, 0, card);
      return next;
    });
    setRevealed(false);
  }

  function handleRestart() {
    setRemaining(shuffle(deck.cards));
    setCurrentIndex(0);
    setRevealed(false);
  }

  if (isFinished) {
    return (
      <div className="flex flex-col items-center gap-6 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-medium text-foreground">Run Complete!</h2>
          <p className="mt-2 text-muted-foreground">
            You went through all {totalCards} cards.
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleRestart}>Restart</Button>
          <Button variant="outline" onClick={onExit}>
            Back to Deck
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex w-full max-w-lg items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onExit}>
          Exit
        </Button>
        <p className="text-sm text-muted-foreground">
          {currentIndex + 1} / {remaining.length}
        </p>
      </div>

      <StudyCard
        card={currentCard}
        revealed={revealed}
        onReveal={handleReveal}
        onNext={handleNext}
        onSkip={handleSkip}
        onSaveForLater={handleSaveForLater}
      />
    </div>
  );
}
