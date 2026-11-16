import { Result } from "neverthrow";

import type { StoredAll } from "@/core/handover";
import type { Store } from "@/core/model";
import { type StoredError, type StoredText, changedText, readStore, storageKeys } from "@/core/stored";

export type StorageName = keyof typeof storageKeys;

/** Why the browser's storage refused a read or a write: blocked by its settings, or full. */
export type StorageError = { readonly kind: "storageRefused"; readonly name: StorageName; readonly detail: string };

const refused = (name: StorageName) => (cause: unknown): StorageError => ({
  kind: "storageRefused",
  name,
  detail: cause instanceof Error ? cause.message : String(cause),
});

const getItem = (name: StorageName): Result<string | null, StorageError> =>
  Result.fromThrowable(() => localStorage.getItem(storageKeys[name]), refused(name))();

/**
 * The text under each of the store's keys.
 *
 * @effects localStorage
 */
export function readStoredText(): Result<StoredText, StorageError> {
  return Result.combine([getItem("decks"), getItem("runs"), getItem("schedules"), getItem("settings")]).map(
    ([decks, runs, schedules, settings]) => ({ decks, runs, schedules, settings }),
  );
}

/**
 * The text stored under `name`, or null when nothing is or the browser refuses the read: the
 * language, the theme and the look then take their defaults.
 *
 * @effects localStorage
 */
export const readStoredValue = (name: "lang" | "theme" | "look"): string | null => getItem(name).unwrapOr(null);

/**
 * `text` stored under `name`.
 *
 * @effects localStorage
 */
export const writeStored = (name: StorageName, text: string): Result<void, StorageError> =>
  Result.fromThrowable(() => localStorage.setItem(storageKeys[name], text), refused(name))();

/**
 * The store as this browser holds it, or why it cannot be read. The app opens only on a store
 * that read, so a key it could not read is never written over. A browser that has stored no
 * decks and no runs gets `firstVisit`, written at once. A write it refuses is tried again on the next
 * visit.
 *
 * @effects localStorage
 */
export const openStore = (firstVisit: () => Store): Result<Store, StorageError | StoredError> =>
  readStoredText().andThen((text) =>
    readStore(text).map((store) => {
      if (text.decks !== null || text.runs !== null) return store;
      const fresh = firstVisit();
      saveChanges(store, fresh);
      return fresh;
    }),
  );

/**
 * The keys that changed from `before` to `after` written. Every change is tried, and the error is the first one refused.
 *
 * @effects localStorage
 */
export const saveChanges = (before: Store, after: Store): Result<void, StorageError> =>
  Result.combine(changedText(before, after).map(([key, text]) => writeStored(key, text))).map(() => undefined);

/**
 * The text under every key the app stores, the store's and the language's, theme's and look's.
 *
 * @effects localStorage
 */
export function readStoredAll(): Result<StoredAll, StorageError> {
  return readStoredText().andThen((text) =>
    Result.combine([getItem("lang"), getItem("theme"), getItem("look")]).map(([lang, theme, look]) => ({ ...text, lang, theme, look })),
  );
}
