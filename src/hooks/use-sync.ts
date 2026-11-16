import { type ResultAsync, okAsync } from "neverthrow";
import { useEffect, useRef, useState } from "react";

import type { Millis, Store } from "@/core/model";
import { SYNC_OFF, type SyncState, readSyncState } from "@/core/stored";
import { type Synced, mergeSynced, readSyncFile, sameSynced, writeSyncFile } from "@/core/sync";
import { now } from "@/effects/clock";
import { type DriveError, onReturn, readDriveFile, signIn, signOut, syncAvailable, writeDriveFile } from "@/effects/google-drive";
import { readStoredValue, writeStored } from "@/effects/storage";

/** Where sync stands: off, at work, done at a moment, waiting for a click to sign in again, or stopped by an error. */
export type SyncStatus =
  | { readonly kind: "off" }
  | { readonly kind: "syncing" }
  | { readonly kind: "synced"; readonly at: Millis }
  | { readonly kind: "paused" }
  | { readonly kind: "failed"; readonly error: SyncError };

/** Why sync stopped: a step in Drive failed, or the file there does not read. */
export type SyncError = DriveError | { readonly kind: "badFile" };

/** How long after a change sync waits for the next, so a run of edits uploads once. */
const SETTLE_MS = 3000;
/** A token this close to expiring pauses sync, so no upload is cut off halfway. */
const MARGIN_MS = 60_000;

/**
 * Sync with the person's Google Drive, when they turned it on: on opening, a few seconds after
 * each change to `store`, and when the page comes back into view or online. A token that expired
 * pauses it until `resume`, which needs a click for Google's popup.
 */
export function useSync(store: Store, synced: () => Synced, adopt: (merged: Synced) => void) {
  const [state, setState] = useState<SyncState>(() => (syncAvailable ? readSyncState(readStoredValue("sync")) : SYNC_OFF));
  const [status, setStatus] = useState<SyncStatus>({ kind: state.on ? "syncing" : "off" });
  const latest = useRef(state);
  const running = useRef(false);
  const again = useRef(false);

  function keep(next: SyncState) {
    latest.current = next;
    setState(next);
    writeStored("sync", JSON.stringify(next));
  }

  async function run() {
    const { on, token, expiresAt } = latest.current;
    if (!on) return;
    if (token === undefined || expiresAt === undefined || expiresAt - MARGIN_MS <= now()) {
      setStatus({ kind: "paused" });
      return;
    }
    if (running.current) {
      again.current = true;
      return;
    }
    running.current = true;
    setStatus({ kind: "syncing" });
    const result = await readDriveFile(token).andThen((file): ResultAsync<string, SyncError> => {
      if (file === null) return writeDriveFile(token, null, writeSyncFile(synced()));
      return readSyncFile(file.text)
        .mapErr((): SyncError => ({ kind: "badFile" }))
        .asyncAndThen((remote) => {
          const merged = mergeSynced(synced(), remote);
          if (!sameSynced(merged, synced())) adopt(merged);
          return sameSynced(merged, remote) ? okAsync(file.id) : writeDriveFile(token, file.id, writeSyncFile(merged));
        });
    });
    running.current = false;
    result.match(
      () => setStatus({ kind: "synced", at: now() }),
      (error) => setStatus(error.kind === "expired" ? { kind: "paused" } : { kind: "failed", error }),
    );
    if (again.current) {
      again.current = false;
      void run();
    }
  }
  const runLatest = useRef(run);
  runLatest.current = run;

  useEffect(() => {
    const timer = setTimeout(() => void runLatest.current(), SETTLE_MS);
    return () => clearTimeout(timer);
  }, [store, state.on]);
  useEffect(() => onReturn(() => void runLatest.current()), []);

  /** Signs in with Google, from a click, and syncs. Turns sync on, or resumes it. */
  async function turnOn() {
    setStatus({ kind: "syncing" });
    const signedIn = await signIn();
    signedIn.match(
      ({ token, expiresAt }) => {
        keep({ on: true, token, expiresAt });
        void run();
      },
      (error) => setStatus(latest.current.on ? { kind: "paused" } : { kind: "failed", error }),
    );
  }

  function turnOff() {
    if (latest.current.token !== undefined) signOut(latest.current.token);
    keep(SYNC_OFF);
    setStatus({ kind: "off" });
  }

  return { available: syncAvailable, status, turnOn, turnOff, syncNow: () => void run() };
}

export type Sync = ReturnType<typeof useSync>;
