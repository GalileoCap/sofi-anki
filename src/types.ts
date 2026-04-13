export interface Card {
  id: string;
  title: string;
  response: string;
}

export interface Deck {
  id: string;
  title: string;
  cards: Card[];
  createdAt: number;
}

export interface DeckImport {
  title: string;
  cards: { title: string; response: string }[];
}
