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
  const [confirmExit, setConfirmExit] = useState(false);
  const [paused, setPaused] = useState(false);

  // Timer — initialize in effect to avoid impure render (React Compiler)
  const sessionStartRef = useRef(0);
  const [elapsed, setElapsed] = useState(0);
  const [showTimer, setShowTimer] = useState(true);

  // Per-card timing
  const cardStartRef = useRef(0);
  // Track accumulated pause time for the current card
  const pauseStartRef = useRef(0);
  const cardPausedMsRef = useRef(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Track total paused time for the session timer
  const sessionPausedMsRef = useRef(0);

  useEffect(() => {
    const now = Date.now();
    sessionStartRef.current = now;
    cardStartRef.current = now;
    timerRef.current = setInterval(() => {
      if (!pauseStartRef.current) {
        setElapsed(Date.now() - sessionStartRef.current - sessionPausedMsRef.current);
      }
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
      setElapsed(Date.now() - sessionStartRef.current - sessionPausedMsRef.current);
    }
  }, [isFinished]);

  // Pause/resume keyboard shortcut
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "p" && !isFinished) {
        setPaused((v) => !v);
      }
      if (e.key === "Escape") {
        if (confirmExit) {
          setConfirmExit(false);
        } else if (!isFinished) {
          setConfirmExit(true);
        }
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isFinished, confirmExit]);

  // Track pause durations
  useEffect(() => {
    if (paused) {
      pauseStartRef.current = Date.now();
    } else if (pauseStartRef.current) {
      const pauseDuration = Date.now() - pauseStartRef.current;
      sessionPausedMsRef.current += pauseDuration;
      cardPausedMsRef.current += pauseDuration;
      pauseStartRef.current = 0;
    }
  }, [paused]);

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

  function getCardDuration() {
    return Date.now() - cardStartRef.current - cardPausedMsRef.current;
  }

  function resetCardState() {
    setRevealed(false);
    setComplexityRevealed(false);
    cardStartRef.current = Date.now();
    cardPausedMsRef.current = 0;
  }

  function handleReveal() {
    setRevealed(true);
    setComplexityRevealed(true);
  }

  function handleRevealComplexity() {
    setComplexityRevealed(true);
  }

  function handleSkip() {
    const durationMs = getCardDuration();
    recordAttempt(currentCard, { result: "skip", durationMs });
    setCurrentIndex((i) => i + 1);
    resetCardState();
  }

  function handleSaveForLater() {
    const durationMs = getCardDuration();
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

  function handleGraded(result: AnswerResult, redoLater: boolean, selectedOptionIds?: string[]) {
    const durationMs = getCardDuration();
    recordAttempt(currentCard, { result, durationMs, selectedOptionIds });

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
    sessionPausedMsRef.current = 0;
    setElapsed(0);
    setPaused(false);
    setConfirmExit(false);
    // Restart the timer interval
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (!pauseStartRef.current) {
        setElapsed(Date.now() - sessionStartRef.current - sessionPausedMsRef.current);
      }
    }, 1000);
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
      {/* Header bar */}
      <div className="flex w-full max-w-lg items-center justify-between">
        <div className="flex items-center gap-1">
          {!confirmExit ? (
            <Button variant="ghost" size="sm" onClick={() => setConfirmExit(true)}>
              Exit
              <kbd className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded border border-current/20 bg-current/10 px-1 font-mono text-[10px] leading-none opacity-60">
                Esc
              </kbd>
            </Button>
          ) : (
            <div className="flex items-center gap-1">
              <Button variant="destructive" size="sm" onClick={onExit}>
                Confirm Exit
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmExit(false)}>
                Cancel
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant={paused ? "secondary" : "ghost"}
            size="xs"
            onClick={() => setPaused((v) => !v)}
          >
            {paused ? "Resume" : "Pause"}
            <kbd className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded border border-current/20 bg-current/10 px-1 font-mono text-[10px] leading-none opacity-60">
              P
            </kbd>
          </Button>
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
            {showTimer ? "Hide" : "Show"}
          </Button>
          <p className="text-sm text-muted-foreground">
            {currentIndex + 1} / {remaining.length}
          </p>
        </div>
      </div>

      {/* Paused overlay */}
      {paused ? (
        <div className="flex flex-col items-center gap-4 py-16">
          <p className="text-xl font-medium text-muted-foreground">Paused</p>
          <Button onClick={() => setPaused(false)}>
            Resume
            <kbd className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded border border-current/20 bg-current/10 px-1 font-mono text-[10px] leading-none opacity-60">
              P
            </kbd>
          </Button>
        </div>
      ) : (
        <StudyCard
          key={`${currentCard.id}-${currentIndex}`}
          card={currentCard}
          revealed={revealed}
          complexityRevealed={complexityRevealed}
          paused={paused}
          onReveal={handleReveal}
          onRevealComplexity={handleRevealComplexity}
          onSkip={handleSkip}
          onSaveForLater={handleSaveForLater}
          onGraded={handleGraded}
        />
      )}
    </div>
  );
}
