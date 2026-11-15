import { createContext, useContext } from "react";

import type { Lang } from "@/core/model";
import { type TranslationKey, translate } from "@/lib/translations";

export interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
  tp: (n: number, oneKey: TranslationKey, otherKey: TranslationKey) => string;
}

/** The interface's text in `lang`, with `setLang` to change it. */
export const languageValue = (lang: Lang, setLang: (lang: Lang) => void): LanguageContextValue => ({
  lang,
  setLang,
  t: (key) => translate(lang, key),
  tp: (n, oneKey, otherKey) => translate(lang, n === 1 ? oneKey : otherKey),
});

/**
 * The default outside a `LanguageProvider`: English, which cannot be changed there. `main.tsx`
 * wraps the app in the provider, so only a component rendered on its own reads this.
 */
const OUTSIDE_PROVIDER = languageValue("en", () => {});

export const LanguageContext = createContext<LanguageContextValue>(OUTSIDE_PROVIDER);

export const useLanguage = (): LanguageContextValue => useContext(LanguageContext);
