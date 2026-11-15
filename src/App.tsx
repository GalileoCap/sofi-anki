import { useState } from "react";

import { DeckStats } from "@/components/deck-stats";
import { GlobalStats } from "@/components/global-stats";
import { Page } from "@/components/page";
import { SharedDeckView } from "@/components/shared-deck-view";
import { StudySession } from "@/components/study-session";
import { useLanguage } from "@/contexts/language-context";
import { receiveDeck } from "@/core/decks";
import type { CardRunResult, Deck, SessionGoal, Store } from "@/core/model";
import { type RunChoice, runCards } from "@/core/run";
import { indexSchedules, scheduleRun } from "@/core/scheduler";
import { decodeDeck, sharedPart } from "@/core/share";
import { newId, now } from "@/effects/clock";
import { clearHash, pageHash } from "@/effects/page";
import { useStore } from "@/hooks/use-store";
import { looks } from "@/lib/looks";
import { DeckPage } from "@/pages/deck";
import { Home } from "@/pages/home";

type View =
  | { kind: "home" }
  | { kind: "globalStats" }
  | { kind: "deck"; deckId: string }
  | { kind: "study"; deckId: string; choice: RunChoice; goal?: SessionGoal; shuffle?: boolean }
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

const withDecks = (change: (decks: readonly Deck[]) => Deck[]) => (store: Store): Store => ({ ...store, decks: change(store.decks) });

export default function App({ initial }: { initial: Store }) {
  const { store, update, saveError } = useStore(initial);
  const [view, setView] = useState<View>(openingView);
  const [openedAt] = useState(now);
  const { t } = useLanguage();
  const { decks, runs } = store;
  const schedules = indexSchedules(store.schedules);

  function finishRun(deckId: string, totalTimeMs: number, results: CardRunResult[]) {
    const at = now();
    const run = { id: newId(), deckId, completedAt: at, totalTimeMs, results };
    update((s) => ({
      ...s,
      runs: [...s.runs, run],
      schedules: [...scheduleRun(indexSchedules(s.schedules), deckId, results, at).values()],
    }));
  }

  function goHome() {
    clearHash();
    setView({ kind: "home" });
  }

  const banner = saveError && <p className="bg-destructive/10 p-2 text-center text-sm text-destructive">{t("store.saveRefused")}</p>;
  const deck = "deckId" in view ? decks.find((d) => d.id === view.deckId) : undefined;

  if (view.kind === "shared") {
    const shared = view.deck;
    return (
      <>
        {banner}
        <SharedDeckView
          deck={shared}
          existingDeck={decks.find((d) => d.id === shared.id)}
          onImportNew={() => update(withDecks((d) => receiveDeck(d, shared, "merge")))}
          onOverwrite={() => update(withDecks((d) => receiveDeck(d, shared, "overwrite")))}
          onMerge={() => update(withDecks((d) => receiveDeck(d, shared, "merge")))}
          onGoHome={goHome}
        />
      </>
    );
  }

  if (view.kind === "study" && deck) {
    const studied = { ...deck, cards: runCards(deck, view.choice, schedules, runs, openedAt) };
    if (studied.cards.length > 0) {
      return (
        <div className={looks.page}>
          {banner}
          <StudySession
            deck={studied}
            goal={view.goal}
            shuffle={view.shuffle ?? false}
            onExit={() => setView({ kind: "deck", deckId: deck.id })}
            onRunComplete={(totalTimeMs, results) => finishRun(deck.id, totalTimeMs, results)}
          />
        </div>
      );
    }
  }

  if (view.kind === "globalStats") {
    return (
      <Page>
        {banner}
        <GlobalStats
          decks={[...decks]}
          allRuns={[...runs]}
          schedules={schedules}
          onBack={goHome}
          onSelectDeck={(id) => setView({ kind: "deck", deckId: id })}
        />
      </Page>
    );
  }

  if (view.kind === "stats" && deck) {
    return (
      <Page>
        {banner}
        <DeckStats
          deck={deck}
          runs={runs.filter((run) => run.deckId === deck.id)}
          schedules={schedules}
          onBack={() => setView({ kind: "deck", deckId: deck.id })}
        />
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
          onStudy={(choice, goal, shuffle) => setView({ kind: "study", deckId: deck.id, choice, goal, shuffle })}
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
