import { useState } from "react";

import type { AppLook, DeckView } from "@/core/model";
import { readDeckView } from "@/core/stored";
import { readStoredValue, writeStored } from "@/effects/storage";

/** How home lays out the decks: the view picked in this browser, else the one `look` opens on. */
export function useDeckView(look: AppLook) {
  const [picked, setPicked] = useState(() => readStoredValue("deckView"));

  /** A view the browser refuses to keep still shows for this visit. */
  function pickView(next: DeckView) {
    setPicked(next);
    writeStored("deckView", next);
  }

  return { view: readDeckView(picked, look), pickView };
}
