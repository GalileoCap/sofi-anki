import { useState } from "react";

import { type AppLook, appLooks, following } from "@/core/model";
import { readLook } from "@/core/stored";
import { readStoredValue, writeStored } from "@/effects/storage";
import { showClassic } from "@/effects/theme";

/** The look picked, shown on the page and kept for the next visit. The page opens in it before the app renders. */
export function useLook() {
  const [look, setLook] = useState<AppLook>(() => readLook(readStoredValue("look")));

  /** A look the browser refuses to keep still shows for this visit. */
  function toggleLook() {
    const next = following(appLooks, look);
    setLook(next);
    showClassic(next === "classic");
    writeStored("look", next);
  }

  return { look, toggleLook };
}
