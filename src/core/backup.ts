import { Result, err, ok } from "neverthrow";
import { z } from "zod";

/** A backup's outer shape, as every version of the app has written it. The records inside are read as they are. */
const backupShape = z.object({
  version: z.literal(1),
  decks: z.array(z.unknown()),
  runs: z.array(z.unknown()),
  srs: z.array(z.unknown()),
  settings: z.object({}).loose(),
});

export type NotABackup = { kind: "notABackup" };

/** Accepts the text of a file only when it is a backup, so a restore never reads a missing list as an empty one. */
export function checkBackup(json: string): Result<string, NotABackup> {
  const notABackup: NotABackup = { kind: "notABackup" };
  return parseJson(json)
    .mapErr(() => notABackup)
    .andThen((value) => (backupShape.safeParse(value).success ? ok(json) : err(notABackup)));
}

const parseJson = Result.fromThrowable((text: string): unknown => JSON.parse(text));
