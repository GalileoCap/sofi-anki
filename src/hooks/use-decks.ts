import { useState, useEffect } from "react";
import type { Card, Deck, DeckImport } from "@/types";
import { loadDecks, saveDecks } from "@/lib/storage";

export function useDecks() {
  const [decks, setDecks] = useState<Deck[]>(() => loadDecks());

  useEffect(() => {
    saveDecks(decks);
  }, [decks]);

  function addDeck(title: string): Deck {
    const deck: Deck = {
      id: crypto.randomUUID(),
      title,
      cards: [],
      createdAt: Date.now(),
    };
    setDecks((prev) => [...prev, deck]);
    return deck;
  }

  function deleteDeck(id: string) {
    setDecks((prev) => prev.filter((d) => d.id !== id));
  }

  function updateDeckTitle(id: string, title: string) {
    setDecks((prev) =>
      prev.map((d) => (d.id === id ? { ...d, title } : d))
    );
  }

  function addCard(deckId: string, title: string, response: string): Card {
    const card: Card = { id: crypto.randomUUID(), title, response };
    setDecks((prev) =>
      prev.map((d) =>
        d.id === deckId ? { ...d, cards: [...d.cards, card] } : d
      )
    );
    return card;
  }

  function deleteCard(deckId: string, cardId: string) {
    setDecks((prev) =>
      prev.map((d) =>
        d.id === deckId
          ? { ...d, cards: d.cards.filter((c) => c.id !== cardId) }
          : d
      )
    );
  }

  function editCard(deckId: string, cardId: string, title: string, response: string) {
    setDecks((prev) =>
      prev.map((d) =>
        d.id === deckId
          ? {
              ...d,
              cards: d.cards.map((c) =>
                c.id === cardId ? { ...c, title, response } : c
              ),
            }
          : d
      )
    );
  }

  function importDeck(data: DeckImport): Deck {
    const deck: Deck = {
      id: crypto.randomUUID(),
      title: data.title,
      cards: data.cards.map((c) => ({
        id: crypto.randomUUID(),
        title: c.title,
        response: c.response,
      })),
      createdAt: Date.now(),
    };
    setDecks((prev) => [...prev, deck]);
    return deck;
  }

  function importCards(deckId: string, cards: { title: string; response: string }[]) {
    setDecks((prev) =>
      prev.map((d) =>
        d.id === deckId
          ? {
              ...d,
              cards: [
                ...d.cards,
                ...cards.map((c) => ({
                  id: crypto.randomUUID(),
                  title: c.title,
                  response: c.response,
                })),
              ],
            }
          : d
      )
    );
  }

  return {
    decks,
    addDeck,
    deleteDeck,
    updateDeckTitle,
    addCard,
    deleteCard,
    editCard,
    importDeck,
    importCards,
  };
}
