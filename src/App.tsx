import { useEffect, useState } from "react";

import { Page } from "@/components/page";
import { useLanguage } from "@/contexts/language-context";
import type { Deck, SessionGoal, Store } from "@/core/model";
import { type RunItem, deckItems, runCards } from "@/core/run";
import { indexSchedules } from "@/core/scheduler";
import { decodeDeck, sharedPart } from "@/core/share";
import { now } from "@/effects/clock";
import { clearHash, onHashChange, pageHash } from "@/effects/page";
import { useStore } from "@/hooks/use-store";
import { DeckPage } from "@/pages/deck";
import { DeckStatsPage } from "@/pages/deck-stats";
import { Home } from "@/pages/home";
import { SharedDeckPage } from "@/pages/shared-deck";
import { StatsPage } from "@/pages/stats";
import { StudyPage } from "@/pages/study";

type View =
  | { kind: "home" }
  | { kind: "globalStats" }
  | { kind: "deck"; deckId: string }
  | { kind: "study"; items: readonly RunItem[]; goal?: SessionGoal; shuffle: boolean; from: string | null }
  | { kind: "stats"; deckId: string }
  | { kind: "shared"; deck: Deck };

/** The shared deck the page's link carries. A link that does not decode is removed from the address. */
function sharedView(): View | null {
  const encoded = sharedPart(pageHash());
  if (encoded === null) return null;
  return decodeDeck(encoded).match(
    (deck): View => ({ kind: "shared", deck }),
    (): null => {
      clearHash();
      return null;
    },
  );
}

/** The view a page opens on: the shared deck its link carries, else the home screen. */
const openingView = (): View => sharedView() ?? { kind: "home" };

export default function App({ initial }: { initial: Store }) {
  const { store, update, saveError } = useStore(initial);
  const [view, setView] = useState<View>(openingView);
  useEffect(
    () =>
      onHashChange(() => {
        const shared = sharedView();
        if (shared !== null) setView(shared);
      }),
    [],
  );
  const [openedAt] = useState(now);
  /** The title of the deck just kept from a link, which home names once. */
  const [kept, setKept] = useState<string | null>(null);
  const { t } = useLanguage();
  const { decks, runs } = store;
  const schedules = indexSchedules(store.schedules);

  function goHome() {
    clearHash();
    setView({ kind: "home" });
  }

  const banner = saveError && <p className="bg-destructive/10 p-2 text-center text-sm text-destructive">{t("store.saveRefused")}</p>;
  const deck = "deckId" in view ? decks.find((d) => d.id === view.deckId) : undefined;

  if (view.kind === "shared") {
    return (
      <Page>
        {banner}
        <SharedDeckPage
          deck={view.deck}
          store={store}
          update={update}
          onGoHome={(keptTitle) => {
            setKept(keptTitle);
            goHome();
          }}
        />
      </Page>
    );
  }

  if (view.kind === "study") {
    const back = view.from;
    return (
      <>
        {banner}
        <StudyPage
          items={view.items}
          store={store}
          goal={view.goal}
          shuffle={view.shuffle}
          update={update}
          onExit={() => setView(back === null ? { kind: "home" } : { kind: "deck", deckId: back })}
        />
      </>
    );
  }

  if (view.kind === "globalStats") {
    return (
      <Page>
        {banner}
        <StatsPage store={store} now={openedAt} onBack={goHome} onOpenDeck={(id) => setView({ kind: "deck", deckId: id })} />
      </Page>
    );
  }

  if (view.kind === "stats" && deck) {
    return (
      <Page>
        {banner}
        <DeckStatsPage deck={deck} store={store} now={openedAt} onBack={() => setView({ kind: "deck", deckId: deck.id })} />
      </Page>
    );
  }

  if (view.kind === "deck" && deck) {
    return (
      <Page>
        {banner}
        <DeckPage
          deck={deck}
          store={store}
          update={update}
          now={openedAt}
          onBack={() => setView({ kind: "home" })}
          onStudy={(choice, goal, shuffle) => {
            const items = deckItems(deck, runCards(deck, choice, schedules, runs, now()));
            if (items.length > 0) setView({ kind: "study", items, goal, shuffle, from: deck.id });
          }}
          onStats={() => setView({ kind: "stats", deckId: deck.id })}
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
        onOpenDeck={(id) => setView({ kind: "deck", deckId: id })}
        onOpenStats={() => setView({ kind: "globalStats" })}
        onStudy={(items) => setView({ kind: "study", items, shuffle: false, from: null })}
      />
    </Page>
  );
}
