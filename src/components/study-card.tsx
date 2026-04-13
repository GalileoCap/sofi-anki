import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ComplexityBadge } from "@/components/complexity-badge";
import type { AnswerResult, Card as CardType } from "@/types";
import { cn } from "@/lib/utils";

const GRADES: { value: AnswerResult; label: string; shortcut: string; className: string }[] = [
  { value: "wrong", label: "Wrong", shortcut: "1", className: "border-red-300 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900" },
  { value: "approximate", label: "Approximate", shortcut: "2", className: "border-yellow-300 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-400 dark:hover:bg-yellow-900" },
  { value: "correct", label: "Correct", shortcut: "3", className: "border-green-300 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-800 dark:bg-green-950 dark:text-green-400 dark:hover:bg-green-900" },
];

interface StudyCardProps {
  card: CardType;
  revealed: boolean;
  complexityRevealed: boolean;
  paused: boolean;
  onReveal: () => void;
  onRevealComplexity: () => void;
  onSkip: () => void;
  onSaveForLater: () => void;
  onGraded: (result: AnswerResult, redoLater: boolean) => void;
}

export function StudyCard({
  card,
  revealed,
  complexityRevealed,
  paused,
  onReveal,
  onRevealComplexity,
  onSkip,
  onSaveForLater,
  onGraded,
}: StudyCardProps) {
  const [grade, setGrade] = useState<AnswerResult | null>(null);
  const [redoLater, setRedoLater] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (paused) return;
      // Ignore when typing in an input
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (!revealed) {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          onReveal();
        } else if (e.key === "s") {
          onSkip();
        } else if (e.key === "l") {
          onSaveForLater();
        } else if (e.key === "c") {
          onRevealComplexity();
        }
      } else {
        if (e.key === "1") setGrade("wrong");
        else if (e.key === "2") setGrade("approximate");
        else if (e.key === "3") setGrade("correct");
        else if (e.key === "r") setRedoLater((v) => !v);
        else if ((e.key === "Enter" || e.key === " ") && grade !== null) {
          e.preventDefault();
          onGraded(grade, redoLater);
        }
      }
    },
    [revealed, paused, grade, redoLater, onReveal, onSkip, onSaveForLater, onRevealComplexity, onGraded]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardContent className="flex flex-col items-center gap-6 text-center">
        <p className="text-lg font-medium text-foreground">{card.title}</p>

        {complexityRevealed ? (
          <ComplexityBadge complexity={card.complexity} />
        ) : (
          <Badge
            variant="outline"
            className="cursor-pointer bg-muted/50 text-muted-foreground hover:bg-muted"
            onClick={onRevealComplexity}
          >
            Show Complexity
            <Kbd>C</Kbd>
          </Badge>
        )}

        {!revealed ? (
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={onReveal}>
              Reveal Answer
              <Kbd>Space</Kbd>
            </Button>
            <Button variant="outline" onClick={onSkip}>
              Skip
              <Kbd>S</Kbd>
            </Button>
            <Button variant="secondary" onClick={onSaveForLater}>
              Save For Later
              <Kbd>L</Kbd>
            </Button>
          </div>
        ) : (
          <>
            <div className="w-full rounded-lg bg-muted/50 p-4">
              <p className="text-muted-foreground whitespace-pre-wrap">{card.response}</p>
            </div>

            <div className="flex flex-col items-center gap-4 w-full">
              <div className="flex flex-col gap-1.5 w-full">
                <p className="text-sm text-muted-foreground">How did you do?</p>
                <div className="flex gap-2 justify-center">
                  {GRADES.map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setGrade(g.value)}
                      className={cn(
                        "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                        g.className,
                        grade === g.value && "ring-2 ring-ring ring-offset-2"
                      )}
                    >
                      {g.label}
                      <Kbd className="ml-1">{g.shortcut}</Kbd>
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={redoLater}
                  onChange={(e) => setRedoLater(e.target.checked)}
                  className="rounded"
                />
                Redo Later
                <Kbd>R</Kbd>
              </label>

              <Button
                onClick={() => onGraded(grade!, redoLater)}
                disabled={grade === null}
                className="w-full max-w-xs"
              >
                Next
                <Kbd>Enter</Kbd>
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded border border-current/20 bg-current/10 px-1 font-mono text-[10px] leading-none opacity-60",
        className
      )}
    >
      {children}
    </kbd>
  );
}
