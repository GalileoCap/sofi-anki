import { Result } from "neverthrow";

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
 * language and the theme then take their defaults.
 *
 * @effects localStorage
 */
export const readStoredValue = (name: "lang" | "theme"): string | null => getItem(name).unwrapOr(null);

/**
 * `text` stored under `name`.
 *
 * @effects localStorage
 */
export const writeStored = (name: StorageName, text: string): Result<void, StorageError> =>
  Result.fromThrowable(() => localStorage.setItem(storageKeys[name], text), refused(name))();

/**
 * The store as this browser holds it, or why it cannot be read. The app opens only on a store
 * that read, so a key it could not read is never written over.
 *
 * @effects localStorage
 */
export const loadStore = (): Result<Store, StorageError | StoredError> => readStoredText().andThen(readStore);

/**
 * The keys that changed from `before` to `after` written. Every change is tried, and the error is the first one refused.
 *
 * @effects localStorage
 */
export const saveChanges = (before: Store, after: Store): Result<void, StorageError> =>
  Result.combine(changedText(before, after).map(([key, text]) => writeStored(key, text))).map(() => undefined);
