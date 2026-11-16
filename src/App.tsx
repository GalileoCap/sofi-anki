import { useEffect, useState } from "react";

import { Page } from "@/components/page";
import { useLanguage } from "@/contexts/language-context";
import type { SessionGoal, Store } from "@/core/model";
import { type Route, parseRoute, routeHash } from "@/core/route";
import { type RunItem, deckItems, runCards } from "@/core/run";
import { indexSchedules } from "@/core/scheduler";
import { decodeDeck } from "@/core/share";
import { now } from "@/effects/clock";
import { backTo, onHashChange, openHash, pageHash, replaceHash, showTitle } from "@/effects/page";
import { useStore } from "@/hooks/use-store";
import { DeckPage } from "@/pages/deck";
import { DeckStatsPage } from "@/pages/deck-stats";
import { Home } from "@/pages/home";
import { SharedDeckPage } from "@/pages/shared-deck";
import { StatsPage } from "@/pages/stats";
import { StudyPage } from "@/pages/study";

/** A run's cards and choices, which live in memory while its screen is open. */
type Run = { items: readonly RunItem[]; goal?: SessionGoal; shuffle: boolean };

const HOME: Route = { kind: "home" };
const APP_TITLE = "sofi-anki";

export default function App({ initial }: { initial: Store }) {
  const { store, update, saveError } = useStore(initial);
  const [route, setRoute] = useState(() => parseRoute(pageHash()));
  const [run, setRun] = useState<Run | null>(null);
  useEffect(
    () =>
      onHashChange(() => {
        const next = parseRoute(pageHash());
        setRoute(next);
        if (next.kind !== "study") setRun(null);
      }),
    [],
  );
  const [openedAt] = useState(now);
  /** The title of the deck just kept from a link, which home names once. */
  const [kept, setKept] = useState<string | null>(null);
  const { t } = useLanguage();
  const { decks, runs } = store;
  const schedules = indexSchedules(store.schedules);

  const deckId = "deckId" in route ? route.deckId : null;
  const deck = deckId === null ? undefined : decks.find((d) => d.id === deckId);
  const shared = route.kind === "share" ? decodeDeck(route.encoded).unwrapOr(null) : null;
  /** Where an address that cannot open leads instead: a link that does not decode, a deck this browser lacks, or a run whose cards are not in memory. */
  const fallback: Route | null =
    (route.kind === "share" && shared === null) || (deckId !== null && deck === undefined)
      ? HOME
      : route.kind === "study" && run === null
        ? deck === undefined
          ? HOME
          : { kind: "deck", deckId: deck.id }
        : null;
  const shown = fallback ?? route;
  const fallbackHash = fallback === null ? null : routeHash(fallback);
  useEffect(() => {
    if (fallbackHash !== null) replaceHash(fallbackHash);
  }, [fallbackHash]);

  const title = shown.kind === "share" ? shared?.title : deck?.title;
  useEffect(() => showTitle(title === undefined ? APP_TITLE : `${title} · ${APP_TITLE}`), [title]);

  /** Opens `next` as a new history entry. */
  function open(next: Route) {
    openHash(routeHash(next));
    setRoute(next);
  }

  /** Goes back to `to`, through history when the screen was opened from there. */
  function back(to: Route) {
    backTo(routeHash(to));
    setRoute(to);
    if (to.kind !== "study") setRun(null);
  }

  function study(next: Run, from: string | null) {
    setRun(next);
    open({ kind: "study", deckId: from });
  }

  const banner = saveError && <p className="bg-destructive/10 p-2 text-center text-sm text-destructive">{t("store.saveRefused")}</p>;

  if (shown.kind === "share" && shared !== null) {
    return (
      <Page>
        {banner}
        <SharedDeckPage
          deck={shared}
          store={store}
          update={update}
          onGoHome={(keptTitle) => {
            setKept(keptTitle);
            back(HOME);
          }}
        />
      </Page>
    );
  }

  if (shown.kind === "study" && run !== null) {
    const from: Route = shown.deckId === null ? HOME : { kind: "deck", deckId: shown.deckId };
    return (
      <>
        {banner}
        <StudyPage items={run.items} store={store} goal={run.goal} shuffle={run.shuffle} update={update} onExit={() => back(from)} />
      </>
    );
  }

  if (shown.kind === "stats") {
    return (
      <Page>
        {banner}
        <StatsPage store={store} now={openedAt} onBack={() => back(HOME)} onOpenDeck={(id) => open({ kind: "deck", deckId: id })} />
      </Page>
    );
  }

  if (shown.kind === "deckStats" && deck) {
    return (
      <Page>
        {banner}
        <DeckStatsPage deck={deck} store={store} now={openedAt} onBack={() => back({ kind: "deck", deckId: deck.id })} />
      </Page>
    );
  }

  if (shown.kind === "deck" && deck) {
    return (
      <Page>
        {banner}
        <DeckPage
          deck={deck}
          store={store}
          update={update}
          now={openedAt}
          onBack={() => back(HOME)}
          onStudy={(choice, goal, shuffle) => {
            const items = deckItems(deck, runCards(deck, choice, schedules, runs, now()));
            if (items.length > 0) study({ items, goal, shuffle }, deck.id);
          }}
          onStats={() => open({ kind: "deckStats", deckId: deck.id })}
        />
      </Page>
    );
  }

  return (
    <Page>
      {banner}
      <Home
        store={store}
        update={update}
        now={openedAt}
        kept={kept}
        onOpenDeck={(id) => open({ kind: "deck", deckId: id })}
        onOpenStats={() => open({ kind: "stats" })}
        onStudy={(items) => study({ items, shuffle: false }, null)}
      />
    </Page>
  );
}
