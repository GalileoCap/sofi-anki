import { describe, expect, test } from "vitest";

import { DEFAULT_SETTINGS, type Card, type Deck, type RunRecord, type Store, millis } from "@/core/model";
import { NO_STAMPS, type Synced, mergeSynced, readSyncFile, stampChanges, writeSyncFile } from "@/core/sync";

/**
 * O11 and O1: what two devices change apart, offline included, all shows on both once they
 * sync, and nothing is lost. A device here is a store and its stamps, changed the way `useStore`
 * changes it.
 */

const card = (id: string, title: string): Card => ({ id, type: "standard", title, response: "A", complexity: "medium", tags: [] });
const deck = (id: string, cards: Card[]): Deck => ({ id, title: id, tags: [], cards, createdAt: millis(1) });
const run = (id: string, deckId: string): RunRecord => ({ id, deckId, completedAt: millis(5), totalTimeMs: 1, results: [] });

const start: Store = { decks: [deck("d1", [card("c1", "one"), card("c2", "two")])], runs: [], schedules: [], settings: DEFAULT_SETTINGS };
const fresh: Synced = { store: start, stamps: NO_STAMPS };

/** `device` after `change` at moment `at`. */
const change = (device: Synced, at: number, edit: (store: Store) => Store): Synced => {
  const after = edit(device.store);
  return { store: after, stamps: stampChanges(device.stamps, device.store, after, millis(at)) };
};

const editCard = (id: string, title: string) => (store: Store): Store => ({
  ...store,
  decks: store.decks.map((d) => ({ ...d, cards: d.cards.map((c) => (c.id === id ? { ...c, title } : c)) })),
});

/** Both devices after A syncs, then B, then A again: what each holds once both have synced. */
function syncBoth(a: Synced, b: Synced): [Synced, Synced] {
  const file1 = mergeSynced(a, fresh);
  const b2 = mergeSynced(b, file1);
  const a2 = mergeSynced(a, b2);
  return [a2, b2];
}

describe("two devices that change apart agree once both sync", () => {
  test("runs made on each device offline are all kept", () => {
    const a = change(fresh, 10, (s) => ({ ...s, runs: [...s.runs, run("r1", "d1")] }));
    const b = change(fresh, 11, (s) => ({ ...s, runs: [...s.runs, run("r2", "d1")] }));
    const [a2, b2] = syncBoth(a, b);
    expect(a2.store.runs.map((r) => r.id).sort()).toEqual(["r1", "r2"]);
    expect(b2.store).toEqual(a2.store);
  });

  test("different cards of one deck edited on each device keep both edits", () => {
    const a = change(fresh, 10, editCard("c1", "one from A"));
    const b = change(fresh, 11, editCard("c2", "two from B"));
    const [a2, b2] = syncBoth(a, b);
    expect(a2.store.decks[0].cards.map((c) => c.title)).toEqual(["one from A", "two from B"]);
    expect(b2.store).toEqual(a2.store);
  });

  test("one card edited on both devices keeps the later edit", () => {
    const a = change(fresh, 12, editCard("c1", "later"));
    const b = change(fresh, 11, editCard("c1", "earlier"));
    const [a2, b2] = syncBoth(a, b);
    expect(a2.store.decks[0].cards[0].title).toBe("later");
    expect(b2.store).toEqual(a2.store);
  });

  test("a deck deleted on one device is gone from the other, which left it alone", () => {
    const a = change(fresh, 10, (s) => ({ ...s, decks: [] }));
    const [a2, b2] = syncBoth(a, fresh);
    expect(a2.store.decks).toEqual([]);
    expect(b2.store.decks).toEqual([]);
  });

  test("a deck deleted on one device and edited later on the other comes back", () => {
    const a = change(fresh, 10, (s) => ({ ...s, decks: [] }));
    const b = change(fresh, 20, editCard("c1", "kept"));
    const [a2, b2] = syncBoth(a, b);
    expect(a2.store.decks.map((d) => d.cards.map((c) => c.title))).toEqual([["kept", "two"]]);
    expect(b2.store).toEqual(a2.store);
  });

  test("a card deleted on one device stays deleted after the other syncs", () => {
    const a = change(fresh, 10, (s) => ({ ...s, decks: s.decks.map((d) => ({ ...d, cards: d.cards.filter((c) => c.id !== "c2") })) }));
    const [a2, b2] = syncBoth(a, fresh);
    expect(b2.store.decks[0].cards.map((c) => c.id)).toEqual(["c1"]);
    expect(a2.store).toEqual(b2.store);
  });

  test("data stored before stamps, different on each device, is joined with nothing lost", () => {
    const a: Synced = { store: { ...start, decks: [deck("d1", [card("c1", "on A")])] }, stamps: NO_STAMPS };
    const b: Synced = { store: { ...start, decks: [deck("d1", [card("c1", "on B")]), deck("d2", [])] }, stamps: NO_STAMPS };
    const [a2, b2] = syncBoth(a, b);
    expect(a2.store.decks.map((d) => d.id).sort()).toEqual(["d1", "d2"]);
    expect(b2.store).toEqual(a2.store);
  });

  test("a store merged with the file it came from is that file, so nothing is uploaded again", () => {
    const a = change(fresh, 10, editCard("c1", "x"));
    const file = mergeSynced(a, fresh);
    expect(mergeSynced(file, file)).toEqual(file);
    expect(mergeSynced(a, file)).toEqual(file);
  });

  test("the sync file reads back as written", () => {
    const a = change(fresh, 10, (s) => ({ ...s, decks: [] }));
    expect(readSyncFile(writeSyncFile(a))._unsafeUnwrap()).toEqual(a);
  });
});
