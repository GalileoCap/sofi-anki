import { describe, expect, test } from "vitest";

import { type StoredAll, takeHandOver } from "@/core/handover";

/**
 * O1 across the move to the new address (A17): what the old address sends never takes away
 * anything the new one holds, and data that does not read writes nothing.
 */

const text = (value: unknown) => JSON.stringify(value);
const nothing: StoredAll = { decks: null, runs: null, schedules: null, settings: null, lang: null, theme: null, look: null };
const deck = (id: string) => ({ id, title: id, tags: [], createdAt: 1, cards: [] });
const run = (id: string) => ({ id, deckId: "d1", completedAt: 2, totalTimeMs: 1, results: [] });

const old: StoredAll = {
  ...nothing,
  decks: text([deck("d1"), deck("d2")]),
  runs: text([run("r1")]),
  settings: text({ dailyGoal: 30 }),
  lang: "es",
  theme: "dark",
};

describe("the new address takes the old address's data", () => {
  test("an address that has stored nothing takes every key's text as it was", () => {
    const writes = takeHandOver(nothing, old)._unsafeUnwrap();
    expect(Object.fromEntries(writes)).toEqual({ decks: old.decks, runs: old.runs, settings: old.settings, lang: "es", theme: "dark" });
  });

  test("an address that holds decks keeps them and its settings, and adds only the decks and runs it lacks", () => {
    const here: StoredAll = { ...nothing, decks: text([{ ...deck("d1"), title: "mine" }, deck("d3")]), settings: text({ dailyGoal: 10 }) };
    const writes = Object.fromEntries(takeHandOver(here, old)._unsafeUnwrap());
    expect(JSON.parse(writes.decks ?? "").map((d: { id: string; title: string }) => [d.id, d.title])).toEqual([
      ["d1", "mine"],
      ["d3", "d3"],
      ["d2", "d2"],
    ]);
    expect(JSON.parse(writes.runs ?? "").map((r: { id: string }) => r.id)).toEqual(["r1"]);
    expect(writes.settings).toBeUndefined();
    expect(writes.lang).toBeUndefined();
  });

  test("data that does not read is refused, and nothing is written", () => {
    expect(takeHandOver(nothing, { ...old, decks: "{not json" }).isErr()).toBe(true);
  });
});
