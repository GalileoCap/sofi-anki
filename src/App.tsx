import { useState, useMemo, useEffect } from "react";
import { useDecks } from "@/hooks/use-decks";
import { useRuns } from "@/hooks/use-runs";
import { useSRS } from "@/hooks/use-srs";
import { useSettings } from "@/hooks/use-settings";
import { DeckList } from "@/components/deck-list";
import { DeckDetail } from "@/components/deck-detail";
import { DeckStats } from "@/components/deck-stats";
import { StudySession } from "@/components/study-session";
import { SharedDeckView } from "@/components/shared-deck-view";
import { ThemeToggle } from "@/components/theme-toggle";
import { decodeDeck } from "@/lib/share";
import type { Complexity, Deck, RunMode, SessionGoal } from "@/types";

type View =
  | { kind: "home" }
  | { kind: "deck"; deckId: string }
  | { kind: "study"; deckId: string; runMode: RunMode; complexityFilter: Complexity[] | null; goal?: SessionGoal }
  | { kind: "stats"; deckId: string }
  | { kind: "shared"; deckData: Deck };

function App() {
  const [view, setView] = useState<View>({ kind: "home" });
  const {
    decks,
    addDeck,
    deleteDeck,
    updateDeck,
    addCard,
    deleteCard,
    editCard,
    importDeck,
    importCards,
    importDeckWithId,
    overwriteDeck,
    mergeDeck,
    reloadFromStorage,
  } = useDecks();
  const { runs, addRun, deleteRunsForDeck, getRunsForDeck } = useRuns();
  const srs = useSRS();
  const { settings, updateDailyGoal } = useSettings();

  // Parse share URL on mount
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#/share/")) {
      const encoded = hash.slice("#/share/".length);
      decodeDeck(encoded)
        .then((deck) => setView({ kind: "shared", deckData: deck }))
        .catch(() => {
          // Invalid share URL, go home
          window.location.hash = "";
        });
    }
  }, []);

  const currentDeck =
    view.kind !== "home" && view.kind !== "shared"
      ? decks.find((d) => d.id === view.deckId)
      : undefined;

  // Build a filtered deck for study sessions
  const studyDeck = useMemo((): Deck | undefined => {
    if (view.kind !== "study" || !currentDeck) return undefined;

    let cards = currentDeck.cards;

    if (view.runMode === "due") {
      cards = srs.getDueCards(currentDeck);
    } else if (view.runMode === "weak") {
      cards = srs.getWeakCards(currentDeck);
    }

    if (view.complexityFilter) {
      const filterSet = new Set(view.complexityFilter);
      cards = cards.filter((c) => filterSet.has(c.complexity));
    }

    return { ...currentDeck, cards };
  }, [view, currentDeck, srs]);

  function goHome() {
    window.location.hash = "";
    setView({ kind: "home" });
  }

  if (view.kind === "shared") {
    const existingDeck = decks.find((d) => d.id === view.deckData.id);
    return (
      <SharedDeckView
        deck={view.deckData}
        existingDeck={existingDeck}
        onImportNew={() => importDeckWithId(view.deckData)}
        onOverwrite={() => overwriteDeck(view.deckData)}
        onMerge={() => mergeDeck(view.deckData)}
        onGoHome={goHome}
      />
    );
  }

  if (view.kind === "study" && studyDeck && studyDeck.cards.length > 0) {
    return (
      <div className="mx-auto w-full max-w-3xl p-4 sm:p-8">
        <StudySession
          deck={studyDeck}
          goal={view.goal}
          onExit={() => setView({ kind: "deck", deckId: studyDeck.id })}
          onRunComplete={(totalTimeMs, results) => {
            addRun(studyDeck.id, totalTimeMs, results);
            srs.updateAfterRun(studyDeck.id, results);
          }}
        />
      </div>
    );
  }

  if (view.kind === "stats" && currentDeck) {
    const deckRuns = getRunsForDeck(currentDeck.id);
    return (
      <div className="mx-auto w-full max-w-3xl p-4 sm:p-8">
        <div className="flex justify-end mb-4">
          <ThemeToggle />
        </div>
        <DeckStats
          deck={currentDeck}
          runs={deckRuns}
          srs={srs}
          onBack={() => setView({ kind: "deck", deckId: currentDeck.id })}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl p-4 sm:p-8">
      <div className="flex justify-end mb-4">
        <ThemeToggle />
      </div>

      {view.kind === "deck" && currentDeck ? (
        <DeckDetail
          deck={currentDeck}
          hasRuns={getRunsForDeck(currentDeck.id).length > 0}
          dueCount={srs.getDueCards(currentDeck).length}
          weakCount={srs.getWeakCards(currentDeck).length}
          onBack={() => setView({ kind: "home" })}
          onStartStudy={(runMode, complexityFilter, goal) =>
            setView({ kind: "study", deckId: currentDeck.id, runMode, complexityFilter, goal })
          }
          onViewStats={() =>
            setView({ kind: "stats", deckId: currentDeck.id })
          }
          onEditDeck={(title, tags) => updateDeck(currentDeck.id, title, tags)}
          onAddCard={(card) => addCard(currentDeck.id, card)}
          onEditCard={(cardId, card) => editCard(currentDeck.id, cardId, card)}
          onDeleteCard={(cardId) => deleteCard(currentDeck.id, cardId)}
          onDeleteDeck={() => {
            deleteRunsForDeck(currentDeck.id);
            srs.deleteSRSForDeck(currentDeck.id);
            deleteDeck(currentDeck.id);
            setView({ kind: "home" });
          }}
          onImportCards={(cards) => importCards(currentDeck.id, cards)}
        />
      ) : (
        <DeckList
          decks={decks}
          allRuns={runs}
          dailyGoal={settings.dailyCardGoal}
          onUpdateDailyGoal={updateDailyGoal}
          onSelectDeck={(id) => setView({ kind: "deck", deckId: id })}
          onAddDeck={(title, tags) => addDeck(title, tags)}
          onImportDeck={(data) => importDeck(data)}
          onRestored={reloadFromStorage}
        />
      )}
    </div>
  );
}

export default App;
