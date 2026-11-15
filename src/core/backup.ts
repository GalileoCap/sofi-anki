import type { Result } from "neverthrow";
import { z } from "zod";

import { type DecodeError, decodeJson } from "@/core/decode";
import {
  type CardSchedule,
  type Millis,
  type Store,
  deckSchema,
  millisSchema,
  runSchema,
  scheduleSchema,
  settingsSchema,
} from "@/core/model";

/** A backup file: the whole store, as written since the first version. */
export const backupSchema = z.object({
  version: z.literal(1),
  exportedAt: millisSchema.optional(),
  decks: z.array(deckSchema),
  runs: z.array(runSchema),
  srs: z.array(scheduleSchema),
  settings: settingsSchema,
});
export type Backup = z.infer<typeof backupSchema>;

export type RestoreMode = "replace" | "merge";

/** The backup file's text for `store`, written at `now`. */
export function writeBackup(store: Store, now: Millis): string {
  const backup: Backup = {
    version: 1,
    exportedAt: now,
    decks: [...store.decks],
    runs: [...store.runs],
    srs: [...store.schedules],
    settings: store.settings,
  };
  return JSON.stringify(backup, null, 2);
}

/** `text` as a backup, or why it is not one. A file that is not a backup changes nothing. */
export const readBackup = (text: string): Result<Backup, DecodeError> => decodeJson(backupSchema, text);

const scheduleKey = (schedule: CardSchedule): string => `${schedule.deckId}:${schedule.cardId}`;

/** Items of `incoming` whose key is not among `current`'s, after `current`. */
function added<T>(current: readonly T[], incoming: readonly T[], key: (item: T) => string): T[] {
  const known = new Set(current.map(key));
  return [...current, ...incoming.filter((item) => !known.has(key(item)))];
}

/**
 * The store after restoring `backup`. Replace takes the backup whole. Merge adds the decks, runs
 * and schedules the store lacks, by id, and keeps the store's settings.
 */
export function restore(store: Store, backup: Backup, mode: RestoreMode): Store {
  if (mode === "replace") {
    return { decks: backup.decks, runs: backup.runs, schedules: backup.srs, settings: backup.settings };
  }
  return {
    decks: added(store.decks, backup.decks, (deck) => deck.id),
    runs: added(store.runs, backup.runs, (run) => run.id),
    schedules: added(store.schedules, backup.srs, scheduleKey),
    settings: store.settings,
  };
}
