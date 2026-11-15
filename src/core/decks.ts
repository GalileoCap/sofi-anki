import type { Card, Deck } from "@/core/model";

/** What a person sets on a deck in its form. An empty color or emoji is none. */
export type DeckLooks = {
  readonly title: string;
  readonly tags: readonly string[];
  readonly color?: string;
  readonly emoji?: string;
};

/** A card as its form gives it, before it has an id. */
export type CardDraft = Card extends infer C ? (C extends Card ? Omit<C, "id"> : never) : never;

const looks = ({ title, tags, color, emoji }: DeckLooks) => ({
  title,
  tags: [...tags],
  ...(color ? { color } : {}),
  ...(emoji ? { emoji } : {}),
});

const replaceDeck = (decks: readonly Deck[], id: string, change: (deck: Deck) => Deck): Deck[] =>
  decks.map((deck) => (deck.id === id ? change(deck) : deck));

export const addDeck = (decks: readonly Deck[], deck: Deck): Deck[] => [...decks, deck];

export const removeDeck = (decks: readonly Deck[], id: string): Deck[] => decks.filter((deck) => deck.id !== id);

export function restyleDeck(decks: readonly Deck[], id: string, changes: DeckLooks): Deck[] {
  return replaceDeck(decks, id, (deck) => newDeck(deck.id, changes, deck.createdAt, deck.cards));
}

/** A deck with the looks given, empty unless `cards` are. */
export const newDeck = (id: string, changes: DeckLooks, createdAt: Deck["createdAt"], cards: readonly Card[] = []): Deck => ({
  id,
  cards: [...cards],
  createdAt,
  ...looks(changes),
});

/** The card a draft makes, with ids from `newId` for itself and any option that has none. */
export function cardFromDraft(draft: CardDraft, id: string, newId: () => string): Card {
  return draft.type === "choice"
    ? { ...draft, id, options: draft.options.map((o) => ({ ...o, id: o.id || newId() })) }
    : { ...draft, id };
}

export const addCards = (decks: readonly Deck[], deckId: string, cards: readonly Card[]): Deck[] =>
  replaceDeck(decks, deckId, (deck) => ({ ...deck, cards: [...deck.cards, ...cards] }));

export const replaceCard = (decks: readonly Deck[], deckId: string, card: Card): Deck[] =>
  replaceDeck(decks, deckId, (deck) => ({ ...deck, cards: deck.cards.map((c) => (c.id === card.id ? card : c)) }));

export const removeCard = (decks: readonly Deck[], deckId: string, cardId: string): Deck[] =>
  replaceDeck(decks, deckId, (deck) => ({ ...deck, cards: deck.cards.filter((c) => c.id !== cardId) }));

/** How a deck that arrives with the id of one already here is taken in. */
export type Arrival = "overwrite" | "merge";

/** The decks after `incoming` arrives: added when new, else overwritten, or merged by adding the cards this copy lacks. */
export function receiveDeck(decks: readonly Deck[], incoming: Deck, how: Arrival): Deck[] {
  if (!decks.some((deck) => deck.id === incoming.id)) return addDeck(decks, incoming);
  if (how === "overwrite") return replaceDeck(decks, incoming.id, () => incoming);
  return replaceDeck(decks, incoming.id, (deck) => {
    const known = new Set(deck.cards.map((card) => card.id));
    return { ...deck, cards: [...deck.cards, ...incoming.cards.filter((card) => !known.has(card.id))] };
  });
}

/** Every tag on a deck, sorted, each once. */
export const allTags = (decks: readonly Deck[]): string[] => [...new Set(decks.flatMap((deck) => deck.tags))].sort();
