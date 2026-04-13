import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ComplexityBadge } from "@/components/complexity-badge";
import type { AnswerResult, Card as CardType } from "@/types";
import { cn } from "@/lib/utils";

const GRADES: { value: AnswerResult; label: string; className: string }[] = [
  { value: "wrong", label: "Wrong", className: "border-red-300 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900" },
  { value: "approximate", label: "Approximate", className: "border-yellow-300 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-400 dark:hover:bg-yellow-900" },
  { value: "correct", label: "Correct", className: "border-green-300 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-800 dark:bg-green-950 dark:text-green-400 dark:hover:bg-green-900" },
];

interface StudyCardProps {
  card: CardType;
  revealed: boolean;
  complexityRevealed: boolean;
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
  onReveal,
  onRevealComplexity,
  onSkip,
  onSaveForLater,
  onGraded,
}: StudyCardProps) {
  const [grade, setGrade] = useState<AnswerResult | null>(null);
  const [redoLater, setRedoLater] = useState(false);

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardContent className="flex flex-col items-center gap-6 text-center">
        <p className="text-lg font-medium text-foreground">{card.title}</p>

        {complexityRevealed && (
          <ComplexityBadge complexity={card.complexity} />
        )}

        {!revealed ? (
          <div className="flex flex-col items-center gap-3">
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={onReveal}>Reveal Answer</Button>
              <Button variant="outline" onClick={onSkip}>
                Skip
              </Button>
              <Button variant="secondary" onClick={onSaveForLater}>
                Save For Later
              </Button>
            </div>
            {!complexityRevealed && (
              <Button variant="ghost" size="sm" onClick={onRevealComplexity}>
                Reveal Complexity
              </Button>
            )}
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
              </label>

              <Button
                onClick={() => onGraded(grade!, redoLater)}
                disabled={grade === null}
                className="w-full max-w-xs"
              >
                Next
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
