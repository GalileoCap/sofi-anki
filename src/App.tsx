import { useState } from "react";

import { Page } from "@/components/page";
import { useLanguage } from "@/contexts/language-context";
import type { Card, Deck, SessionGoal, Store } from "@/core/model";
import { runCards } from "@/core/run";
import { indexSchedules } from "@/core/scheduler";
import { decodeDeck, sharedPart } from "@/core/share";
import { now } from "@/effects/clock";
import { clearHash, pageHash } from "@/effects/page";
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
  | { kind: "study"; deckId: string; cards: readonly Card[]; goal?: SessionGoal; shuffle: boolean }
  | { kind: "stats"; deckId: string }
  | { kind: "shared"; deck: Deck };

/** The view a page opens on: the shared deck its link carries, else the home screen. */
function openingView(): View {
  const encoded = sharedPart(pageHash());
  if (encoded === null) return { kind: "home" };
  return decodeDeck(encoded).match(
    (deck): View => ({ kind: "shared", deck }),
    (): View => {
      clearHash();
      return { kind: "home" };
    },
  );
}

export default function App({ initial }: { initial: Store }) {
  const { store, update, saveError } = useStore(initial);
  const [view, setView] = useState<View>(openingView);
  const [openedAt] = useState(now);
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
        <SharedDeckPage deck={view.deck} store={store} update={update} onGoHome={goHome} />
      </Page>
    );
  }

  if (view.kind === "study" && deck) {
    return (
      <>
        {banner}
        <StudyPage
          deck={deck}
          cards={view.cards}
          goal={view.goal}
          shuffle={view.shuffle}
          update={update}
          onExit={() => setView({ kind: "deck", deckId: deck.id })}
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
            const cards = runCards(deck, choice, schedules, runs, now());
            if (cards.length > 0) setView({ kind: "study", deckId: deck.id, cards, goal, shuffle });
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
        onOpenDeck={(id) => setView({ kind: "deck", deckId: id })}
        onOpenStats={() => setView({ kind: "globalStats" })}
      />
    </Page>
  );
}
