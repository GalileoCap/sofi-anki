import { useState } from "react";

import { ActivityCards } from "@/components/activity-cards";
import { ComplexityBadge } from "@/components/complexity-badge";
import { DispositionBadge } from "@/components/disposition-badge";
import { ScreenHeader } from "@/components/screen-header";
import { StatTile } from "@/components/stat-tile";
import { Badge } from "@/components/ui/badge";
import { CardContent, CardHeader, CardTitle, Card as UiCard } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/language-context";
import type { CardSchedule, Deck, Millis, RunRecord, Store } from "@/core/model";
import { deckSchedules, dueCards, indexSchedules, weakCards } from "@/core/scheduler";
import { type CardStat, cardStats, cardTimeline, daysUntil, firstTries, newestFirst, timing, totals } from "@/core/stats";
import { clockFace, longClockFace, shortDuration } from "@/core/time";
import { accuracyLook, looks } from "@/lib/ui-looks";
import { cn } from "@/lib/utils";

const tableRow = "flex w-full items-center rounded-lg px-3 py-2 text-sm";
const nested = "border-l-2 border-muted pb-2";

type DeckStatsPageProps = {
  deck: Deck;
  store: Store;
  /** When the screen opened, which due cards count from. */
  now: Millis;
  onBack: () => void;
};

/** One deck's study: totals, timing, the heatmap and trend, each run, and each card. */
export function DeckStatsPage({ deck, store, now, onBack }: DeckStatsPageProps) {
  const { t } = useLanguage();
  const runs = newestFirst(store.runs.filter((run) => run.deckId === deck.id));
  const schedules = indexSchedules(store.schedules);
  const spent = totals(runs);
  const times = timing(runs);

  return (
    <div className={looks.sections}>
      <ScreenHeader onBack={onBack}>
        {deck.title} <span className="text-muted-foreground">· {t("common.stats")}</span>
      </ScreenHeader>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        <StatTile label={t("deckStats.totalRuns")} value={String(runs.length)} />
        <StatTile label={t("deckStats.totalTime")} value={longClockFace(spent.timeMs)} />
        <StatTile label={t("deckStats.cardsStudied")} value={String(spent.cards)} />
        <StatTile label={t("common.due")} value={String(dueCards(deck, schedules, now).length)} />
        <StatTile label={t("common.weak")} value={String(weakCards(deck, schedules).length)} />
      </div>

      {times && (
        <UiCard size="sm">
          <CardHeader>
            <CardTitle>{t("deckStats.timing")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
              {[
                [t("deckStats.avgRun"), clockFace(times.average)],
                [t("deckStats.fastest"), clockFace(times.fastest)],
                [t("deckStats.slowest"), clockFace(times.slowest)],
                [t("deckStats.avgPerCard"), shortDuration(times.perCard)],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-muted-foreground">{label}</p>
                  <p className={looks.value}>{value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </UiCard>
      )}

      <ActivityCards runs={runs} now={now} />

      <UiCard size="sm">
        <CardHeader>
          <CardTitle>{t("deckStats.runHistory")}</CardTitle>
        </CardHeader>
        <CardContent className={looks.lines}>
          {runs.map((run) => (
            <RunLine key={run.id} run={run} />
          ))}
        </CardContent>
      </UiCard>

      <UiCard size="sm">
        <CardHeader>
          <CardTitle>{t("deckStats.cardPerformance")}</CardTitle>
        </CardHeader>
        <CardContent className={looks.lines}>
          {cardStats(deck, runs, deckSchedules(schedules, deck.id)).map((stat) => (
            <CardLine key={stat.cardId} stat={stat} runs={runs} now={now} />
          ))}
        </CardContent>
      </UiCard>
    </div>
  );
}

/** A run: when, how long, how its cards went the first time, opening to each card's tries. */
function RunLine({ run }: { run: RunRecord }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const counts = firstTries(run);
  const parts = [
    { n: counts.correct, label: t("common.correct"), className: looks.positive },
    { n: counts.approximate, label: t("deckStats.approx"), className: looks.caution },
    { n: counts.wrong, label: t("common.wrong"), className: looks.negative },
    { n: counts.skip, label: t("common.skipped"), className: "text-muted-foreground" },
  ];

  return (
    <div>
      <button type="button" onClick={() => setOpen(!open)} className={cn(tableRow, "gap-3 transition-colors hover:bg-muted/50")}>
        <span className={looks.aside}>
          {new Date(run.completedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
        </span>
        <span className={looks.fineFigure}>{clockFace(run.totalTimeMs)}</span>
        <span className="flex-1" />
        <span className={looks.smallRow}>
          {parts.map(
            (part) =>
              part.n > 0 && (
                <span key={part.label} className={part.className}>
                  {part.n} {part.label.toLowerCase()}
                </span>
              ),
          )}
        </span>
      </button>

      {open && (
        <>
          <Separator className="my-1" />
          <div className={cn(nested, "ml-3 flex flex-col gap-0.5 pl-3")}>
            {run.results.map((result) => (
              <div key={result.card.id} className="flex flex-wrap items-center gap-2 rounded-md px-2 py-1 text-xs">
                <span className={looks.lineTitle}>{result.card.title}</span>
                <ComplexityBadge complexity={result.card.complexity} />
                {result.attempts.map((attempt, i) => (
                  <DispositionBadge key={i} disposition={attempt.result} />
                ))}
                <span className={looks.figure}>{shortDuration(result.attempts[0].durationMs)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/** A card: how often it was studied, its accuracy and time, when it is due, opening to its history. */
function CardLine({ stat, runs, now }: { stat: CardStat; runs: readonly RunRecord[]; now: Millis }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const studied = stat.timesStudied > 0;
  const poor = stat.accuracy !== null && stat.accuracy < 50;
  const history = open ? cardTimeline(stat.cardId, runs) : [];

  return (
    <div>
      <button
        type="button"
        onClick={() => studied && setOpen(!open)}
        className={cn(
          tableRow,
          "flex-wrap gap-x-3 gap-y-1",
          !studied && "bg-muted/30",
          poor && "bg-red-50/50 dark:bg-red-950/20",
          studied && looks.clickable,
        )}
      >
        <span className="min-w-0 flex-1 truncate text-left text-foreground">{stat.title}</span>
        <ComplexityBadge complexity={stat.complexity} />
        {studied ? (
          <>
            <span className={looks.fineFigure}>{stat.timesStudied}x</span>
            <span className={cn("font-mono text-xs font-medium", stat.accuracy !== null && accuracyLook(stat.accuracy))}>
              {stat.accuracy !== null ? `${stat.accuracy}%` : "–"}
            </span>
            <span className={looks.fineFigure}>~{shortDuration(stat.averageMs)}</span>
            <DueBadge schedule={stat.schedule} now={now} />
          </>
        ) : (
          <Badge variant="outline" className={looks.fine}>
            {t("deckStats.notStudied")}
          </Badge>
        )}
      </button>

      {history.length > 0 && (
        <div className={cn(nested, "ml-6 pt-1 pl-3")}>
          <div className={looks.lines}>
            {history.map((entry, i) => {
              const before = history[i - 1]?.intervalAfter;
              return (
                <div key={i} className={looks.smallRow}>
                  <span className={looks.aside}>
                    {new Date(entry.at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                  <DispositionBadge disposition={entry.result} />
                  <span className={looks.figure}>
                    {entry.intervalAfter === 0 ? t("deckStats.dueNow") : `${entry.intervalAfter}d`}
                  </span>
                  {before !== undefined && (
                    <span className="text-muted-foreground/50">
                      {entry.intervalAfter > before ? "↑" : entry.intervalAfter < before ? "↓" : "→"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/** When a card comes up next: new, due now, or in so many days. */
function DueBadge({ schedule, now }: { schedule: CardSchedule | undefined; now: Millis }) {
  const { t } = useLanguage();
  const days = schedule && daysUntil(schedule.dueAt, now);
  return (
    <Badge variant="outline" className={cn("text-xs", days !== undefined && days <= 0 ? looks.caution : "text-muted-foreground")}>
      {days === undefined ? t("deckStats.new") : days <= 0 ? t("deckStats.dueNow") : `${days}d`}
    </Badge>
  );
}
