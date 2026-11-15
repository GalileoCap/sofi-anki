import { useEffect, useState } from "react";

import type { Lang } from "@/core/model";
import { readLang } from "@/core/stored";
import { showLang } from "@/effects/page";
import { readStoredValue, writeStored } from "@/effects/storage";

/** The interface language picked, kept for the next visit. */
export function useLang() {
  const [lang, setLangState] = useState<Lang>(() => readLang(readStoredValue("lang")));
  useEffect(() => showLang(lang), [lang]);

  /** A language the browser refuses to keep still shows for this visit. */
  function setLang(next: Lang) {
    setLangState(next);
    writeStored("lang", next);
  }

  return { lang, setLang };
}
