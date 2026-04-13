export type Complexity = "easy" | "medium" | "hard";

export interface Card {
  id: string;
  title: string;
  response: string;
  complexity: Complexity;
}

export interface Deck {
  id: string;
  title: string;
  cards: Card[];
  createdAt: number;
}

export interface DeckImport {
  title: string;
  cards: { title: string; response: string; complexity?: Complexity }[];
}

export type AnswerResult = "wrong" | "approximate" | "correct";
export type CardDisposition = "skip" | "save_for_later" | AnswerResult;

export interface CardAttempt {
  result: CardDisposition;
  durationMs: number;
}

export interface CardRunResult {
  card: Card;
  attempts: CardAttempt[];
}
