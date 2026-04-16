import { useState, useRef, useEffect, useCallback } from "react";
import { Tooltip } from "radix-ui";
import { Button } from "@/components/ui/button";
import { StudyCard } from "@/components/study-card";
import { RunSummary } from "@/components/run-summary";
import type { AnswerResult, Card, CardAttempt, CardRunResult, Deck, SessionGoal } from "@/types";

interface UndoSnapshot {
  remaining: Card[];
  currentIndex: number;
  results: Map<string, CardRunResult>;
  cardsCompleted: number;
  redoLaterIds: Set<string>;
}

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
  goal?: SessionGoal;
  shuffle?: boolean;
  onExit: () => void;
  onRunComplete: (totalTimeMs: number, results: CardRunResult[]) => void;
}

export function StudySession({ deck, goal, shuffle: doShuffle = true, onExit, onRunComplete }: StudySessionProps) {
  const [remaining, setRemaining] = useState<Card[]>(() => doShuffle ? shuffle(deck.cards) : [...deck.cards]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [complexityRevealed, setComplexityRevealed] = useState(false);
  const [results, setResults] = useState<Map<string, CardRunResult>>(() => new Map());
  const [confirmExit, setConfirmExit] = useState(false);
  const [cardsCompleted, setCardsCompleted] = useState(0);
  const [undoStack, setUndoStack] = useState<UndoSnapshot[]>([]);
  const [redoLaterIds, setRedoLaterIds] = useState<Set<string>>(() => new Set());
  const [goalReached, setGoalReached] = useState(false);
  const [goalDismissed, setGoalDismissed] = useState(false);
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

  // Stop timer and persist run when completed
  const runSavedRef = useRef(false);
  useEffect(() => {
    if (isFinished && !runSavedRef.current) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      const finalElapsed = Date.now() - sessionStartRef.current - sessionPausedMsRef.current;
      setElapsed(finalElapsed);
      runSavedRef.current = true;
      onRunComplete(finalElapsed, Array.from(results.values()));
    }
  }, [isFinished, onRunComplete, results]);

  function pushSnapshot() {
    const snap: UndoSnapshot = {
      remaining,
      currentIndex,
      results,
      cardsCompleted,
      redoLaterIds,
    };
    setUndoStack((prev) => {
      const next = [...prev, snap];
      return next.length > 20 ? next.slice(-20) : next;
    });
  }

  function handleUndo() {
    if (undoStack.length === 0) return;
    const snap = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setRemaining(snap.remaining);
    setCurrentIndex(snap.currentIndex);
    setResults(snap.results);
    setCardsCompleted(snap.cardsCompleted);
    setRedoLaterIds(snap.redoLaterIds);
    setRevealed(false);
    setComplexityRevealed(false);
  }

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
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !isFinished) {
        e.preventDefault();
        if (undoStack.length === 0) return;
        const snap = undoStack[undoStack.length - 1];
        setUndoStack((prev) => prev.slice(0, -1));
        setRemaining(snap.remaining);
        setCurrentIndex(snap.currentIndex);
        setResults(snap.results);
        setCardsCompleted(snap.cardsCompleted);
        setRedoLaterIds(snap.redoLaterIds);
        setRevealed(false);
        setComplexityRevealed(false);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isFinished, confirmExit, undoStack]);

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

  function onCardDone() {
    const newCount = cardsCompleted + 1;
    setCardsCompleted(newCount);
    if (goal && !goalDismissed) {
      if (goal.type === "cards" && newCount >= goal.value) {
        setGoalReached(true);
      }
    }
  }

  // Check minute-based goal via elapsed
  const minuteGoalReached = goal?.type === "minutes" && !goalDismissed && elapsed >= goal.value * 60_000;
  const showGoalBanner = (goalReached || minuteGoalReached) && !goalDismissed;

  function handleFinishEarly() {
    // Force finish: set index past remaining to trigger isFinished
    setCurrentIndex(remaining.length);
  }

  function handleSkip() {
    pushSnapshot();
    const durationMs = getCardDuration();
    recordAttempt(currentCard, { result: "skip", durationMs });
    setRedoLaterIds((prev) => { const next = new Set(prev); next.delete(currentCard.id); return next; });
    setCurrentIndex((i) => i + 1);
    onCardDone();
    resetCardState();
  }

  // Save For Later: re-insert 2–10 positions ahead at random
  function insertLater(prev: Card[]): Card[] {
    const next = [...prev];
    const [card] = next.splice(currentIndex, 1);
    const remainingAfter = next.length - currentIndex;
    if (remainingAfter === 0) {
      next.push(card);
    } else {
      const minOffset = Math.min(2, remainingAfter);
      const maxOffset = Math.min(10, remainingAfter);
      const offset = minOffset + Math.floor(Math.random() * (maxOffset - minOffset + 1));
      next.splice(currentIndex + offset, 0, card);
    }
    return next;
  }

  // Redo Later: exact position based on grade
  //   wrong       → 5 ahead (or end if fewer cards remain)
  //   approximate → 10 ahead (or end if fewer cards remain)
  //   correct     → end of queue
  function insertRedoLater(prev: Card[], result: AnswerResult): Card[] {
    const next = [...prev];
    const [card] = next.splice(currentIndex, 1);
    if (result === "correct") {
      next.push(card);
    } else {
      const offset = result === "wrong" ? 5 : 10;
      const remainingAfter = next.length - currentIndex;
      next.splice(currentIndex + Math.min(offset, remainingAfter), 0, card);
    }
    return next;
  }

  function handleSaveForLater() {
    pushSnapshot();
    const durationMs = getCardDuration();
    recordAttempt(currentCard, { result: "save_for_later", durationMs });
    setRemaining(insertLater);
    resetCardState();
  }

  function handleGraded(result: AnswerResult, redoLater: boolean, selectedOptionIds?: string[]) {
    pushSnapshot();
    const durationMs = getCardDuration();
    recordAttempt(currentCard, { result, durationMs, selectedOptionIds });

    if (redoLater) {
      setRedoLaterIds((prev) => new Set([...prev, currentCard.id]));
      setRemaining((prev) => insertRedoLater(prev, result));
    } else {
      setRedoLaterIds((prev) => { const next = new Set(prev); next.delete(currentCard.id); return next; });
      onCardDone();
      setCurrentIndex((i) => i + 1);
    }
    resetCardState();
  }

  function handleRestart() {
    setRemaining(doShuffle ? shuffle(deck.cards) : [...deck.cards]);
    setCurrentIndex(0);
    setResults(new Map());
    setUndoStack([]);
    resetCardState();
    runSavedRef.current = false;
    sessionStartRef.current = Date.now();
    sessionPausedMsRef.current = 0;
    setElapsed(0);
    setPaused(false);
    setConfirmExit(false);
    setCardsCompleted(0);
    setRedoLaterIds(new Set());
    setGoalReached(false);
    setGoalDismissed(false);
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
      <div className="flex w-full flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        {/* Row 1: exit left, controls right */}
        <div className="flex items-center justify-between">
          {/* Exit / Confirm */}
          <div className="flex items-center gap-1">
            {!confirmExit ? (
              <Button variant="ghost" size="sm" onClick={() => setConfirmExit(true)}>
                Exit
                <kbd className="ml-1 hidden sm:inline-flex h-4 min-w-4 items-center justify-center rounded border border-current/20 bg-current/10 px-1 font-mono text-[10px] leading-none opacity-60">
                  Esc
                </kbd>
              </Button>
            ) : (
              <div className="flex items-center gap-1">
                <Button variant="destructive" size="sm" onClick={onExit}>
                  Exit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmExit(false)}>
                  Cancel
                </Button>
              </div>
            )}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="xs"
              disabled={undoStack.length === 0}
              onClick={handleUndo}
              title="Undo last action (Ctrl+Z)"
            >
              Undo
              <kbd className="ml-1 hidden sm:inline-flex h-4 min-w-4 items-center justify-center rounded border border-current/20 bg-current/10 px-1 font-mono text-[10px] leading-none opacity-60">
                &#8984;Z
              </kbd>
            </Button>
            <Button
              variant={paused ? "secondary" : "ghost"}
              size="xs"
              onClick={() => setPaused((v) => !v)}
            >
              {paused ? "Resume" : "Pause"}
              <kbd className="ml-1 hidden sm:inline-flex h-4 min-w-4 items-center justify-center rounded border border-current/20 bg-current/10 px-1 font-mono text-[10px] leading-none opacity-60">
                P
              </kbd>
            </Button>
            {/* Desktop: timer + hide toggle */}
            {showTimer && (() => {
              const cardsRemaining = remaining.length - currentIndex;
              const avgMs = cardsCompleted > 0 ? elapsed / cardsCompleted : 0;
              const estTotal = cardsCompleted > 0 ? elapsed + avgMs * cardsRemaining : 0;
              return (
                <Tooltip.Provider delayDuration={300}>
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <span className="hidden sm:inline font-mono text-sm text-muted-foreground cursor-default select-none">
                        {formatTime(elapsed)}
                      </span>
                    </Tooltip.Trigger>
                    {estTotal > 0 && (
                      <Tooltip.Portal>
                        <Tooltip.Content
                          sideOffset={6}
                          className="z-50 rounded-md border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-sm"
                        >
                          ~{formatTime(estTotal)} estimated total
                          <Tooltip.Arrow className="fill-popover" />
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    )}
                  </Tooltip.Root>
                </Tooltip.Provider>
              );
            })()}
            <Button
              variant="ghost"
              size="xs"
              className="hidden sm:inline-flex"
              onClick={() => setShowTimer((v) => !v)}
            >
              {showTimer ? "Hide" : "Show"}
            </Button>
            <p className="text-sm text-muted-foreground">
              {currentIndex + 1} / {remaining.length}
            </p>
          </div>
        </div>

        {/* Row 2: timer — mobile only, always visible */}
        <div className="flex justify-center sm:hidden">
          <span className="font-mono text-xs text-muted-foreground">{formatTime(elapsed)}</span>
        </div>
      </div>

      {/* Card progress bar */}
      {(() => {
        const total = remaining.length;
        const donePercent = total > 0 ? (currentIndex / total) * 100 : 0;
        const redoPercent = total > 0 ? (redoLaterIds.size / total) * 100 : 0;
        return (
          <div className="w-full">
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden flex">
              <div
                className="h-full bg-primary/60 transition-all duration-300 shrink-0"
                style={{ width: `${donePercent}%` }}
              />
              <div
                className="h-full bg-amber-400/80 dark:bg-amber-500/70 transition-all duration-300 shrink-0"
                style={{ width: `${redoPercent}%` }}
              />
            </div>
          </div>
        );
      })()}

      {/* Goal progress */}
      {goal && (
        <div className="w-full">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>
              {goal.type === "cards"
                ? `${Math.min(cardsCompleted, goal.value)} / ${goal.value} cards`
                : `${formatTime(Math.min(elapsed, goal.value * 60_000))} / ${formatTime(goal.value * 60_000)}`}
            </span>
            {showGoalBanner && <span className="text-green-600 dark:text-green-400 font-medium">Goal reached!</span>}
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-300"
              style={{
                width: `${Math.min(100, goal.type === "cards"
                  ? (cardsCompleted / goal.value) * 100
                  : (elapsed / (goal.value * 60_000)) * 100
                )}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Goal reached banner */}
      {showGoalBanner && !paused && (
        <div className="flex w-full items-center justify-between rounded-lg border border-green-300 bg-green-50 px-4 py-3 dark:border-green-800 dark:bg-green-950">
          <p className="text-sm font-medium text-green-700 dark:text-green-300">
            You reached your goal!
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setGoalDismissed(true)}>
              Continue
            </Button>
            <Button size="sm" onClick={handleFinishEarly}>
              Finish
            </Button>
          </div>
        </div>
      )}

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
