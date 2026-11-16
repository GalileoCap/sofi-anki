import { Result, ResultAsync, err, errAsync, ok } from "neverthrow";

import { type HandOverMessage, MOVED_KEY, RECEIVE_HASH, type StoredAll, handOverMessageSchema, takeHandOver } from "@/core/handover";
import { readStoredAll, writeStored } from "@/effects/storage";

/**
 * The app's address. A local build sets another to try the hand-over between two ports.
 *
 * @effects build environment
 */
export const NEW_ADDRESS: string = import.meta.env.VITE_NEW_ADDRESS ?? "https://anki.smplworks.net/";
const NEW_ORIGIN = new URL(NEW_ADDRESS).origin;

/** The origin of the old address, `galileocap.github.io/sofi-anki/`, the only one the new address takes data from. */
const OLD_ORIGIN: string = import.meta.env.VITE_OLD_ORIGIN ?? "https://galileocap.github.io";

/** How long either side waits for the other before giving up. */
const WAIT_MS = 15_000;

/** Why the old address's data did not move: the browser blocked the new tab, the new address did not answer, or it could not read the data. */
export type HandOverError = { readonly kind: "blocked" } | { readonly kind: "noAnswer" } | { readonly kind: "refused" };

const readMessage = (data: unknown): HandOverMessage | null => {
  const parsed = handOverMessageSchema.safeParse(data);
  return parsed.success ? parsed.data : null;
};

/**
 * The old address's data sent to a new tab at the new address, which opens on `hash` once it
 * holds it. The old address keeps its copy.
 *
 * @effects window.open, postMessage, timer
 */
export function sendHandOver(stored: StoredAll, hash: string): ResultAsync<void, HandOverError> {
  const opened = window.open(`${NEW_ADDRESS}${RECEIVE_HASH}`);
  if (opened === null) return errAsync({ kind: "blocked" });
  const tab: Window = opened;
  const done = new Promise<Result<void, HandOverError>>((resolve) => {
    const timer = window.setTimeout(() => finish(err({ kind: "noAnswer" })), WAIT_MS);
    function finish(outcome: Result<void, HandOverError>) {
      window.clearTimeout(timer);
      window.removeEventListener("message", listen);
      resolve(outcome);
    }
    function listen(event: MessageEvent) {
      if (event.origin !== NEW_ORIGIN || event.source !== tab) return;
      const message = readMessage(event.data);
      if (message?.kind === "ready") tab.postMessage({ kind: "data", stored, hash } satisfies HandOverMessage, NEW_ORIGIN);
      if (message?.kind === "taken") finish(ok(undefined));
      if (message?.kind === "refused") finish(err({ kind: "refused" }));
    }
    window.addEventListener("message", listen);
  });
  return new ResultAsync(done);
}

/**
 * The data the old address sends, taken into this browser's storage at the new address, and the
 * hash to open then. Null when this page was not opened by the old address, or it sent nothing in
 * time.
 *
 * @effects postMessage, localStorage, timer
 */
export function receiveHandOver(): Promise<string | null> {
  const opener: Window | null = window.opener;
  if (opener === null) return Promise.resolve(null);
  const old: Window = opener;
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => finish(null), WAIT_MS);
    function finish(hash: string | null) {
      window.clearTimeout(timer);
      window.removeEventListener("message", listen);
      resolve(hash);
    }
    function reply(message: HandOverMessage) {
      old.postMessage(message, OLD_ORIGIN);
    }
    function listen(event: MessageEvent) {
      if (event.origin !== OLD_ORIGIN || event.source !== old) return;
      const message = readMessage(event.data);
      if (message?.kind !== "data") return;
      const written = readStoredAll()
        .andThen((here) => takeHandOver(here, message.stored))
        .andThen((writes) => Result.combine(writes.map(([name, text]) => writeStored(name, text))));
      reply(written.isOk() ? { kind: "taken" } : { kind: "refused" });
      finish(message.hash);
    }
    window.addEventListener("message", listen);
    reply({ kind: "ready" });
  });
}

/**
 * Whether this browser's data at the old address has moved already.
 *
 * @effects localStorage
 */
export const movedAlready = (): boolean => Result.fromThrowable(() => localStorage.getItem(MOVED_KEY) !== null, () => false)().unwrapOr(false);

/**
 * The move recorded at the old address, at `at`, so its later visits forward at once. A browser
 * that refuses the write asks again on the next visit, and moving twice adds nothing.
 *
 * @effects localStorage
 */
export function recordMoved(at: number): void {
  Result.fromThrowable(() => localStorage.setItem(MOVED_KEY, String(at)), () => null)();
}

/**
 * The page replaced by the new address at `hash`, so the back button does not return here.
 *
 * @effects location
 */
export function forwardToNew(hash: string): void {
  location.replace(`${NEW_ADDRESS}${hash}`);
}
