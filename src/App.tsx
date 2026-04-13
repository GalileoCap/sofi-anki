import { useState, useMemo } from "react";
import { useDecks } from "@/hooks/use-decks";
import { useRuns } from "@/hooks/use-runs";
import { useSRS } from "@/hooks/use-srs";
import { DeckList } from "@/components/deck-list";
import { DeckDetail } from "@/components/deck-detail";
import { DeckStats } from "@/components/deck-stats";
import { StudySession } from "@/components/study-session";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Complexity, Deck, RunMode } from "@/types";

type View =
  | { kind: "home" }
  | { kind: "deck"; deckId: string }
  | { kind: "study"; deckId: string; runMode: RunMode; complexityFilter: Complexity[] | null }
  | { kind: "stats"; deckId: string };

function App() {
  const [view, setView] = useState<View>({ kind: "home" });
  const {
    decks,
    addDeck,
    deleteDeck,
    addCard,
    deleteCard,
    editCard,
    importDeck,
    importCards,
  } = useDecks();
  const { addRun, deleteRunsForDeck, getRunsForDeck } = useRuns();
  const srs = useSRS();

  const currentDeck =
    view.kind !== "home"
      ? decks.find((d) => d.id === view.deckId)
      : undefined;

  // Build a filtered deck for study sessions
  const studyDeck = useMemo((): Deck | undefined => {
    if (view.kind !== "study" || !currentDeck) return undefined;

    let cards = currentDeck.cards;

    // Apply run mode filter
    if (view.runMode === "due") {
      cards = srs.getDueCards(currentDeck);
    } else if (view.runMode === "weak") {
      cards = srs.getWeakCards(currentDeck);
    }

    // Apply complexity filter
    if (view.complexityFilter) {
      const filterSet = new Set(view.complexityFilter);
      cards = cards.filter((c) => filterSet.has(c.complexity));
    }

    return { ...currentDeck, cards };
  }, [view, currentDeck, srs]);

  if (view.kind === "study" && studyDeck && studyDeck.cards.length > 0) {
    return (
      <div className="mx-auto w-full max-w-3xl p-4 sm:p-8">
        <StudySession
          deck={studyDeck}
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
          onStartStudy={(runMode, complexityFilter) =>
            setView({ kind: "study", deckId: currentDeck.id, runMode, complexityFilter })
          }
          onViewStats={() =>
            setView({ kind: "stats", deckId: currentDeck.id })
          }
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
          onSelectDeck={(id) => setView({ kind: "deck", deckId: id })}
          onAddDeck={(title) => addDeck(title)}
          onImportDeck={(data) => importDeck(data)}
        />
      )}
    </div>
  );
}

export default App;
