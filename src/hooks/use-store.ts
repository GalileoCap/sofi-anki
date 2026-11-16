import { Result } from "neverthrow";
import { useRef, useState } from "react";

import type { Store } from "@/core/model";
import { type Stamps, type Synced, stampChanges } from "@/core/sync";
import { now } from "@/effects/clock";
import { type StorageError, saveChanges, writeStored } from "@/effects/storage";

/**
 * The store, from one that read (`loadStore`), and its change: `update` runs a core
 * function over the latest store, writes the keys it changed and stamps what changed for sync.
 * `adopt` takes a store sync merged, with its stamps as they came. A write the browser refuses
 * leaves the change on screen and shows `saveError`.
 */
export function useStore(initial: Store, initialStamps: Stamps) {
  const [store, setStore] = useState(initial);
  const [saveError, setSaveError] = useState<StorageError | null>(null);
  const latest = useRef<Synced>({ store: initial, stamps: initialStamps });

  function save(after: Synced) {
    const before = latest.current;
    latest.current = after;
    setStore(after.store);
    const writes = [saveChanges(before.store, after.store)];
    if (after.stamps !== before.stamps) writes.push(writeStored("syncStamps", JSON.stringify(after.stamps)));
    setSaveError(Result.combine(writes).match(() => null, (error) => error));
  }

  function update(change: (store: Store) => Store) {
    const { store: before, stamps } = latest.current;
    const after = change(before);
    save({ store: after, stamps: stampChanges(stamps, before, after, now()) });
  }

  return { store, update, adopt: save, synced: () => latest.current, saveError };
}
