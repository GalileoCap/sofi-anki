import { Result } from "neverthrow";
import { z } from "zod";

import { type DecodeError, decodeJson } from "@/core/decode";
import {
  type AnswerResult,
  type CardSchedule,
  type Complexity,
  type Deck,
  type Millis,
  type StandardCard,
  millis,
} from "@/core/model";
import { DEFAULT_EASE, scheduleKey } from "@/core/scheduler";

/**
 * Anki's collection, as rows read from its SQLite file, to decks and schedules, and back. The
 * file itself, its SQLite and the HTML to Markdown conversion are the effects' (`effects/anki-file`).
 */

/** Anki separates a note's fields with this character. */
export const FIELD_SEP = "\x1f";

export type NoteType = {
  readonly id: number;
  readonly isCloze: boolean;
  readonly fields: readonly string[];
  readonly templates: readonly { readonly ord: number; readonly qfmt: string; readonly afmt: string }[];
};

const modelsSchema = z.record(
  z.string(),
  z.object({
    id: z.coerce.number(),
    type: z.number().optional(),
    flds: z.array(z.object({ name: z.string(), ord: z.number() })),
    tmpls: z.array(z.object({ ord: z.number(), qfmt: z.string(), afmt: z.string() })),
  }),
);

/** Note types from the `col.models` JSON of a collection before Anki 2.1.28. */
export function noteTypesFromJson(text: string): Result<Map<number, NoteType>, DecodeError> {
  return decodeJson(modelsSchema, text).map(
    (models) =>
      new Map(
        Object.values(models).map((m): [number, NoteType] => [
          m.id,
          {
            id: m.id,
            isCloze: m.type === 1,
            fields: [...m.flds].sort((a, b) => a.ord - b.ord).map((f) => f.name),
            templates: [...m.tmpls].sort((a, b) => a.ord - b.ord),
          },
        ]),
      ),
  );
}

/**
 * Note types from the `notetypes` and `fields` tables of a newer collection. Their templates are
 * Protobuf, which is not read: each type shows its first field on the front and its second on the back.
 */
export function noteTypesFromTables(
  types: readonly (readonly [id: number, name: string])[],
  fields: readonly (readonly [typeId: number, ord: number, name: string])[],
): Map<number, NoteType> {
  return new Map(
    types.map(([id]): [number, NoteType] => {
      const names = fields
        .filter(([typeId]) => typeId === id)
        .sort((a, b) => a[1] - b[1])
        .map(([, , name]) => name);
      const field = (i: number) => (names[i] === undefined ? "" : `{{${names[i]}}}`);
      return [id, { id, isCloze: false, fields: names, templates: [{ ord: 0, qfmt: field(0), afmt: field(1) }] }];
    }),
  );
}

const deckNamesSchema = z.record(z.string(), z.object({ id: z.coerce.number(), name: z.string() }));

/** Deck names from the `col.decks` JSON of an older collection. */
export const deckNamesFromJson = (text: string): Result<Map<number, string>, DecodeError> =>
  decodeJson(deckNamesSchema, text).map((decks) => new Map(Object.values(decks).map((d) => [d.id, d.name])));

const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** An Anki card template filled from a note's fields: conditionals, substitutions, and any other `{{…}}` removed. */
export function renderTemplate(template: string, fields: Readonly<Record<string, string>>): string {
  const filled = (name: string) => (fields[name.trim()] ?? "").length > 0;
  let out = template
    .replace(/\{\{#([^}]+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_, name: string, body: string) => (filled(name) ? body : ""))
    .replace(/\{\{\^([^}]+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_, name: string, body: string) => (filled(name) ? "" : body));
  for (const [name, value] of Object.entries(fields)) {
    out = out.replace(new RegExp(`\\{\\{${escapeRegExp(name)}\\}\\}`, "gi"), () => value);
  }
  return out.replace(/\{\{[^}]+\}\}/g, "");
}

/** A card read from the collection with its note. */
export type AnkiRow = {
  readonly noteId: number;
  readonly modelId: number;
  readonly fields: string;
  readonly tags: string;
  readonly cardId: number;
  readonly deckId: number;
  readonly ord: number;
  readonly queue: number;
  readonly due: number;
  readonly ivl: number;
  readonly factor: number;
  readonly lapses: number;
};

export type AnkiCollection = {
  /** When the collection was made, in seconds: review due dates count days from it. */
  readonly created: number;
  readonly noteTypes: ReadonlyMap<number, NoteType>;
  readonly deckNames: ReadonlyMap<number, string>;
  readonly rows: readonly AnkiRow[];
  /** The last answer button pressed on each card, 1 to 4, by card id. */
  readonly lastEase: ReadonlyMap<number, number>;
};

/** A card forgotten more than three times is hard; any other comes in as medium. */
const complexityFromLapses = (lapses: number): Complexity => (lapses > 3 ? "hard" : "medium");

const answerFromEase = (ease: number | undefined): AnswerResult | null =>
  ease === undefined ? null : ease === 1 ? "wrong" : ease === 2 ? "approximate" : "correct";

/** When a card is due: a review counts days from the collection's making, learning holds seconds, and a new card is due on import. */
function dueAt(row: AnkiRow, created: number, importedAt: Millis): Millis {
  if (row.queue === 2) return millis((created + row.due * 86_400) * 1000);
  if (row.queue === 1 || row.queue === 3) return millis(row.due * 1000);
  return importedAt;
}

/** The title an Anki deck gets when the collection does not name it. */
export const UNNAMED_DECK = "Imported Deck";

/**
 * The collection's decks with their cards and schedules. Cloze notes, cards whose template is
 * missing and cards with an empty front are left out. `toMarkdown` converts a field's HTML.
 */
export function decksFromCollection(
  collection: AnkiCollection,
  importedAt: Millis,
  toMarkdown: (html: string) => string,
): { decks: Deck[]; schedules: CardSchedule[] } {
  const cards = new Map<number, StandardCard[]>();
  const schedules: CardSchedule[] = [];
  const ourId = (ankiDeckId: number) => `apkg-${ankiDeckId}-${importedAt}`;
  for (const row of collection.rows) {
    const type = collection.noteTypes.get(row.modelId);
    const template = type?.templates.find((t) => t.ord === row.ord);
    if (type === undefined || type.isCloze || template === undefined) continue;
    const values = row.fields.split(FIELD_SEP);
    const fields = Object.fromEntries(type.fields.map((name, i) => [name, values[i] ?? ""]));
    const front = toMarkdown(renderTemplate(template.qfmt, fields));
    if (!front) continue;
    const back = toMarkdown(renderTemplate(template.afmt.replace(/\{\{FrontSide\}\}/gi, ""), fields));
    const card: StandardCard = {
      id: `apkg-${row.noteId}-${row.ord}`,
      type: "standard",
      title: front,
      response: back,
      complexity: complexityFromLapses(row.lapses),
      tags: row.tags.trim().split(/\s+/).filter(Boolean),
    };
    cards.set(row.deckId, [...(cards.get(row.deckId) ?? []), card]);
    schedules.push({
      cardId: card.id,
      deckId: ourId(row.deckId),
      intervalDays: Math.max(0, row.ivl),
      easeFactor: row.factor >= 1300 ? row.factor / 1000 : DEFAULT_EASE,
      dueAt: dueAt(row, collection.created, importedAt),
      lastResult: answerFromEase(collection.lastEase.get(row.cardId)),
    });
  }
  const decks = [...cards].map(
    ([ankiDeckId, deckCards]): Deck => ({
      id: ourId(ankiDeckId),
      title: collection.deckNames.get(ankiDeckId) ?? UNNAMED_DECK,
      tags: [],
      cards: deckCards,
      createdAt: importedAt,
    }),
  );
  return { decks, schedules };
}

/** Anki's field checksum: a 32-bit hash of the first field's text. */
export function fieldChecksum(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (Math.imul(31, h) + text.charCodeAt(i)) | 0;
  return h >>> 0;
}

/** The Markdown on a card's back in Anki: the response, or the options with the correct ones ticked. */
export const backOf = (card: Deck["cards"][number]): string =>
  card.type === "standard" ? card.response : card.options.map((o) => `${o.correct ? "✓" : "•"} ${o.text}`).join("\n");

/** A card's scheduling columns in Anki: a card with an interval goes in the review queue, any other is new. */
export function ankiScheduling(schedule: CardSchedule | undefined, created: number) {
  if (schedule === undefined || schedule.intervalDays <= 0) return { type: 0, queue: 0, due: 0, ivl: 0, factor: 2500 };
  return {
    type: 2,
    queue: 2,
    due: Math.max(0, Math.round((schedule.dueAt / 1000 - created) / 86_400)),
    ivl: schedule.intervalDays,
    factor: Math.round(schedule.easeFactor * 1000),
  };
}

/** The schedule of one card of `deck`, for its export. */
export const scheduleOf = (schedules: ReadonlyMap<string, CardSchedule>, deck: Deck, cardId: string) =>
  schedules.get(scheduleKey(deck.id, cardId));
