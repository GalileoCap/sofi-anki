import { describe, expect, test } from "vitest";

import { readBackup, restore, writeBackup } from "@/core/backup";
import { type Deck, type Store, millis } from "@/core/model";
import { readLang, readStore, readTheme } from "@/core/stored";

import oldSeed from "./fixtures/old-seed-storage.json";

/**
 * O1, nobody loses their decks or study history: every shape an earlier version stored reads,
 * and what does not read is refused rather than replaced with nothing.
 */

const text = (value: unknown) => JSON.stringify(value);
const empty = { decks: null, runs: null, schedules: null, settings: null };

describe("stored data from every earlier version reads", () => {
  test("the first version's deck: no complexity, type, tags, hint, color or emoji", () => {
    const first = [{ id: "d1", title: "Old", createdAt: 1_700_000_000_000, cards: [{ id: "c1", title: "Q", response: "A" }] }];
    const store = readStore({ ...empty, decks: text(first) })._unsafeUnwrap();
    expect(store.decks).toEqual([
      {
        id: "d1",
        title: "Old",
        tags: [],
        createdAt: 1_700_000_000_000,
        cards: [{ id: "c1", type: "standard", title: "Q", response: "A", complexity: "medium", tags: [] }],
      },
    ]);
  });

  test("a choice card and a run of the version before tags, whose snapshot card has no tags", () => {
    const choice = {
      id: "c2",
      type: "choice",
      title: "Pick",
      complexity: "hard",
      multiSelect: false,
      options: [{ id: "o1", text: "x", correct: true }],
    };
    const run = {
      id: "r1",
      deckId: "d1",
      completedAt: 1_700_000_100_000,
      totalTimeMs: 5000,
      results: [{ card: choice, attempts: [{ result: "correct", durationMs: 900 }] }],
    };
    const store = readStore({
      ...empty,
      decks: text([{ id: "d1", title: "T", createdAt: 1, cards: [choice] }]),
      runs: text([run]),
    })._unsafeUnwrap();
    expect(store.decks[0].cards[0]).toEqual({ ...choice, tags: [] });
    expect(store.runs[0].results[0].card).toEqual({ ...choice, tags: [] });
  });

  test("everything the last version's demo seed wrote: two decks of 12 cards, 17 runs, 24 schedules", () => {
    const store = readStore({
      decks: oldSeed["anki-decks"],
      runs: oldSeed["anki-runs"],
      schedules: oldSeed["anki-srs"],
      settings: null,
    })._unsafeUnwrap();
    expect([store.decks.map((d) => d.cards.length), store.runs.length, store.schedules.length]).toEqual([[12, 12], 17, 24]);
  });

  test("settings stored before a field existed take its default, and nothing stored reads as empty", () => {
    expect(readStore({ ...empty, settings: "{}" })._unsafeUnwrap().settings).toEqual({ dailyCardGoal: 20 });
    expect(readStore(empty)._unsafeUnwrap()).toEqual({ decks: [], runs: [], schedules: [], settings: { dailyCardGoal: 20 } });
    expect([readLang("es"), readLang(null), readTheme("dark"), readTheme("sepia")]).toEqual(["es", "en", "dark", "system"]);
  });

  test("a value that does not decode is an error naming its key, never an empty list", () => {
    const result = readStore({ ...empty, runs: '[{"id": 3}]' });
    expect(result._unsafeUnwrapErr()).toMatchObject({ kind: "unreadable", key: "runs", error: { kind: "badShape" } });
  });
});

describe("restoring a backup (A3, a restore refuses a non-backup)", () => {
  const deck = (id: string): Deck => ({ id, title: id, tags: [], cards: [], createdAt: millis(1) });
  const store: Store = { decks: [deck("a")], runs: [], schedules: [], settings: { dailyCardGoal: 5 } };

  test("a file that is not a backup is refused: a shared deck, an empty object, or not JSON", () => {
    for (const file of [text({ title: "A shared deck", cards: [] }), "{}", "not json"]) {
      expect(readBackup(file).isErr()).toBe(true);
    }
  });

  test("a backup written by the first version restores, replacing or merging by id", () => {
    const backup = readBackup(
      text({ version: 1, exportedAt: 2, decks: [deck("a"), deck("b")], runs: [], srs: [], settings: { dailyCardGoal: 9 } }),
    )._unsafeUnwrap();
    expect(restore(store, backup, "replace").decks.map((d) => d.id)).toEqual(["a", "b"]);
    expect(restore(store, backup, "replace").settings.dailyCardGoal).toBe(9);
    const merged = restore({ ...store, decks: [{ ...deck("a"), title: "mine" }] }, backup, "merge");
    expect(merged.decks.map((d) => [d.id, d.title])).toEqual([["a", "mine"], ["b", "b"]]);
    expect(merged.settings.dailyCardGoal).toBe(5);
  });

  test("a backup this version writes reads back as the same store", () => {
    expect(restore(store, readBackup(writeBackup(store, millis(3)))._unsafeUnwrap(), "replace")).toEqual(store);
  });
});
