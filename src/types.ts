export type Complexity = "easy" | "medium" | "hard";

export type CardType = "standard" | "choice";

export interface CardBase {
  id: string;
  title: string;
  complexity: Complexity;
  type: CardType;
  tags: string[];
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
  tags: string[];
  cards: Card[];
  createdAt: number;
}

export interface DeckImportCard {
  title: string;
  complexity?: Complexity;
  tags?: string[];
  // Standard card fields
  response?: string;
  // Choice card fields
  type?: CardType;
  options?: { text: string; correct: boolean }[];
  multiSelect?: boolean;
}

export interface DeckImport {
  title: string;
  tags?: string[];
  cards: DeckImportCard[];
}

export type AnswerResult = "wrong" | "approximate" | "correct";
export type CardDisposition = "skip" | "save_for_later" | AnswerResult;

export interface CardAttempt {
  result: CardDisposition;
  durationMs: number;
  /** For choice cards: IDs of options the user selected */
  selectedOptionIds?: string[];
}

export interface CardRunResult {
  card: Card;
  attempts: CardAttempt[];
}

export interface RunRecord {
  id: string;
  deckId: string;
  completedAt: number;
  totalTimeMs: number;
  results: CardRunResult[];
}

export interface CardSRS {
  cardId: string;
  deckId: string;
  intervalDays: number;
  easeFactor: number;
  dueAt: number;
  lastResult: AnswerResult | null;
}

export type RunMode = "all" | "due" | "weak";
