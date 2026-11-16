import { Result, ok } from "neverthrow";
import { z } from "zod";

import { type DecodeError, decodeJson } from "@/core/decode";
import {
  DEFAULT_LANG,
  DEFAULT_LOOK,
  DEFAULT_SETTINGS,
  DEFAULT_THEME,
  type AppLook,
  type DeckView,
  type Lang,
  type Store,
  type Theme,
  appLooks,
  deckSchema,
  deckViews,
  langs,
  lookDeckView,
  millisSchema,
  runSchema,
  scheduleSchema,
  settingsSchema,
  themes,
} from "@/core/model";
import { NO_STAMPS, type Stamps, stampsSchema } from "@/core/sync";

/** The `localStorage` keys, unchanged since the first version so stored data keeps reading. */
export const storageKeys = {
  decks: "anki-decks",
  runs: "anki-runs",
  schedules: "anki-srs",
  settings: "anki-settings",
  lang: "lang",
  theme: "anki-theme",
  look: "anki-look",
  deckView: "anki-deck-view",
  syncStamps: "anki-sync-stamps",
  sync: "anki-sync",
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

/** The stored sync stamps, or none when nothing or something unreadable is stored: stamps only order changes, so losing them loses no data. */
export const readStamps = (text: string | null): Stamps =>
  text === null ? NO_STAMPS : decodeJson(stampsSchema, text).unwrapOr(NO_STAMPS);

/** Whether this browser has turned sync on, the Google access token it holds until the token expires, and its sealed renewal token. */
export const syncStateSchema = z.object({
  on: z.boolean(),
  token: z.string().optional(),
  expiresAt: millisSchema.optional(),
  /** The renewal token the token server sealed (A20), which renews `token` with no click. */
  sealed: z.string().optional(),
});
export type SyncState = z.infer<typeof syncStateSchema>;
export const SYNC_OFF: SyncState = { on: false };

/** The stored sync state, or off when none or an unreadable one is stored. */
export const readSyncState = (text: string | null): SyncState =>
  text === null ? SYNC_OFF : decodeJson(syncStateSchema, text).unwrapOr(SYNC_OFF);

/** The stored language, or `DEFAULT_LANG` when none or an unknown one is stored. */
export const readLang = (text: string | null): Lang =>
  langs.find((lang) => lang === text) ?? DEFAULT_LANG;

/** The stored theme, or `DEFAULT_THEME` when none or an unknown one is stored. */
export const readTheme = (text: string | null): Theme =>
  themes.find((theme) => theme === text) ?? DEFAULT_THEME;

/** The stored look, or `DEFAULT_LOOK` when none or an unknown one is stored. */
export const readLook = (text: string | null): AppLook =>
  appLooks.find((look) => look === text) ?? DEFAULT_LOOK;

/** The stored deck view, or the view `look` opens on when none or an unknown one is stored. */
export const readDeckView = (text: string | null, look: AppLook): DeckView =>
  deckViews.find((view) => view === text) ?? lookDeckView[look];

const storeKeys: readonly StoreKey[] = ["decks", "runs", "schedules", "settings"];

/** The text to store under each key whose value changed from `before` to `after`. */
export const changedText = (before: Store, after: Store): [StoreKey, string][] =>
  storeKeys.filter((key) => before[key] !== after[key]).map((key) => [key, JSON.stringify(after[key])]);
