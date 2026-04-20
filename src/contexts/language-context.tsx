import { createContext, useContext, useState } from "react";
import { translate } from "@/lib/translations";
import type { Lang, TranslationKey } from "@/lib/translations";

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
  tp: (n: number, oneKey: TranslationKey, otherKey: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  const t = (key: TranslationKey) => translate(lang, key);
  const tp = (n: number, oneKey: TranslationKey, otherKey: TranslationKey) =>
    translate(lang, n === 1 ? oneKey : otherKey);
  return (
    <LanguageContext.Provider value={{ lang, setLang, t, tp }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
