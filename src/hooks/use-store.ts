import { useRef, useState } from "react";

import type { Store } from "@/core/model";
import { type StorageError, saveChanges } from "@/effects/storage";

/**
 * The store, from one that read (`loadStore`), and its change: `update` runs a core
 * function over the latest store and writes the keys it changed. A write the browser refuses
 * leaves the change on screen and shows `saveError`.
 */
export function useStore(initial: Store) {
  const [store, setStore] = useState(initial);
  const [saveError, setSaveError] = useState<StorageError | null>(null);
  const latest = useRef(initial);

  function update(change: (store: Store) => Store) {
    const before = latest.current;
    const after = change(before);
    latest.current = after;
    setStore(after);
    setSaveError(saveChanges(before, after).match(() => null, (error) => error));
  }

  return { store, update, saveError };
}
