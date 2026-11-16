import type { Result } from "neverthrow";
import { z } from "zod";

import { type DecodeError, decodeJson } from "@/core/decode";
import {
  type Card,
  type CardSchedule,
  type Deck,
  type Millis,
  type Store,
  deckSchema,
  millisSchema,
  runSchema,
  scheduleSchema,
  settingsSchema,
} from "@/core/model";

/**
 * When each item last changed on a device, and when each was removed, keyed by `itemKey`. An
 * item missing from `changed` was stored before stamps existed and counts as changed at zero.
 */
export type Stamps = {
  readonly changed: Readonly<Record<string, Millis>>;
  readonly removed: Readonly<Record<string, Millis>>;
};

export const stampsSchema = z.object({
  changed: z.record(z.string(), millisSchema),
  removed: z.record(z.string(), millisSchema),
});

export const NO_STAMPS: Stamps = { changed: {}, removed: {} };

/** A device's store with its stamps: what sync merges, and what the file in Drive holds. */
export type Synced = { readonly store: Store; readonly stamps: Stamps };

const scheduleId = (schedule: CardSchedule): string => `${schedule.deckId}:${schedule.cardId}`;

/** The key an item's stamps are kept under. A deck's key stamps its own fields and card order, apart from its cards. */
const itemKey = {
  deck: (id: string) => `deck:${id}`,
  card: (deckId: string, cardId: string) => `card:${deckId}:${cardId}`,
  run: (id: string) => `run:${id}`,
  schedule: (schedule: CardSchedule) => `schedule:${scheduleId(schedule)}`,
  settings: "settings",
};

const same = (a: unknown, b: unknown): boolean => a === b || JSON.stringify(a) === JSON.stringify(b);

/** A deck's own fields and its card order, which its deck stamp covers. */
const deckOwn = ({ cards, ...own }: Deck) => ({ ...own, cardIds: cards.map((card) => card.id) });

/** What changed between `before` and `after`, keyed, with `true` for an item added or changed and `false` for one removed. */
function changesBetween(before: Store, after: Store): Map<string, boolean> {
  const changes = new Map<string, boolean>();
  const diff = <T>(was: readonly T[], now: readonly T[], id: (item: T) => string, key: (item: T) => string, onBoth?: (a: T, b: T) => void) => {
    if (was === now) return;
    const old = new Map(was.map((item) => [id(item), item]));
    for (const item of now) {
      const prior = old.get(id(item));
      old.delete(id(item));
      if (prior === undefined) changes.set(key(item), true);
      else if (prior === item) continue;
      else if (onBoth) onBoth(prior, item);
      else if (!same(prior, item)) changes.set(key(item), true);
    }
    for (const gone of old.values()) changes.set(key(gone), false);
  };
  diff(before.decks, after.decks, (d) => d.id, (d) => itemKey.deck(d.id), (was, now) => {
    if (!same(deckOwn(was), deckOwn(now))) changes.set(itemKey.deck(now.id), true);
    diff<Card>(was.cards, now.cards, (c) => c.id, (c) => itemKey.card(now.id, c.id));
  });
  diff(before.runs, after.runs, (r) => r.id, (r) => itemKey.run(r.id));
  diff(before.schedules, after.schedules, scheduleId, itemKey.schedule);
  if (before.settings !== after.settings && !same(before.settings, after.settings)) changes.set(itemKey.settings, true);
  return changes;
}

/** `stamps` with what changed from `before` to `after` stamped at `at`. */
export function stampChanges(stamps: Stamps, before: Store, after: Store, at: Millis): Stamps {
  const changes = changesBetween(before, after);
  if (changes.size === 0) return stamps;
  const changed = { ...stamps.changed };
  const removed = { ...stamps.removed };
  for (const [key, kept] of changes) (kept ? changed : removed)[key] = at;
  return { changed, removed };
}

const later = (a: Millis | undefined, b: Millis | undefined): Millis | undefined => (a === undefined ? b : b === undefined ? a : a > b ? a : b);

/** Both sides' stamps joined: the later of each. */
function joinStamps(a: Stamps, b: Stamps): Stamps {
  const join = (x: Readonly<Record<string, Millis>>, y: Readonly<Record<string, Millis>>) => {
    const out: Record<string, Millis> = { ...x };
    for (const [key, at] of Object.entries(y)) out[key] = later(out[key], at) ?? at;
    return out;
  };
  return { changed: join(a.changed, b.changed), removed: join(a.removed, b.removed) };
}

type Side<T> = { readonly item: T; readonly at: number };

/** The side to keep: the later, and on equal stamps the one whose text sorts later, so both devices choose alike. */
const pick = <T>(a: Side<T>, b: Side<T>): T =>
  a.at !== b.at ? (a.at > b.at ? a.item : b.item) : JSON.stringify(a.item) >= JSON.stringify(b.item) ? a.item : b.item;

/**
 * `remote`'s items and then the ones only `local` has, each the later of the two, without those
 * removed no earlier than their last change. `lastChange` is an item's stamp, which for a deck
 * counts its cards.
 */
function mergeList<T>(
  local: readonly T[],
  remote: readonly T[],
  id: (item: T) => string,
  lastChange: (item: T, side: Stamps) => number,
  removedAt: (item: T) => number | undefined,
  stamps: { local: Stamps; remote: Stamps },
  join: (local: Side<T>, remote: Side<T>) => T = (l, r) => pick(l, r),
): T[] {
  const mine = new Map(local.map((item) => [id(item), item]));
  const theirs = new Map(remote.map((item) => [id(item), item]));
  const ids = [...new Set([...theirs.keys(), ...mine.keys()])];
  return ids.flatMap((key) => {
    const l = mine.get(key);
    const r = theirs.get(key);
    const mineSide = l === undefined ? undefined : { item: l, at: lastChange(l, stamps.local) };
    const theirSide = r === undefined ? undefined : { item: r, at: lastChange(r, stamps.remote) };
    const [kept, at] =
      mineSide && theirSide
        ? [join(mineSide, theirSide), Math.max(mineSide.at, theirSide.at)]
        : mineSide
          ? [mineSide.item, mineSide.at]
          : theirSide
            ? [theirSide.item, theirSide.at]
            : [];
    if (kept === undefined || at === undefined) return [];
    const gone = removedAt(kept);
    return gone !== undefined && gone >= at ? [] : [kept];
  });
}

/** `local` and `remote` merged: for each item the later change, removals no earlier than an item's last change applied. */
export function mergeSynced(local: Synced, remote: Synced): Synced {
  const stamps = joinStamps(local.stamps, remote.stamps);
  const both = { local: local.stamps, remote: remote.stamps };
  const at = (side: Stamps, key: string) => side.changed[key] ?? 0;
  const gone = (key: string) => stamps.removed[key];

  const cardsOf = (deck: Deck | undefined) => deck?.cards ?? [];
  const deckAt = (deck: Deck, side: Stamps) =>
    Math.max(at(side, itemKey.deck(deck.id)), ...deck.cards.map((card) => at(side, itemKey.card(deck.id, card.id))));
  const joinDecks = (l: Side<Deck>, r: Side<Deck>): Deck => {
    const own = pick(
      { item: l.item, at: at(local.stamps, itemKey.deck(l.item.id)) },
      { item: r.item, at: at(remote.stamps, itemKey.deck(r.item.id)) },
    );
    const other = own === l.item ? r.item : l.item;
    const cards = mergeList<Card>(
      cardsOf(l.item),
      cardsOf(r.item),
      (card) => card.id,
      (card, side) => at(side, itemKey.card(own.id, card.id)),
      (card) => gone(itemKey.card(own.id, card.id)),
      both,
    );
    const byId = new Map(cards.map((card) => [card.id, card]));
    const order = [...own.cards, ...other.cards].map((card) => card.id);
    return { ...own, cards: [...new Set(order)].flatMap((id) => byId.get(id) ?? []) };
  };

  const decks = mergeList(local.store.decks, remote.store.decks, (d) => d.id, deckAt, (d) => gone(itemKey.deck(d.id)), both, joinDecks);
  const runs = mergeList(
    local.store.runs,
    remote.store.runs,
    (r) => r.id,
    (r, side) => at(side, itemKey.run(r.id)),
    (r) => gone(itemKey.run(r.id)),
    both,
  );
  const schedules = mergeList(
    local.store.schedules,
    remote.store.schedules,
    scheduleId,
    (s, side) => at(side, itemKey.schedule(s)),
    (s) => gone(itemKey.schedule(s)),
    both,
  );
  const settings = pick(
    { item: local.store.settings, at: at(local.stamps, itemKey.settings) },
    { item: remote.store.settings, at: at(remote.stamps, itemKey.settings) },
  );
  return { store: { decks, runs, schedules, settings }, stamps };
}

/** The file sync keeps in the person's Drive. */
const syncFileSchema = z.object({
  version: z.literal(1),
  decks: z.array(deckSchema),
  runs: z.array(runSchema),
  schedules: z.array(scheduleSchema),
  settings: settingsSchema,
  stamps: stampsSchema,
});

/** The sync file's text for `synced`. */
export const writeSyncFile = ({ store, stamps }: Synced): string => JSON.stringify({ version: 1, ...store, stamps });

/** `text` as a sync file, or why it is not one. */
export const readSyncFile = (text: string): Result<Synced, DecodeError> =>
  decodeJson(syncFileSchema, text).map(({ decks, runs, schedules, settings, stamps }) => ({ store: { decks, runs, schedules, settings }, stamps }));

/** Whether two synced stores hold the same, so neither needs writing over the other. */
export const sameSynced = (a: Synced, b: Synced): boolean => same(writeSyncFile(a), writeSyncFile(b));
