import { describe, expect, test } from "vitest";

import { type AnkiCollection, decksFromCollection, noteTypesFromJson, renderTemplate } from "@/core/anki";
import { type Deck, millis } from "@/core/model";
import { decodeDeck, encodeDeck, shareUrl } from "@/core/share";

const deck: Deck = {
  id: "d1",
  title: "Capitals ñ 東京",
  tags: ["geo"],
  createdAt: millis(1_700_000_000_000),
  cards: [{ id: "c1", type: "standard", title: "France?", response: "**Paris**", complexity: "easy", tags: [] }],
};

/** How the first version encoded a link: the browser's gzip, then base64url. */
async function firstVersionEncoding(value: Deck): Promise<string> {
  const stream = new Blob([JSON.stringify(value)]).stream().pipeThrough(new CompressionStream("gzip"));
  const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

describe("O2, a friend studies a deck someone shared", () => {
  test("a link the first version made opens the same deck", async () => {
    expect(decodeDeck(await firstVersionEncoding(deck))._unsafeUnwrap()).toEqual(deck);
  });

  test("a link this version makes opens the same deck, and a broken one is refused", () => {
    expect(decodeDeck(encodeDeck(deck))._unsafeUnwrap()).toEqual(deck);
    expect(decodeDeck("not-a-deck")._unsafeUnwrapErr().kind).toBe("notALink");
    expect(shareUrl("https://x/", { ...deck, cards: [] })).toMatch(/^https:\/\/x\/#\/share\//);
  });
});

describe("O4, a deck made in Anki can be studied", () => {
  const models = JSON.stringify({
    "10": {
      id: 10,
      type: 0,
      flds: [{ name: "Back", ord: 1 }, { name: "Front", ord: 0 }],
      tmpls: [{ ord: 0, qfmt: "{{Front}}{{#Extra}}!{{/Extra}}", afmt: "{{FrontSide}}<hr>{{Back}}" }],
    },
    "11": { id: 11, type: 1, flds: [{ name: "Text", ord: 0 }], tmpls: [{ ord: 0, qfmt: "{{cloze:Text}}", afmt: "" }] },
  });
  const row = { noteId: 1, modelId: 10, fields: "Q\x1fA", tags: " a b ", cardId: 100, deckId: 5, ord: 0, queue: 2, due: 3, ivl: 4, factor: 2600, lapses: 5 };

  test("rows of an older collection become cards with their schedule, cloze notes left out", () => {
    const collection: AnkiCollection = {
      created: 1_000,
      noteTypes: noteTypesFromJson(models)._unsafeUnwrap(),
      deckNames: new Map([[5, "Spanish"]]),
      rows: [row, { ...row, noteId: 2, modelId: 11, fields: "x" }, { ...row, noteId: 3, fields: "\x1fA" }],
      lastEase: new Map([[100, 2]]),
    };
    const { decks, schedules } = decksFromCollection(collection, millis(9_000), (html) => html.trim());
    expect(decks).toEqual([
      {
        id: "apkg-5-9000",
        title: "Spanish",
        tags: [],
        createdAt: 9_000,
        cards: [{ id: "apkg-1-0", type: "standard", title: "Q", response: "A", complexity: "hard", tags: ["a", "b"] }],
      },
    ]);
    expect(schedules).toEqual([
      { cardId: "apkg-1-0", deckId: "apkg-5-9000", intervalDays: 4, easeFactor: 2.6, dueAt: (1_000 + 3 * 86_400) * 1000, lastResult: "approximate" },
    ]);
  });

  test("an answer leaves out the question and the rule Anki draws under it", () => {
    const basic = JSON.stringify({
      "10": { id: 10, type: 0, flds: [{ name: "Front", ord: 0 }, { name: "Back", ord: 1 }], tmpls: [{ ord: 0, qfmt: "{{Front}}", afmt: "{{FrontSide}}\n\n<hr id=answer>\n\n{{Back}}" }] },
    });
    const collection: AnkiCollection = {
      created: 1_000,
      noteTypes: noteTypesFromJson(basic)._unsafeUnwrap(),
      deckNames: new Map(),
      rows: [row],
      lastEase: new Map(),
    };
    expect(decksFromCollection(collection, millis(9_000), (html) => html.trim()).decks[0].cards[0]).toMatchObject({ title: "Q", response: "A" });
  });

  test("a template's conditionals and substitutions fill from the fields", () => {
    expect(renderTemplate("{{#A}}a:{{A}}{{/A}}{{^B}}no b{{/B}}{{Other}}", { A: "1", B: "" })).toBe("a:1no b");
  });
});
