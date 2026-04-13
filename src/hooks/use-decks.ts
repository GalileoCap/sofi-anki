import { useState, useEffect } from "react";
import type { Card, ChoiceOption, Deck, DeckImport, DeckImportCard } from "@/types";
import { loadDecks, saveDecks } from "@/lib/storage";

function importCardToCard(c: DeckImportCard): Card {
  if (c.type === "choice" && Array.isArray(c.options)) {
    return {
      id: crypto.randomUUID(),
      type: "choice",
      title: c.title,
      complexity: c.complexity ?? "medium",
      tags: c.tags ?? [],
      multiSelect: c.multiSelect ?? c.options.filter((o) => o.correct).length > 1,
      options: c.options.map((o) => ({
        id: crypto.randomUUID(),
        text: o.text,
        correct: o.correct,
      })),
    };
  }
  return {
    id: crypto.randomUUID(),
    type: "standard",
    title: c.title,
    response: c.response ?? "",
    complexity: c.complexity ?? "medium",
    tags: c.tags ?? [],
  };
}

export function useDecks() {
  const [decks, setDecks] = useState<Deck[]>(() => loadDecks());

  useEffect(() => {
    saveDecks(decks);
  }, [decks]);

  function addDeck(title: string, tags: string[] = []): Deck {
    const deck: Deck = {
      id: crypto.randomUUID(),
      title,
      tags,
      cards: [],
      createdAt: Date.now(),
    };
    setDecks((prev) => [...prev, deck]);
    return deck;
  }

  function deleteDeck(id: string) {
    setDecks((prev) => prev.filter((d) => d.id !== id));
  }

  function updateDeck(id: string, title: string, tags: string[]) {
    setDecks((prev) =>
      prev.map((d) => (d.id === id ? { ...d, title, tags } : d))
    );
  }

  function addCard(deckId: string, card: Omit<Card, "id">): Card {
    const newCard = { ...card, id: crypto.randomUUID() } as Card;
    if (newCard.type === "choice") {
      newCard.options = newCard.options.map((o: ChoiceOption) => ({
        ...o,
        id: o.id || crypto.randomUUID(),
      }));
    }
    setDecks((prev) =>
      prev.map((d) =>
        d.id === deckId ? { ...d, cards: [...d.cards, newCard] } : d
      )
    );
    return newCard;
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

  function editCard(deckId: string, cardId: string, updates: Omit<Card, "id">) {
    setDecks((prev) =>
      prev.map((d) =>
        d.id === deckId
          ? {
              ...d,
              cards: d.cards.map((c) =>
                c.id === cardId ? { ...updates, id: cardId } as Card : c
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
      tags: data.tags ?? [],
      cards: data.cards.map(importCardToCard),
      createdAt: Date.now(),
    };
    setDecks((prev) => [...prev, deck]);
    return deck;
  }

  function importCards(deckId: string, cards: DeckImportCard[]) {
    setDecks((prev) =>
      prev.map((d) =>
        d.id === deckId
          ? {
              ...d,
              cards: [...d.cards, ...cards.map(importCardToCard)],
            }
          : d
      )
    );
  }

  function importDeckWithId(deck: Deck) {
    setDecks((prev) => [...prev, deck]);
  }

  function overwriteDeck(incoming: Deck) {
    setDecks((prev) =>
      prev.map((d) => (d.id === incoming.id ? incoming : d))
    );
  }

  function mergeDeck(incoming: Deck) {
    setDecks((prev) =>
      prev.map((d) => {
        if (d.id !== incoming.id) return d;
        const existingCardIds = new Set(d.cards.map((c) => c.id));
        const newCards = incoming.cards.filter((c) => !existingCardIds.has(c.id));
        return { ...d, cards: [...d.cards, ...newCards] };
      })
    );
  }

  function reloadFromStorage() {
    setDecks(loadDecks());
  }

  return {
    decks,
    addDeck,
    deleteDeck,
    updateDeck,
    addCard,
    deleteCard,
    editCard,
    importDeck,
    importDeckWithId,
    overwriteDeck,
    mergeDeck,
    reloadFromStorage,
    importCards,
  };
}
