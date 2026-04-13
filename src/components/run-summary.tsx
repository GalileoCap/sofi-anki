import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ComplexityBadge } from "@/components/complexity-badge";
import { Confetti } from "@/components/confetti";
import type { CardAttempt, CardDisposition, CardRunResult } from "@/types";
import { cn } from "@/lib/utils";

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return "<1s";
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder > 0 ? `${minutes}m ${remainder}s` : `${minutes}m`;
}

const CATEGORIES: {
  key: CardDisposition;
  label: string;
  className: string;
}[] = [
  { key: "correct", label: "Correct", className: "text-green-700 dark:text-green-400" },
  { key: "approximate", label: "Approximate", className: "text-yellow-700 dark:text-yellow-400" },
  { key: "wrong", label: "Wrong", className: "text-red-700 dark:text-red-400" },
  { key: "skip", label: "Skipped", className: "text-muted-foreground" },
  { key: "save_for_later", label: "Saved For Later", className: "text-muted-foreground" },
];

const RESULT_BADGE_STYLES: Record<CardDisposition, string> = {
  correct: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  approximate: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  wrong: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  skip: "bg-muted text-muted-foreground",
  save_for_later: "bg-muted text-muted-foreground",
};

const RESULT_LABELS: Record<CardDisposition, string> = {
  correct: "Correct",
  approximate: "Approximate",
  wrong: "Wrong",
  skip: "Skipped",
  save_for_later: "Saved",
};

interface RunSummaryProps {
  results: CardRunResult[];
  totalTimeMs: number;
  onRestart: () => void;
  onExit: () => void;
}

export function RunSummary({ results, totalTimeMs, onRestart, onExit }: RunSummaryProps) {
  const [expandedCategory, setExpandedCategory] = useState<CardDisposition | null>(null);

  const isPerfect = useMemo(() => {
    if (results.length === 0) return false;
    return results.every((r) => r.attempts[0]?.result === "correct");
  }, [results]);

  // Group by first attempt result
  const byFirstAttempt = new Map<CardDisposition, CardRunResult[]>();
  for (const r of results) {
    const firstResult = r.attempts[0]?.result ?? "skip";
    const list = byFirstAttempt.get(firstResult) ?? [];
    list.push(r);
    byFirstAttempt.set(firstResult, list);
  }

  return (
    <div className="relative flex flex-col items-center gap-6 py-8">
      {isPerfect && <Confetti />}
      <div className="text-center">
        <h2 className="text-2xl font-medium text-foreground">
          {isPerfect ? "Perfect Run!" : "Run Complete!"}
        </h2>
        <p className="mt-2 font-mono text-lg text-muted-foreground">
          {formatTime(totalTimeMs)}
        </p>
      </div>

      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>First Attempt Results</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {CATEGORIES.map((cat) => {
            const items = byFirstAttempt.get(cat.key) ?? [];
            if (items.length === 0) return null;
            const isExpanded = expandedCategory === cat.key;
            return (
              <div key={cat.key}>
                <button
                  type="button"
                  onClick={() => setExpandedCategory(isExpanded ? null : cat.key)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted/50"
                >
                  <span className={cn("font-medium", cat.className)}>
                    {cat.label}
                  </span>
                  <span className="font-mono text-muted-foreground">
                    {items.length}
                  </span>
                </button>

                {isExpanded && (
                  <div className="ml-3 flex flex-col gap-1 border-l-2 border-muted pl-3 pb-2">
                    {items.map((r) => (
                      <CardResultRow key={r.card.id} result={r} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={onRestart}>Restart</Button>
        <Button variant="outline" onClick={onExit}>
          Back to Deck
        </Button>
      </div>
    </div>
  );
}

function CardResultRow({ result }: { result: CardRunResult }) {
  const [expanded, setExpanded] = useState(false);
  const hasRetries = result.attempts.length > 1;
  const isChoice = result.card.type === "choice";

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => (hasRetries || isChoice) && setExpanded((v) => !v)}
        className={cn(
          "flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm",
          (hasRetries || isChoice) && "cursor-pointer hover:bg-muted/50"
        )}
      >
        <span className="flex-1 truncate text-foreground">{result.card.title}</span>
        <ComplexityBadge complexity={result.card.complexity} />
        {result.card.type === "choice" && (
          <Badge variant="outline" className="shrink-0 text-xs">
            {result.card.multiSelect ? "Multi" : "Single"}
          </Badge>
        )}
        <span className="shrink-0 font-mono text-xs text-muted-foreground">
          {formatDuration(result.attempts[0].durationMs)}
        </span>
        {hasRetries && (
          <Badge variant="outline" className="shrink-0 text-xs">
            {result.attempts.length} tries
          </Badge>
        )}
      </button>

      {expanded && (
        <div className="ml-4 flex flex-col gap-1.5 pb-1">
          {/* Show choice details for choice cards */}
          {isChoice && (
            <ChoiceAttemptDetail card={result.card} attempt={result.attempts[0]} />
          )}

          {/* Show retry history */}
          {hasRetries && (
            <div className="flex flex-col gap-0.5">
              {result.attempts.map((attempt, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 px-2 py-1 text-xs">
                    <span className="text-muted-foreground">#{i + 1}</span>
                    <Badge variant="outline" className={cn("text-xs", RESULT_BADGE_STYLES[attempt.result])}>
                      {RESULT_LABELS[attempt.result]}
                    </Badge>
                    <span className="font-mono text-muted-foreground">
                      {formatDuration(attempt.durationMs)}
                    </span>
                  </div>
                  {isChoice && i > 0 && attempt.selectedOptionIds && (
                    <ChoiceAttemptDetail card={result.card} attempt={attempt} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ChoiceAttemptDetail({ card, attempt }: { card: CardRunResult["card"]; attempt: CardAttempt }) {
  if (card.type !== "choice" || !attempt.selectedOptionIds) return null;
  const selectedSet = new Set(attempt.selectedOptionIds);

  return (
    <div className="ml-2 flex flex-col gap-0.5 text-xs">
      {(card.options ?? []).map((opt) => {
        const wasSelected = selectedSet.has(opt.id);
        return (
          <div key={opt.id} className="flex items-center gap-1.5 px-2 py-0.5">
            <span className={cn(
              "shrink-0",
              opt.correct && wasSelected && "text-green-600 dark:text-green-400",
              !opt.correct && wasSelected && "text-red-600 dark:text-red-400",
              opt.correct && !wasSelected && "text-yellow-600 dark:text-yellow-400",
              !opt.correct && !wasSelected && "text-muted-foreground/50",
            )}>
              {wasSelected ? (opt.correct ? "\u2713" : "\u2717") : (opt.correct ? "\u25CB" : "\u00B7")}
            </span>
            <span className={cn(
              wasSelected ? "text-foreground" : "text-muted-foreground/60",
              opt.correct && "font-medium",
            )}>
              {opt.text}
            </span>
            {opt.correct && !wasSelected && (
              <span className="text-yellow-600 dark:text-yellow-400">(missed)</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
