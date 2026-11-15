import { describe, expect, test } from "vitest";

import { type Card, type Deck, type Store, DEFAULT_SETTINGS, millis } from "@/core/model";
import { deckItems, runQueue, runsByDeck, withRuns } from "@/core/run";
import { indexSchedules, scheduleKey } from "@/core/scheduler";

/**
 * O1 (nobody loses their decks or study history): a run across decks is kept as one run per
 * deck, each card under its own id, so every stored run keeps the shape it always had. A card
 * filed under the wrong deck or id loses its history without a word, so this stays.
 */

const card = (id: string, title: string): Card => ({ id, type: "standard", title, response: "", complexity: "medium", tags: [] });
const deck = (id: string, cards: Card[]): Deck => ({ id, title: id, tags: [], cards, createdAt: millis(0) });
const a = deck("a", [card("c1", "A one"), card("c2", "A two")]);
const b = deck("b", [card("c1", "B one")]);
const items = [...deckItems(a, a.cards), ...deckItems(b, b.cards)];

describe("a run across decks", () => {
  test("cards with the same id in two decks stay apart in the queue", () => {
    const ids = runQueue(items).map((c) => c.id);
    expect(new Set(ids).size).toBe(3);
  });

  test("is kept as one run per deck, each card under its own id, the time shared by time spent", () => {
    const queue = runQueue(items);
    const results = queue.map((c, i) => ({ card: c, attempts: [{ result: "correct" as const, durationMs: [1000, 1000, 2000][i] }] }));
    let n = 0;
    const runs = runsByDeck(results, items, millis(5), 8000, () => `r${n++}`);
    expect(runs.map((r) => [r.deckId, r.totalTimeMs, r.results.map((x) => x.card)])).toEqual([
      ["a", 4000, a.cards],
      ["b", 4000, b.cards],
    ]);
    const store: Store = { decks: [a, b], runs: [], schedules: [], settings: DEFAULT_SETTINGS };
    const schedules = indexSchedules(withRuns(store, runs).schedules);
    expect([...schedules.keys()].sort()).toEqual([scheduleKey("a", "c1"), scheduleKey("a", "c2"), scheduleKey("b", "c1")]);
  });
});
