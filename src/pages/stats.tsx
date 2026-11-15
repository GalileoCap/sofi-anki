import { LastStudied } from "@/components/last-studied";
import { DeckRow } from "@/components/sticker";
import { FirstTriesChart, MonthSheet } from "@/components/study-charts";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import type { Millis, Store } from "@/core/model";
import { indexSchedules } from "@/core/scheduler";
import { deckRows, firstTryRight, neediestFirst, streak } from "@/core/stats";
import { looks } from "@/lib/ui-looks";

type StatsPageProps = {
  store: Store;
  /** When the screen opened, which the streak, due cards and dates count from. */
  now: Millis;
  onBack: () => void;
  onOpenDeck: (id: string) => void;
};

/** How studying is going: the streak and first tries in a line, the month as a sticker calendar, each run's first tries, and the decks that need it most. */
export function StatsPage({ store, now, onBack, onOpenDeck }: StatsPageProps) {
  const { t, tp } = useLanguage();
  const { decks, runs } = store;
  const days = streak(runs, now);
  const right = firstTryRight(runs);
  const rows = neediestFirst(deckRows(decks, runs, indexSchedules(store.schedules), now));
  const line = [
    days > 0 && `${days} ${tp(days, "home.dayInARow", "home.daysInARow")}`,
    right !== null && t("stats.firstRight").replace("{p}", String(right)),
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className={looks.narrow}>
      <div className={looks.topbar}>
        <Button variant="ghost" onClick={onBack}>
          {t("deck.back")}
        </Button>
      </div>
      <div>
        <h1 className={looks.title}>{t("stats.title")}</h1>
        {line && <p className={looks.muted}>{line}</p>}
      </div>
      <MonthSheet runs={runs} decks={decks} now={now} />
      {runs.length > 0 && <FirstTriesChart runs={runs} decks={decks} />}
      <div>
        <h2 className={looks.sectionTitle}>{t("stats.decks")}</h2>
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
  );
}
