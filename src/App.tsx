import { useState, useMemo } from "react";
import { useDecks } from "@/hooks/use-decks";
import { DeckList } from "@/components/deck-list";
import { DeckDetail } from "@/components/deck-detail";
import { StudySession } from "@/components/study-session";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Complexity, Deck } from "@/types";

type View =
  | { kind: "home" }
  | { kind: "deck"; deckId: string }
  | { kind: "study"; deckId: string; complexityFilter: Complexity[] | null };

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

  const currentDeck =
    view.kind !== "home"
      ? decks.find((d) => d.id === view.deckId)
      : undefined;

  // Build a filtered deck for study sessions
  const studyDeck = useMemo((): Deck | undefined => {
    if (view.kind !== "study" || !currentDeck) return undefined;
    if (!view.complexityFilter) return currentDeck;
    const filterSet = new Set(view.complexityFilter);
    return {
      ...currentDeck,
      cards: currentDeck.cards.filter((c) => filterSet.has(c.complexity)),
    };
  }, [view, currentDeck]);

  if (view.kind === "study" && studyDeck && studyDeck.cards.length > 0) {
    return (
      <div className="mx-auto w-full max-w-3xl p-4 sm:p-8">
        <StudySession
          deck={studyDeck}
          onExit={() => setView({ kind: "deck", deckId: studyDeck.id })}
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
          onBack={() => setView({ kind: "home" })}
          onStartStudy={(complexityFilter) =>
            setView({ kind: "study", deckId: currentDeck.id, complexityFilter })
          }
          onAddCard={(card) => addCard(currentDeck.id, card)}
          onEditCard={(cardId, card) => editCard(currentDeck.id, cardId, card)}
          onDeleteCard={(cardId) => deleteCard(currentDeck.id, cardId)}
          onDeleteDeck={() => {
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
