import { z } from "zod";

/**
 * The app's data, as zod schemas that read every shape an earlier version stored.
 *
 * Fields were added over time (`git log -p src/types.ts` before the rewrite): `complexity`,
 * the card `type`, then `tags` on cards and decks, then `hint`, `color` and `emoji`. A field
 * an older shape lacks gets the default named beside it, so old data reads as current data.
 */

/** A moment, in milliseconds since the epoch. */
export const millisSchema = z.number().brand<"Millis">();
export type Millis = z.infer<typeof millisSchema>;
export const millis = (value: number): Millis => value as Millis;

export const DAY_MS = 86_400_000;

export const complexities = ["easy", "medium", "hard"] as const;
export type Complexity = (typeof complexities)[number];
/** The complexity of a card stored before complexity existed. */
export const DEFAULT_COMPLEXITY: Complexity = "medium";

const cardBase = {
  id: z.string(),
  title: z.string(),
  complexity: z.enum(complexities).default(DEFAULT_COMPLEXITY),
  tags: z.array(z.string()).default([]),
  hint: z.string().optional(),
};

export const choiceOptionSchema = z.object({
  id: z.string(),
  text: z.string(),
  correct: z.boolean(),
});
export type ChoiceOption = z.infer<typeof choiceOptionSchema>;

const standardCardSchema = z.object({
  ...cardBase,
  type: z.literal("standard"),
  response: z.string(),
});
export type StandardCard = z.infer<typeof standardCardSchema>;

const choiceCardSchema = z.object({
  ...cardBase,
  type: z.literal("choice"),
  options: z.array(choiceOptionSchema),
  /** Whether more than one option may be correct. */
  multiSelect: z.boolean(),
});
export type ChoiceCard = z.infer<typeof choiceCardSchema>;

/** A card stored before choice cards has no `type`, and is a standard card. */
export const cardSchema = z.preprocess(
  (value) =>
    typeof value === "object" && value !== null && !("type" in value)
      ? { ...value, type: "standard" }
      : value,
  z.discriminatedUnion("type", [standardCardSchema, choiceCardSchema]),
);
export type Card = z.infer<typeof cardSchema>;
export type CardType = Card["type"];

export const deckSchema = z.object({
  id: z.string(),
  title: z.string(),
  tags: z.array(z.string()).default([]),
  cards: z.array(cardSchema),
  createdAt: millisSchema,
  color: z.string().optional(),
  emoji: z.string().optional(),
});
export type Deck = z.infer<typeof deckSchema>;

export const answerResults = ["wrong", "approximate", "correct"] as const;
export type AnswerResult = (typeof answerResults)[number];
export const answerResultSchema = z.enum(answerResults);
export const dispositionSchema = z.enum(["skip", "save_for_later", ...answerResults]);
export type CardDisposition = z.infer<typeof dispositionSchema>;

export const attemptSchema = z.object({
  result: dispositionSchema,
  durationMs: z.number(),
  /** The options chosen, for a choice card. */
  selectedOptionIds: z.array(z.string()).optional(),
});
export type CardAttempt = z.infer<typeof attemptSchema>;

export const cardRunResultSchema = z.object({
  /** The card as it was when studied. */
  card: cardSchema,
  attempts: z.array(attemptSchema),
});
export type CardRunResult = z.infer<typeof cardRunResultSchema>;

export const runSchema = z.object({
  id: z.string(),
  deckId: z.string(),
  completedAt: millisSchema,
  totalTimeMs: z.number(),
  results: z.array(cardRunResultSchema),
});
export type RunRecord = z.infer<typeof runSchema>;

export const scheduleSchema = z.object({
  cardId: z.string(),
  deckId: z.string(),
  intervalDays: z.number(),
  easeFactor: z.number(),
  dueAt: millisSchema,
  lastResult: answerResultSchema.nullable(),
});
export type CardSchedule = z.infer<typeof scheduleSchema>;

/** The daily card goal before anyone sets one. */
export const DEFAULT_DAILY_GOAL = 20;

export const settingsSchema = z.object({
  dailyCardGoal: z.number().default(DEFAULT_DAILY_GOAL),
});
export type Settings = z.infer<typeof settingsSchema>;
export const DEFAULT_SETTINGS: Settings = { dailyCardGoal: DEFAULT_DAILY_GOAL };

export const langs = ["en", "es"] as const;
export type Lang = (typeof langs)[number];
/** The language before anyone picks one. */
export const DEFAULT_LANG: Lang = "en";

export const themes = ["light", "dark", "system"] as const;
export type Theme = (typeof themes)[number];
/** The theme before anyone picks one: the system's. */
export const DEFAULT_THEME: Theme = "system";

export const runModes = ["all", "due", "weak", "new"] as const;
export type RunMode = (typeof runModes)[number];

export type SessionGoal = { readonly type: "cards" | "minutes"; readonly value: number };

/** Everything one browser holds, as the app reads it. */
export type Store = {
  readonly decks: readonly Deck[];
  readonly runs: readonly RunRecord[];
  readonly schedules: readonly CardSchedule[];
  readonly settings: Settings;
};
