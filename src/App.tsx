import { useState } from "react";
import { useDecks } from "@/hooks/use-decks";
import { DeckList } from "@/components/deck-list";
import { DeckDetail } from "@/components/deck-detail";
import { StudySession } from "@/components/study-session";

type View =
  | { kind: "home" }
  | { kind: "deck"; deckId: string }
  | { kind: "study"; deckId: string };

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

  if (view.kind === "study" && currentDeck) {
    return (
      <div className="mx-auto w-full max-w-3xl p-4 sm:p-8">
        <StudySession
          deck={currentDeck}
          onExit={() => setView({ kind: "deck", deckId: currentDeck.id })}
        />
      </div>
    );
  }

  if (view.kind === "deck" && currentDeck) {
    return (
      <div className="mx-auto w-full max-w-3xl p-4 sm:p-8">
        <DeckDetail
          deck={currentDeck}
          onBack={() => setView({ kind: "home" })}
          onStartStudy={() =>
            setView({ kind: "study", deckId: currentDeck.id })
          }
          onAddCard={(title, response, complexity) =>
            addCard(currentDeck.id, title, response, complexity)
          }
          onEditCard={(cardId, title, response, complexity) =>
            editCard(currentDeck.id, cardId, title, response, complexity)
          }
          onDeleteCard={(cardId) => deleteCard(currentDeck.id, cardId)}
          onDeleteDeck={() => {
            deleteDeck(currentDeck.id);
            setView({ kind: "home" });
          }}
          onImportCards={(cards) => importCards(currentDeck.id, cards)}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl p-4 sm:p-8">
      <DeckList
        decks={decks}
        onSelectDeck={(id) => setView({ kind: "deck", deckId: id })}
        onAddDeck={(title) => addDeck(title)}
        onImportDeck={(data) => importDeck(data)}
      />
    </div>
  );
}

export default App;
