import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card as UiCard,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StudyHeatmap } from "@/components/study-heatmap";
import type { Deck, RunRecord } from "@/types";
import type { useSRS } from "@/hooks/use-srs";
import { cn } from "@/lib/utils";

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function computeStreak(runs: RunRecord[]): number {
  if (runs.length === 0) return 0;
  const now = new Date();
  const studyDays = new Set(runs.map((r) => dateKey(new Date(r.completedAt))));
  const today = dateKey(now);
  let streak = 0;
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!studyDays.has(today)) {
    cursor.setDate(cursor.getDate() - 1);
    if (!studyDays.has(dateKey(cursor))) return 0;
  }
  while (studyDays.has(dateKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

interface GlobalStatsProps {
  decks: Deck[];
  allRuns: RunRecord[];
  srs: ReturnType<typeof useSRS>;
  onBack: () => void;
  onSelectDeck: (id: string) => void;
}

export function GlobalStats({ decks, allRuns, srs, onBack, onSelectDeck }: GlobalStatsProps) {
  const [now] = useState(() => Date.now());

  const totals = useMemo(() => {
    const totalCards = decks.reduce((s, d) => s + d.cards.length, 0);
    const totalTime = allRuns.reduce((s, r) => s + r.totalTimeMs, 0);
    const totalCardAttempts = allRuns.reduce(
      (s, r) => s + r.results.reduce((s2, res) => s2 + res.attempts.length, 0),
      0
    );
    return {
      decks: decks.length,
      cards: totalCards,
      runs: allRuns.length,
      totalTime,
      totalCardAttempts,
      streak: computeStreak(allRuns),
    };
  }, [decks, allRuns]);

  // Global accuracy across all runs
  const globalAccuracy = useMemo(() => {
    let correct = 0, total = 0;
    for (const run of allRuns) {
      for (const result of run.results) {
        for (const attempt of result.attempts) {
          if (attempt.result === "correct" || attempt.result === "approximate" || attempt.result === "wrong") {
            if (attempt.result === "correct") correct++;
            total++;
          }
        }
      }
    }
    return total > 0 ? Math.round((correct / total) * 100) : null;
  }, [allRuns]);

  // Per-deck summary
  const deckRows = useMemo(() => {
    const runsByDeck = new Map<string, RunRecord[]>();
    for (const run of allRuns) {
      const existing = runsByDeck.get(run.deckId) ?? [];
      existing.push(run);
      runsByDeck.set(run.deckId, existing);
    }

    return decks.map((deck) => {
      const deckRuns = runsByDeck.get(deck.id) ?? [];
      const lastRun = deckRuns.length > 0
        ? Math.max(...deckRuns.map((r) => r.completedAt))
        : null;

      let correct = 0, total = 0;
      for (const run of deckRuns) {
        for (const result of run.results) {
          for (const attempt of result.attempts) {
            if (attempt.result === "correct" || attempt.result === "approximate" || attempt.result === "wrong") {
              if (attempt.result === "correct") correct++;
              total++;
            }
          }
        }
      }
      const accuracy = total > 0 ? Math.round((correct / total) * 100) : null;
      const dueCount = srs.getDueCards(deck).length;

      return { deck, runs: deckRuns.length, lastRun, accuracy, dueCount };
    }).sort((a, b) => {
      // Sort: decks with due cards first, then by last run descending
      if (a.dueCount > 0 && b.dueCount === 0) return -1;
      if (b.dueCount > 0 && a.dueCount === 0) return 1;
      if (a.lastRun === null && b.lastRun !== null) return 1;
      if (b.lastRun === null && a.lastRun !== null) return -1;
      if (a.lastRun !== null && b.lastRun !== null) return b.lastRun - a.lastRun;
      return 0;
    });
  }, [decks, allRuns, srs]);

  // Accuracy trend (last 20 runs across all decks, newest first)
  const sortedRuns = useMemo(
    () => [...allRuns].sort((a, b) => b.completedAt - a.completedAt),
    [allRuns]
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          Back
        </Button>
        <h1 className="text-2xl font-medium text-foreground">Overall Stats</h1>
      </div>

      {/* Top-line numbers */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Decks" value={String(totals.decks)} />
        <StatTile label="Cards" value={String(totals.cards)} />
        <StatTile label="Sessions" value={String(totals.runs)} />
        <StatTile label="Total Time" value={totals.totalTime > 0 ? formatTime(totals.totalTime) : "—"} />
        <StatTile
          label="Accuracy"
          value={globalAccuracy !== null ? `${globalAccuracy}%` : "—"}
          valueClass={
            globalAccuracy === null ? undefined
            : globalAccuracy >= 80 ? "text-green-700 dark:text-green-400"
            : globalAccuracy >= 50 ? "text-yellow-700 dark:text-yellow-400"
            : "text-red-700 dark:text-red-400"
          }
        />
        <StatTile
          label="Streak"
          value={totals.streak > 0 ? `${totals.streak}d` : "—"}
          valueClass={totals.streak >= 7 ? "text-green-700 dark:text-green-400" : undefined}
        />
      </div>

      {/* Heatmap + trend */}
      {allRuns.length > 0 && (
        <div className={cn("grid gap-3", sortedRuns.length > 1 ? "grid-cols-1 lg:grid-cols-[1fr_auto]" : "grid-cols-1")}>
          <UiCard size="sm">
            <CardHeader>
              <CardTitle>Study Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <StudyHeatmap runs={allRuns} />
            </CardContent>
          </UiCard>

          {sortedRuns.length > 1 && (
            <UiCard size="sm" className="lg:w-64">
              <CardHeader>
                <CardTitle>Accuracy Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <GlobalAccuracyTrend runs={sortedRuns} />
              </CardContent>
            </UiCard>
          )}
        </div>
      )}

      {/* Per-deck table */}
      <UiCard size="sm">
        <CardHeader>
          <CardTitle>Decks</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-0.5">
          {deckRows.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No decks yet.</p>
          ) : (
            deckRows.map(({ deck, runs, lastRun, accuracy, dueCount }) => (
              <button
                key={deck.id}
                type="button"
                onClick={() => onSelectDeck(deck.id)}
                className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-3 py-2 text-sm text-left transition-colors hover:bg-muted/50"
              >
                <span className="flex-1 min-w-0 truncate font-medium text-foreground">
                  {deck.title}
                </span>
                <span className="flex items-center gap-2 shrink-0 text-xs text-muted-foreground">
                  {deck.cards.length} cards
                </span>
                {dueCount > 0 && (
                  <Badge variant="outline" className="text-xs text-yellow-700 dark:text-yellow-400 shrink-0">
                    {dueCount} due
                  </Badge>
                )}
                {accuracy !== null && (
                  <span className={cn(
                    "font-mono text-xs font-medium shrink-0",
                    accuracy >= 80 ? "text-green-700 dark:text-green-400"
                    : accuracy >= 50 ? "text-yellow-700 dark:text-yellow-400"
                    : "text-red-700 dark:text-red-400"
                  )}>
                    {accuracy}%
                  </span>
                )}
                <span className="shrink-0 text-xs text-muted-foreground">
                  {runs === 0 ? "Never studied"
                    : lastRun !== null ? relativeDate(lastRun, now)
                    : `${runs} run${runs !== 1 ? "s" : ""}`}
                </span>
              </button>
            ))
          )}
        </CardContent>
      </UiCard>
    </div>
  );
}

function relativeDate(ts: number, now: number): string {
  const diffMs = now - ts;
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function StatTile({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <UiCard size="sm">
      <CardContent className="text-center">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={cn("mt-1 font-mono text-xl font-medium", valueClass ?? "text-foreground")}>{value}</p>
      </CardContent>
    </UiCard>
  );
}

function GlobalAccuracyTrend({ runs }: { runs: RunRecord[] }) {
  const display = runs.slice(0, 20).reverse();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end gap-1" style={{ height: 80 }}>
        {display.map((run) => {
          let correct = 0, approximate = 0, wrong = 0, other = 0;
          for (const r of run.results) {
            const first = r.attempts[0]?.result;
            if (first === "correct") correct++;
            else if (first === "approximate") approximate++;
            else if (first === "wrong") wrong++;
            else other++;
          }
          const total = correct + approximate + wrong + other;
          if (total === 0) return null;
          const cPct = (correct / total) * 100;
          const aPct = (approximate / total) * 100;
          const wPct = (wrong / total) * 100;
          const oPct = (other / total) * 100;
          return (
            <div
              key={run.id}
              className="flex flex-1 flex-col overflow-hidden rounded-sm"
              style={{ height: "100%" }}
              title={`${new Date(run.completedAt).toLocaleDateString()}: ${correct} correct, ${approximate} approx, ${wrong} wrong`}
            >
              {oPct > 0 && <div className="bg-muted" style={{ height: `${oPct}%` }} />}
              {wPct > 0 && <div className="bg-red-400 dark:bg-red-600" style={{ height: `${wPct}%` }} />}
              {aPct > 0 && <div className="bg-yellow-400 dark:bg-yellow-600" style={{ height: `${aPct}%` }} />}
              {cPct > 0 && <div className="bg-green-400 dark:bg-green-600" style={{ height: `${cPct}%` }} />}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-green-400 dark:bg-green-600" /> Correct</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-yellow-400 dark:bg-yellow-600" /> Approx</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-red-400 dark:bg-red-600" /> Wrong</span>
      </div>
    </div>
  );
}
