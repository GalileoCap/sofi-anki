import { AccuracyTrend } from "@/components/accuracy-trend";
import { StatTile } from "@/components/stat-tile";
import { StudyHeatmap } from "@/components/study-heatmap";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle, Card as UiCard } from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";
import type { Millis, Store } from "@/core/model";
import { indexSchedules } from "@/core/scheduler";
import { type DeckRow, accuracy, daysSince, deckRows, newestFirst, streak, totals } from "@/core/stats";
import { longClockFace } from "@/core/time";
import { accuracyLook, looks } from "@/lib/looks";
import { cn } from "@/lib/utils";

/** A week of a streak, the length that shows in green. */
const GOOD_STREAK = 7;

type StatsPageProps = {
  store: Store;
  /** When the screen opened, which the streak, due cards and dates count from. */
  now: Millis;
  onBack: () => void;
  onOpenDeck: (id: string) => void;
};

/** Every deck's study at once: totals, the streak, the heatmap and trend, and a row per deck. */
export function StatsPage({ store, now, onBack, onOpenDeck }: StatsPageProps) {
  const { t } = useLanguage();
  const { decks, runs } = store;
  const spent = totals(runs);
  const correct = accuracy(runs);
  const days = streak(runs, now);
  const rows = deckRows(decks, runs, indexSchedules(store.schedules), now);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          {t("common.back")}
        </Button>
        <h1 className={looks.title}>{t("globalStats.title")}</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label={t("globalStats.decks")} value={String(decks.length)} />
        <StatTile label={t("globalStats.cards")} value={String(decks.reduce((sum, deck) => sum + deck.cards.length, 0))} />
        <StatTile label={t("globalStats.sessions")} value={String(runs.length)} />
        <StatTile label={t("globalStats.totalTime")} value={spent.timeMs > 0 ? longClockFace(spent.timeMs) : "–"} />
        <StatTile
          label={t("globalStats.accuracy")}
          value={correct !== null ? `${correct}%` : "–"}
          className={correct !== null ? accuracyLook(correct) : undefined}
        />
        <StatTile
          label={t("globalStats.streak")}
          value={days > 0 ? `${days}d` : "–"}
          className={days >= GOOD_STREAK ? looks.positive : undefined}
        />
      </div>

      {runs.length > 0 && (
        <div className={cn("grid gap-3", runs.length > 1 ? "grid-cols-1 lg:grid-cols-[1fr_auto]" : "grid-cols-1")}>
          <UiCard size="sm">
            <CardHeader>
              <CardTitle>{t("globalStats.studyActivity")}</CardTitle>
            </CardHeader>
            <CardContent>
              <StudyHeatmap runs={runs} now={now} />
            </CardContent>
          </UiCard>
          {runs.length > 1 && (
            <UiCard size="sm" className="lg:w-64">
              <CardHeader>
                <CardTitle>{t("globalStats.accuracyTrend")}</CardTitle>
              </CardHeader>
              <CardContent>
                <AccuracyTrend runs={newestFirst(runs)} />
              </CardContent>
            </UiCard>
          )}
        </div>
      )}

      <UiCard size="sm">
        <CardHeader>
          <CardTitle>{t("globalStats.decks")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-0.5">
          {rows.length === 0 ? (
            <p className={cn(looks.muted, "py-4 text-center")}>{t("deckList.noDecks")}</p>
          ) : (
            rows.map((row) => <DeckLine key={row.deck.id} row={row} now={now} onOpen={() => onOpenDeck(row.deck.id)} />)
          )}
        </CardContent>
      </UiCard>
    </div>
  );
}

/** A deck's line: its cards, those due, its accuracy and when it was last studied. */
function DeckLine({ row, now, onOpen }: { row: DeckRow; now: Millis; onOpen: () => void }) {
  const { t, tp } = useLanguage();
  const { deck, due, lastRun } = row;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50"
    >
      <span className="min-w-0 flex-1 truncate font-medium text-foreground">{deck.title}</span>
      <span className="shrink-0 text-xs text-muted-foreground">
        {deck.cards.length} {tp(deck.cards.length, "common.card", "common.cards")}
      </span>
      {due > 0 && (
        <Badge variant="outline" className={cn("shrink-0 text-xs", looks.caution)}>
          {due} {tp(due, "globalStats.dueOne", "globalStats.dueMany")}
        </Badge>
      )}
      {row.accuracy !== null && (
        <span className={cn("shrink-0 font-mono text-xs font-medium", accuracyLook(row.accuracy))}>{row.accuracy}%</span>
      )}
      <span className="shrink-0 text-xs text-muted-foreground">
        {lastRun === null ? t("globalStats.neverStudied") : <LastStudied at={lastRun} now={now} />}
      </span>
    </button>
  );
}

/** When a deck was last studied: today, yesterday, days or weeks ago, then the date. */
function LastStudied({ at, now }: { at: Millis; now: Millis }) {
  const { t } = useLanguage();
  const days = daysSince(at, now);
  if (days === 0) return t("globalStats.today");
  if (days === 1) return t("globalStats.yesterday");
  if (days < 7) return t("globalStats.daysAgo").replace("{n}", String(days));
  if (days < 30) return t("globalStats.weeksAgo").replace("{n}", String(Math.floor(days / 7)));
  return new Date(at).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
