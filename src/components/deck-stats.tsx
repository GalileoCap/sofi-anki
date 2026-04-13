import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card as UiCard,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ComplexityBadge } from "@/components/complexity-badge";
import type { CardDisposition, CardSRS, Deck, RunRecord } from "@/types";
import type { useSRS } from "@/hooks/use-srs";
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

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const RESULT_COLORS: Record<CardDisposition, string> = {
  correct: "text-green-700 dark:text-green-400",
  approximate: "text-yellow-700 dark:text-yellow-400",
  wrong: "text-red-700 dark:text-red-400",
  skip: "text-muted-foreground",
  save_for_later: "text-muted-foreground",
};

interface DeckStatsProps {
  deck: Deck;
  runs: RunRecord[];
  srs: ReturnType<typeof useSRS>;
  onBack: () => void;
}

interface CardStat {
  cardId: string;
  title: string;
  complexity: string;
  timesStudied: number;
  correctCount: number;
  approximateCount: number;
  wrongCount: number;
  totalGraded: number;
  accuracyPct: number;
  avgTimeMs: number;
  srsInfo: CardSRS | undefined;
}

export function DeckStats({ deck, runs, srs, onBack }: DeckStatsProps) {
  const [now] = useState(() => Date.now());

  const sortedRuns = useMemo(
    () => [...runs].sort((a, b) => b.completedAt - a.completedAt),
    [runs]
  );

  const dueCount = srs.getDueCards(deck).length;
  const weakCount = srs.getWeakCards(deck).length;

  const overview = useMemo(() => {
    const totalRuns = runs.length;
    const totalTime = runs.reduce((sum, r) => sum + r.totalTimeMs, 0);
    const totalCards = runs.reduce((sum, r) => sum + r.results.length, 0);
    return { totalRuns, totalTime, totalCards };
  }, [runs]);

  const timing = useMemo(() => {
    if (runs.length === 0) return null;
    const times = runs.map((r) => r.totalTimeMs);
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const fastest = Math.min(...times);
    const slowest = Math.max(...times);

    let totalCardTime = 0;
    let totalCardCount = 0;
    for (const run of runs) {
      for (const result of run.results) {
        for (const attempt of result.attempts) {
          totalCardTime += attempt.durationMs;
          totalCardCount++;
        }
      }
    }
    const avgPerCard = totalCardCount > 0 ? totalCardTime / totalCardCount : 0;
    return { avg, fastest, slowest, avgPerCard };
  }, [runs]);

  const cardStats = useMemo((): CardStat[] => {
    const statsMap = new Map<string, CardStat>();

    // Initialize with all current deck cards
    for (const card of deck.cards) {
      statsMap.set(card.id, {
        cardId: card.id,
        title: card.title,
        complexity: card.complexity,
        timesStudied: 0,
        correctCount: 0,
        approximateCount: 0,
        wrongCount: 0,
        totalGraded: 0,
        accuracyPct: 0,
        avgTimeMs: 0,
        srsInfo: srs.getSRS(deck.id, card.id),
      });
    }

    // Accumulate from runs
    for (const run of runs) {
      for (const result of run.results) {
        let stat = statsMap.get(result.card.id);
        if (!stat) {
          // Card was in a past run but removed from deck
          stat = {
            cardId: result.card.id,
            title: result.card.title,
            complexity: result.card.complexity,
            timesStudied: 0,
            correctCount: 0,
            approximateCount: 0,
            wrongCount: 0,
            totalGraded: 0,
            accuracyPct: 0,
            avgTimeMs: 0,
            srsInfo: srs.getSRS(deck.id, result.card.id),
          };
          statsMap.set(result.card.id, stat);
        }
        stat.timesStudied++;

        let totalTime = 0;
        for (const attempt of result.attempts) {
          totalTime += attempt.durationMs;
          if (attempt.result === "correct") stat.correctCount++;
          else if (attempt.result === "approximate") stat.approximateCount++;
          else if (attempt.result === "wrong") stat.wrongCount++;
          if (attempt.result === "correct" || attempt.result === "approximate" || attempt.result === "wrong") {
            stat.totalGraded++;
          }
        }
        // Running average
        stat.avgTimeMs =
          stat.timesStudied === 1
            ? totalTime
            : stat.avgTimeMs + (totalTime - stat.avgTimeMs) / stat.timesStudied;
      }
    }

    // Compute accuracy
    for (const stat of statsMap.values()) {
      stat.accuracyPct =
        stat.totalGraded > 0
          ? Math.round((stat.correctCount / stat.totalGraded) * 100)
          : -1; // never graded
    }

    return Array.from(statsMap.values()).sort((a, b) => {
      // Never studied first, then by accuracy ascending
      if (a.timesStudied === 0 && b.timesStudied > 0) return -1;
      if (b.timesStudied === 0 && a.timesStudied > 0) return 1;
      if (a.accuracyPct === -1 && b.accuracyPct !== -1) return -1;
      if (b.accuracyPct === -1 && a.accuracyPct !== -1) return 1;
      return a.accuracyPct - b.accuracyPct;
    });
  }, [deck.cards, deck.id, runs, srs]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          Back
        </Button>
        <h1 className="text-2xl font-medium text-foreground">
          {deck.title} — Stats
        </h1>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        <StatCard label="Total Runs" value={String(overview.totalRuns)} />
        <StatCard label="Total Time" value={formatTime(overview.totalTime)} />
        <StatCard label="Cards Studied" value={String(overview.totalCards)} />
        <StatCard label="Due" value={String(dueCount)} />
        <StatCard label="Weak" value={String(weakCount)} />
      </div>

      {/* Timing */}
      {timing && (
        <UiCard size="sm">
          <CardHeader>
            <CardTitle>Timing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
              <div>
                <p className="text-muted-foreground">Avg Run</p>
                <p className="font-mono font-medium">{formatTime(timing.avg)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Fastest</p>
                <p className="font-mono font-medium">{formatTime(timing.fastest)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Slowest</p>
                <p className="font-mono font-medium">{formatTime(timing.slowest)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Avg / Card</p>
                <p className="font-mono font-medium">{formatDuration(timing.avgPerCard)}</p>
              </div>
            </div>
          </CardContent>
        </UiCard>
      )}

      {/* Run History */}
      <UiCard size="sm">
        <CardHeader>
          <CardTitle>Run History</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {sortedRuns.map((run) => (
            <RunRow key={run.id} run={run} />
          ))}
        </CardContent>
      </UiCard>

      {/* Card Performance */}
      <UiCard size="sm">
        <CardHeader>
          <CardTitle>Card Performance</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {cardStats.map((stat) => (
            <div
              key={stat.cardId}
              className={cn(
                "flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-3 py-2 text-sm",
                stat.timesStudied === 0 && "bg-muted/30",
                stat.accuracyPct >= 0 && stat.accuracyPct < 50 && "bg-red-50/50 dark:bg-red-950/20"
              )}
            >
              <span className="flex-1 min-w-0 truncate text-foreground">
                {stat.title}
              </span>
              <ComplexityBadge complexity={stat.complexity as "easy" | "medium" | "hard"} />
              {stat.timesStudied === 0 ? (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  Not studied
                </Badge>
              ) : (
                <>
                  <span className="font-mono text-xs text-muted-foreground">
                    {stat.timesStudied}x
                  </span>
                  <span className={cn(
                    "font-mono text-xs font-medium",
                    stat.accuracyPct >= 80 && "text-green-700 dark:text-green-400",
                    stat.accuracyPct >= 50 && stat.accuracyPct < 80 && "text-yellow-700 dark:text-yellow-400",
                    stat.accuracyPct >= 0 && stat.accuracyPct < 50 && "text-red-700 dark:text-red-400",
                  )}>
                    {stat.accuracyPct >= 0 ? `${stat.accuracyPct}%` : "—"}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    ~{formatDuration(stat.avgTimeMs)}
                  </span>
                  <SRSBadge srsInfo={stat.srsInfo} now={now} />
                </>
              )}
            </div>
          ))}
        </CardContent>
      </UiCard>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <UiCard size="sm">
      <CardContent className="text-center">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 font-mono text-xl font-medium text-foreground">{value}</p>
      </CardContent>
    </UiCard>
  );
}

function RunRow({ run }: { run: RunRecord }) {
  const [expanded, setExpanded] = useState(false);

  const counts = useMemo(() => {
    const c: Record<CardDisposition, number> = {
      correct: 0,
      approximate: 0,
      wrong: 0,
      skip: 0,
      save_for_later: 0,
    };
    for (const r of run.results) {
      const first = r.attempts[0]?.result;
      if (first) c[first]++;
    }
    return c;
  }, [run.results]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted/50"
      >
        <span className="shrink-0 text-muted-foreground">
          {formatDate(run.completedAt)}
        </span>
        <span className="font-mono text-xs text-muted-foreground">
          {formatTime(run.totalTimeMs)}
        </span>
        <span className="flex-1" />
        <span className="flex items-center gap-2 text-xs">
          {counts.correct > 0 && (
            <span className={RESULT_COLORS.correct}>{counts.correct} correct</span>
          )}
          {counts.approximate > 0 && (
            <span className={RESULT_COLORS.approximate}>{counts.approximate} approx</span>
          )}
          {counts.wrong > 0 && (
            <span className={RESULT_COLORS.wrong}>{counts.wrong} wrong</span>
          )}
          {counts.skip > 0 && (
            <span className={RESULT_COLORS.skip}>{counts.skip} skipped</span>
          )}
        </span>
      </button>

      {expanded && (
        <>
          <Separator className="my-1" />
          <div className="ml-3 flex flex-col gap-0.5 border-l-2 border-muted pl-3 pb-2">
            {run.results.map((r) => (
              <div
                key={r.card.id}
                className="flex items-center gap-2 rounded-md px-2 py-1 text-xs"
              >
                <span className="flex-1 truncate text-foreground">
                  {r.card.title}
                </span>
                <ComplexityBadge complexity={r.card.complexity} />
                {r.attempts.map((a, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className={cn("text-xs", RESULT_BADGE_STYLES[a.result])}
                  >
                    {RESULT_SHORT[a.result]}
                  </Badge>
                ))}
                <span className="font-mono text-muted-foreground">
                  {formatDuration(r.attempts[0].durationMs)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const RESULT_BADGE_STYLES: Record<CardDisposition, string> = {
  correct: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  approximate: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  wrong: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  skip: "bg-muted text-muted-foreground",
  save_for_later: "bg-muted text-muted-foreground",
};

const RESULT_SHORT: Record<CardDisposition, string> = {
  correct: "OK",
  approximate: "~",
  wrong: "X",
  skip: "Skip",
  save_for_later: "Later",
};

function SRSBadge({ srsInfo, now }: { srsInfo: CardSRS | undefined; now: number }) {
  if (!srsInfo) {
    return (
      <Badge variant="outline" className="text-xs text-muted-foreground">
        New
      </Badge>
    );
  }

  const isDue = srsInfo.dueAt <= now;

  if (isDue) {
    return (
      <Badge variant="outline" className="text-xs text-yellow-700 dark:text-yellow-400">
        Due now
      </Badge>
    );
  }

  const daysUntil = Math.ceil((srsInfo.dueAt - now) / 86_400_000);
  return (
    <Badge variant="outline" className="text-xs text-muted-foreground">
      {daysUntil}d
    </Badge>
  );
}
