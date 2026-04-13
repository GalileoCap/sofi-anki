export type Complexity = "easy" | "medium" | "hard";

export type CardType = "standard" | "choice";

export interface CardBase {
  id: string;
  title: string;
  complexity: Complexity;
  type: CardType;
}

export interface StandardCard extends CardBase {
  type: "standard";
  response: string;
}

export interface ChoiceOption {
  id: string;
  text: string;
  correct: boolean;
}

export interface ChoiceCard extends CardBase {
  type: "choice";
  options: ChoiceOption[];
  /** true = multiple correct answers, false = single correct answer */
  multiSelect: boolean;
}

export type Card = StandardCard | ChoiceCard;

export interface Deck {
  id: string;
  title: string;
  cards: Card[];
  createdAt: number;
}

export interface DeckImportCard {
  title: string;
  complexity?: Complexity;
  // Standard card fields
  response?: string;
  // Choice card fields
  type?: CardType;
  options?: { text: string; correct: boolean }[];
  multiSelect?: boolean;
}

export interface DeckImport {
  title: string;
  cards: DeckImportCard[];
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
