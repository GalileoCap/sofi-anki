import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";

import { LastStudied } from "@/components/last-studied";
import { DeckRow } from "@/components/sticker";
import { FirstTriesChart, MonthSheet } from "@/components/study-charts";
import { Icon } from "@/components/icon-button";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import type { Millis, Store } from "@/core/model";
import { indexSchedules } from "@/core/scheduler";
import { deckRows, firstTryRight, neediestFirst, streak, totals } from "@/core/stats";
import { longDuration } from "@/core/time";
import { looks } from "@/lib/ui-looks";
import { cn } from "@/lib/utils";

type StatsPageProps = {
  store: Store;
  /** When the screen opened, which the streak, due cards and dates count from. */
  now: Millis;
  onBack: () => void;
  onOpenDeck: (id: string) => void;
};

/** How studying is going: tiles of the totals, the streak and first tries, the month as a sticker calendar, each run's first tries, and the decks that need it most. */
export function StatsPage({ store, now, onBack, onOpenDeck }: StatsPageProps) {
  const { t, tp } = useLanguage();
  const { decks, runs } = store;
  const days = streak(runs, now);
  const right = firstTryRight(runs);
  const rows = neediestFirst(deckRows(decks, runs, indexSchedules(store.schedules), now));
  const cards = decks.reduce((sum, deck) => sum + deck.cards.length, 0);
  const tiles: readonly (readonly [string, string])[] = [
    [t("stats.tileDecks"), String(decks.length)],
    [t("stats.tileCards"), String(cards)],
    [t("stats.tileRuns"), String(runs.length)],
    [t("stats.tileTime"), runs.length > 0 ? longDuration(totals(runs).timeMs) : "–"],
    [t("stats.tileFirstRight"), right !== null ? `${right}%` : "–"],
    [t("stats.tileStreak"), days > 0 ? `${days} ${tp(days, "stats.dayOne", "stats.dayMany")}` : "–"],
  ];

  return (
    <div className={looks.form}>
      <div className={looks.topbar}>
        <Button variant="ghost" onClick={onBack}>
          <Icon icon={ArrowLeft01Icon} />
          {t("deck.back")}
        </Button>
      </div>
      <h1 className={looks.title}>{t("stats.title")}</h1>
      {decks.length > 0 && (
        <dl className="grid grid-cols-3 gap-2.5 lg:grid-cols-6">
          {tiles.map(([label, value]) => (
            <div key={label} className="flex flex-col-reverse justify-end gap-1 rounded-xl border bg-card px-3 py-3 text-center">
              <dt className={looks.muted}>{label}</dt>
              <dd className={cn(looks.value, "text-xl")}>{value}</dd>
            </div>
          ))}
        </dl>
      )}
      <div className={looks.split}>
        <div className={cn(looks.form, "lg:self-start")}>
          <MonthSheet runs={runs} decks={decks} now={now} />
        </div>
        <div className={looks.form}>
          {runs.length > 0 && <FirstTriesChart runs={runs} decks={decks} />}
          <div>
            <h2 className={looks.sectionTitle}>{t("stats.decks")}</h2>
            {rows.length === 0 && <p className={looks.muted}>{t("stats.noDecks")}</p>}
            <div className={looks.column}>
              {rows.map(({ deck, due, lastRun, firstRight }) => (
                <DeckRow
                  key={deck.id}
                  deck={deck}
                  onOpen={() => onOpenDeck(deck.id)}
                  meta={
                    <>
                      {deck.cards.length} {tp(deck.cards.length, "common.card", "common.cards")}, <LastStudied at={lastRun} now={now} />
                      {due > 0 && `, ${due === 1 ? t("home.dueOne") : t("home.due").replace("{n}", String(due))}`}
                    </>
                  }
                  end={firstRight !== null && <span className={looks.value}>{firstRight}%</span>}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
