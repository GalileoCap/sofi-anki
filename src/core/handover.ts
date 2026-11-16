import { type Result, ok } from "neverthrow";
import { z } from "zod";

import { restore } from "@/core/backup";
import { type StoredError, changedText, readStore, storageKeys } from "@/core/stored";

/** A name of the stored keys the hand-over carries: those the old address held. The deck view came after the move. */
export type StoredName = Exclude<keyof typeof storageKeys, "deckView">;

/** The text under each of the app's stored keys, null where nothing is. */
export type StoredAll = Readonly<Record<StoredName, string | null>>;

/** Every stored key's name, in the order a file of them lists them. */
export const storedNames: readonly StoredName[] = ["decks", "runs", "schedules", "settings", "lang", "theme", "look"];

/** The hash the new address opens on to receive the old address's data. */
export const RECEIVE_HASH = "#/receive";

/** The key under which the old address records when its data moved, so its later visits forward at once. */
export const MOVED_KEY = "anki-moved-at";

const storedAllSchema = z.object({
  decks: z.string().nullable(),
  runs: z.string().nullable(),
  schedules: z.string().nullable(),
  settings: z.string().nullable(),
  lang: z.string().nullable(),
  theme: z.string().nullable(),
  look: z.string().nullable(),
}) satisfies z.ZodType<StoredAll>;

/** What the two addresses say to each other: the new one is ready, the old one sends its data and the hash to open, and the new one answers. */
export const handOverMessageSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("ready") }),
  z.object({ kind: z.literal("data"), stored: storedAllSchema, hash: z.string() }),
  z.object({ kind: z.literal("taken") }),
  z.object({ kind: z.literal("refused") }),
]);
export type HandOverMessage = z.infer<typeof handOverMessageSchema>;

/** Whether the old address holds anything to move: decks or runs. Language, theme and look alone are not worth a question. */
export const holdsData = (stored: StoredAll): boolean => stored.decks !== null || stored.runs !== null;

/**
 * The keys to write at the new address to take `incoming`, or why it does not read. An address
 * that holds no decks and no runs takes the text whole. One that does keeps everything it has and
 * adds the decks, runs and schedules it lacks, by id, as a backup's merge does.
 */
export function takeHandOver(here: StoredAll, incoming: StoredAll): Result<[StoredName, string][], StoredError> {
  return readStore(incoming).andThen((theirs) => {
    if (!holdsData(here)) {
      return ok(storedNames.flatMap((name): [StoredName, string][] => {
        const text = incoming[name];
        return text === null ? [] : [[name, text]];
      }));
    }
    return readStore(here).map((ours) =>
      changedText(ours, restore(ours, { version: 1, decks: [...theirs.decks], runs: [...theirs.runs], srs: [...theirs.schedules], settings: theirs.settings }, "merge")),
    );
  });
}
