import { useState } from "react";

import { ComplexityBadge } from "@/components/complexity-badge";
import { Confetti } from "@/components/confetti";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle, Card as UiCard } from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";
import type { CardAttempt, CardDisposition, CardRunResult } from "@/core/model";
import { byFirstTry, isPerfect } from "@/core/run";
import { clockFace, shortDuration } from "@/core/time";
import type { TranslationKey } from "@/lib/translations";
import { cn } from "@/lib/utils";

const groups: { disposition: CardDisposition; label: TranslationKey; className: string }[] = [
  { disposition: "correct", label: "common.correct", className: "text-green-700 dark:text-green-400" },
  { disposition: "approximate", label: "common.approximate", className: "text-yellow-700 dark:text-yellow-400" },
  { disposition: "wrong", label: "common.wrong", className: "text-red-700 dark:text-red-400" },
  { disposition: "skip", label: "common.skipped", className: "text-muted-foreground" },
  { disposition: "save_for_later", label: "runSummary.savedForLater", className: "text-muted-foreground" },
];

const attemptLooks: Record<CardDisposition, { label: TranslationKey; className: string }> = {
  correct: { label: "common.correct", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  approximate: { label: "common.approximate", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  wrong: { label: "common.wrong", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  skip: { label: "common.skipped", className: "bg-muted text-muted-foreground" },
  save_for_later: { label: "common.saved", className: "bg-muted text-muted-foreground" },
};

type RunSummaryProps = {
  results: readonly CardRunResult[];
  totalTimeMs: number;
  onRestart: () => void;
  onExit: () => void;
};

/** How a run went: its time, and its cards grouped by how each went the first time. */
export function RunSummary({ results, totalTimeMs, onRestart, onExit }: RunSummaryProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState<CardDisposition | null>(null);
  const grouped = byFirstTry(results);
  const perfect = isPerfect(results);

  return (
    <div className="relative flex flex-col items-center gap-6 py-8">
      {perfect && <Confetti />}
      <div className="text-center">
        <h2 className="text-2xl font-medium text-foreground">{perfect ? t("runSummary.perfectRun") : t("runSummary.runComplete")}</h2>
        <p className="mt-2 font-mono text-lg text-muted-foreground">{clockFace(totalTimeMs)}</p>
      </div>

      <UiCard className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>{t("runSummary.firstAttemptResults")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {groups.map(({ disposition, label, className }) => {
            const items = grouped.get(disposition) ?? [];
            if (items.length === 0) return null;
            return (
              <div key={disposition}>
                <button
                  type="button"
                  onClick={() => setOpen(open === disposition ? null : disposition)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted/50"
                >
                  <span className={cn("font-medium", className)}>{t(label)}</span>
                  <span className="font-mono text-muted-foreground">{items.length}</span>
                </button>
                {open === disposition && (
                  <div className="ml-3 flex flex-col gap-1 border-l-2 border-muted pb-2 pl-3">
                    {items.map((result) => (
                      <ResultRow key={result.card.id} result={result} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </UiCard>

      <div className="flex gap-3">
        <Button onClick={onRestart}>{t("common.restart")}</Button>
        <Button variant="outline" onClick={onExit}>
          {t("runSummary.backToDeck")}
        </Button>
      </div>
    </div>
  );
}

/** A card of the run, opening to its tries and, for a choice card, what was picked. */
function ResultRow({ result }: { result: CardRunResult }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const { card, attempts } = result;
  const retried = attempts.length > 1;
  const opens = retried || card.type === "choice";

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => opens && setOpen(!open)}
        className={cn("flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm", opens && "cursor-pointer hover:bg-muted/50")}
      >
        <span className="flex-1 truncate text-foreground">{card.title}</span>
        <ComplexityBadge complexity={card.complexity} />
        {card.type === "choice" && (
          <Badge variant="outline" className="shrink-0 text-xs">
            {card.multiSelect ? t("deckDetail.multi") : t("deckDetail.single")}
          </Badge>
        )}
        <span className="shrink-0 font-mono text-xs text-muted-foreground">{shortDuration(attempts[0].durationMs)}</span>
        {retried && (
          <Badge variant="outline" className="shrink-0 text-xs">
            {attempts.length}
            {t("runSummary.tries")}
          </Badge>
        )}
      </button>

      {open && (
        <div className="ml-4 flex flex-col gap-1.5 pb-1">
          {card.type === "choice" && <Picked card={card} attempt={attempts[0]} />}
          {retried && (
            <div className="flex flex-col gap-0.5">
              {attempts.map((attempt, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 px-2 py-1 text-xs">
                    <span className="text-muted-foreground">#{i + 1}</span>
                    <Badge variant="outline" className={cn("text-xs", attemptLooks[attempt.result].className)}>
                      {t(attemptLooks[attempt.result].label)}
                    </Badge>
                    <span className="font-mono text-muted-foreground">{shortDuration(attempt.durationMs)}</span>
                  </div>
                  {card.type === "choice" && i > 0 && <Picked card={card} attempt={attempt} />}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** A choice card's options against what one try picked: hits, wrong picks and misses. */
function Picked({ card, attempt }: { card: Extract<CardRunResult["card"], { type: "choice" }>; attempt: CardAttempt }) {
  const { t } = useLanguage();
  if (!attempt.selectedOptionIds) return null;
  const picked = new Set(attempt.selectedOptionIds);

  return (
    <div className="ml-2 flex flex-col gap-0.5 text-xs">
      {card.options.map((option) => {
        const chosen = picked.has(option.id);
        return (
          <div key={option.id} className="flex items-center gap-1.5 px-2 py-0.5">
            <span
              className={cn(
                "shrink-0",
                option.correct && chosen && "text-green-600 dark:text-green-400",
                !option.correct && chosen && "text-red-600 dark:text-red-400",
                option.correct && !chosen && "text-yellow-600 dark:text-yellow-400",
                !option.correct && !chosen && "text-muted-foreground/50",
              )}
            >
              {chosen ? (option.correct ? "✓" : "✗") : option.correct ? "○" : "·"}
            </span>
            <span className={cn(chosen ? "text-foreground" : "text-muted-foreground/60", option.correct && "font-medium")}>
              {option.text}
            </span>
            {option.correct && !chosen && <span className="text-yellow-600 dark:text-yellow-400">{t("runSummary.missed")}</span>}
          </div>
        );
      })}
    </div>
  );
}
