import type { Result } from "neverthrow";
import { z } from "zod";

import { type DecodeError, decodeJson } from "@/core/decode";
import { type Card, DEFAULT_COMPLEXITY, type Deck, type Millis, complexities } from "@/core/model";

/**
 * A deck as JSON a person writes or exports: no ids, and every field but the titles, the
 * response and the options optional. The deck's export writes this shape, and import reads it.
 */
const importCardBase = {
  title: z.string(),
  complexity: z.enum(complexities).optional(),
  tags: z.array(z.string()).optional(),
  hint: z.string().optional(),
  sources: z.array(z.string()).optional(),
};

const importChoiceSchema = z.object({
  ...importCardBase,
  type: z.literal("choice"),
  options: z.array(z.object({ text: z.string(), correct: z.boolean() })),
  multiSelect: z.boolean().optional(),
});

const importStandardSchema = z.object({
  ...importCardBase,
  type: z.literal("standard").optional(),
  response: z.string(),
});

export const importCardSchema = z.union([importChoiceSchema, importStandardSchema]);
export type ImportCard = z.infer<typeof importCardSchema>;

export const deckImportSchema = z.object({
  title: z.string(),
  tags: z.array(z.string()).optional(),
  color: z.string().optional(),
  emoji: z.string().optional(),
  cards: z.array(importCardSchema),
});
export type DeckImport = z.infer<typeof deckImportSchema>;

export const readDeckJson = (text: string): Result<DeckImport, DecodeError> => decodeJson(deckImportSchema, text);

/** Cards to add to a deck, as an array or as an object holding one under `cards`, a deck's JSON included. */
const cardsImportSchema = z.union([
  z.array(importCardSchema),
  z.object({ cards: z.array(importCardSchema) }).transform((data) => data.cards),
]);

export const readCardsJson = (text: string): Result<ImportCard[], DecodeError> => decodeJson(cardsImportSchema, text);

/** A card from its JSON, with ids from `newId`. A choice card without `multiSelect` is one when more than one option is correct. */
export function cardFromJson(card: ImportCard, newId: () => string): Card {
  const common = {
    id: newId(),
    title: card.title,
    complexity: card.complexity ?? DEFAULT_COMPLEXITY,
    tags: card.tags ?? [],
    ...(card.hint ? { hint: card.hint } : {}),
    ...(card.sources?.length ? { sources: card.sources } : {}),
  };
  if (card.type === "choice") {
    return {
      ...common,
      type: "choice",
      multiSelect: card.multiSelect ?? card.options.filter((o) => o.correct).length > 1,
      options: card.options.map((o) => ({ id: newId(), text: o.text, correct: o.correct })),
    };
  }
  return { ...common, type: "standard", response: card.response };
}

/** A new deck from its JSON, made at `now`. */
export const deckFromJson = (data: DeckImport, now: Millis, newId: () => string): Deck => ({
  id: newId(),
  title: data.title,
  tags: data.tags ?? [],
  cards: data.cards.map((card) => cardFromJson(card, newId)),
  createdAt: now,
  ...(data.color ? { color: data.color } : {}),
  ...(data.emoji ? { emoji: data.emoji } : {}),
});

/** The deck as JSON without ids, readable back by `readDeckJson`. */
export function deckToJson(deck: Deck): DeckImport {
  return {
    title: deck.title,
    ...(deck.tags.length > 0 ? { tags: deck.tags } : {}),
    ...(deck.color ? { color: deck.color } : {}),
    ...(deck.emoji ? { emoji: deck.emoji } : {}),
    cards: deck.cards.map((card): ImportCard => {
      const common = {
        title: card.title,
        complexity: card.complexity,
        ...(card.tags.length > 0 ? { tags: card.tags } : {}),
        ...(card.hint ? { hint: card.hint } : {}),
        ...(card.sources?.length ? { sources: card.sources } : {}),
      };
      return card.type === "choice"
        ? {
            ...common,
            type: "choice",
            multiSelect: card.multiSelect,
            options: card.options.map((o) => ({ text: o.text, correct: o.correct })),
          }
        : { ...common, response: card.response };
    }),
  };
}
