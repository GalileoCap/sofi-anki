import { Result, ok } from "neverthrow";
import { z } from "zod";

import { type DecodeError, decodeJson } from "@/core/decode";
import {
  DEFAULT_LANG,
  DEFAULT_SETTINGS,
  DEFAULT_THEME,
  type Lang,
  type Store,
  type Theme,
  deckSchema,
  langs,
  runSchema,
  scheduleSchema,
  settingsSchema,
  themes,
} from "@/core/model";

/** The `localStorage` keys, unchanged since the first version so stored data keeps reading. */
export const storageKeys = {
  decks: "anki-decks",
  runs: "anki-runs",
  schedules: "anki-srs",
  settings: "anki-settings",
  lang: "lang",
  theme: "anki-theme",
} as const;

export type StoreKey = "decks" | "runs" | "schedules" | "settings";

/** The text stored under each of the store's keys, null where nothing is. */
export type StoredText = Readonly<Record<StoreKey, string | null>>;

/** A stored value that does not decode, named by its key. The app refuses to overwrite it. */
export type StoredError = { readonly kind: "unreadable"; readonly key: StoreKey; readonly error: DecodeError };

const read = <T>(key: StoreKey, schema: z.ZodType<T>, text: string | null, nothing: T): Result<T, StoredError> =>
  text === null
    ? ok(nothing)
    : decodeJson(schema, text).mapErr((error): StoredError => ({ kind: "unreadable", key, error }));

/** The store from what `localStorage` holds. A key with nothing under it reads as empty. */
export function readStore(text: StoredText): Result<Store, StoredError> {
  return Result.combine([
    read("decks", z.array(deckSchema), text.decks, []),
    read("runs", z.array(runSchema), text.runs, []),
    read("schedules", z.array(scheduleSchema), text.schedules, []),
    read("settings", settingsSchema, text.settings, DEFAULT_SETTINGS),
  ]).map(([decks, runs, schedules, settings]) => ({ decks, runs, schedules, settings }));
}

/** The stored language, or `DEFAULT_LANG` when none or an unknown one is stored. */
export const readLang = (text: string | null): Lang =>
  langs.find((lang) => lang === text) ?? DEFAULT_LANG;

/** The stored theme, or `DEFAULT_THEME` when none or an unknown one is stored. */
export const readTheme = (text: string | null): Theme =>
  themes.find((theme) => theme === text) ?? DEFAULT_THEME;

const storeKeys: readonly StoreKey[] = ["decks", "runs", "schedules", "settings"];

/** The text to store under each key whose value changed from `before` to `after`. */
export const changedText = (before: Store, after: Store): [StoreKey, string][] =>
  storeKeys.filter((key) => before[key] !== after[key]).map((key) => [key, JSON.stringify(after[key])]);
