import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { StudyCard } from "@/components/study-card";
import { RunSummary } from "@/components/run-summary";
import type { AnswerResult, Card, CardAttempt, CardRunResult, Deck } from "@/types";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

interface StudySessionProps {
  deck: Deck;
  onExit: () => void;
}

export function StudySession({ deck, onExit }: StudySessionProps) {
  const [remaining, setRemaining] = useState<Card[]>(() => shuffle(deck.cards));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [complexityRevealed, setComplexityRevealed] = useState(false);
  const [results, setResults] = useState<Map<string, CardRunResult>>(() => new Map());

  // Timer — initialize in effect to avoid impure render (React Compiler)
  const sessionStartRef = useRef(0);
  const [elapsed, setElapsed] = useState(0);
  const [showTimer, setShowTimer] = useState(true);

  // Per-card timing
  const cardStartRef = useRef(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const now = Date.now();
    sessionStartRef.current = now;
    cardStartRef.current = now;
    timerRef.current = setInterval(() => {
      setElapsed(Date.now() - sessionStartRef.current);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const currentCard = remaining[currentIndex];
  const isFinished = currentIndex >= remaining.length;

  // Stop timer when run completes
  useEffect(() => {
    if (isFinished && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      setElapsed(Date.now() - sessionStartRef.current);
    }
  }, [isFinished]);

  const recordAttempt = useCallback(
    (card: Card, attempt: CardAttempt) => {
      setResults((prev) => {
        const next = new Map(prev);
        const existing = next.get(card.id);
        if (existing) {
          next.set(card.id, {
            ...existing,
            attempts: [...existing.attempts, attempt],
          });
        } else {
          next.set(card.id, { card, attempts: [attempt] });
        }
        return next;
      });
    },
    []
  );

  function resetCardState() {
    setRevealed(false);
    setComplexityRevealed(false);
    cardStartRef.current = Date.now();
  }

  function handleReveal() {
    setRevealed(true);
    setComplexityRevealed(true);
  }

  function handleRevealComplexity() {
    setComplexityRevealed(true);
  }

  function handleSkip() {
    const durationMs = Date.now() - cardStartRef.current;
    recordAttempt(currentCard, { result: "skip", durationMs });
    setCurrentIndex((i) => i + 1);
    resetCardState();
  }

  function handleSaveForLater() {
    const durationMs = Date.now() - cardStartRef.current;
    recordAttempt(currentCard, { result: "save_for_later", durationMs });
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
    resetCardState();
  }

  function handleGraded(result: AnswerResult, redoLater: boolean) {
    const durationMs = Date.now() - cardStartRef.current;
    recordAttempt(currentCard, { result, durationMs });

    if (redoLater) {
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
    } else {
      setCurrentIndex((i) => i + 1);
    }
    resetCardState();
  }

  function handleRestart() {
    setRemaining(shuffle(deck.cards));
    setCurrentIndex(0);
    setResults(new Map());
    resetCardState();
    sessionStartRef.current = Date.now();
    setElapsed(0);
  }

  if (isFinished) {
    const resultsList = Array.from(results.values());
    return (
      <RunSummary
        results={resultsList}
        totalTimeMs={elapsed}
        onRestart={handleRestart}
        onExit={onExit}
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex w-full max-w-lg items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onExit}>
          Exit
        </Button>
        <div className="flex items-center gap-3">
          {showTimer && (
            <span className="font-mono text-sm text-muted-foreground">
              {formatTime(elapsed)}
            </span>
          )}
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setShowTimer((v) => !v)}
          >
            {showTimer ? "Hide" : "Show"} Timer
          </Button>
          <p className="text-sm text-muted-foreground">
            {currentIndex + 1} / {remaining.length}
          </p>
        </div>
      </div>

      <StudyCard
        key={`${currentCard.id}-${currentIndex}`}
        card={currentCard}
        revealed={revealed}
        complexityRevealed={complexityRevealed}
        onReveal={handleReveal}
        onRevealComplexity={handleRevealComplexity}
        onSkip={handleSkip}
        onSaveForLater={handleSaveForLater}
        onGraded={handleGraded}
      />
    </div>
  );
}
