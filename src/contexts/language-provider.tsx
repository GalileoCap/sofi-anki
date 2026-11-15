import { useState } from "react";
import { translate } from "@/lib/translations";
import type { Lang, TranslationKey } from "@/lib/translations";
import { LanguageContext } from "@/contexts/language-context";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = localStorage.getItem("lang");
    return stored === "es" ? "es" : "en";
  });

  function setLang(next: Lang) {
    localStorage.setItem("lang", next);
    setLangState(next);
  }
  const t = (key: TranslationKey) => translate(lang, key);
  const tp = (n: number, oneKey: TranslationKey, otherKey: TranslationKey) =>
    translate(lang, n === 1 ? oneKey : otherKey);
  return (
    <LanguageContext.Provider value={{ lang, setLang, t, tp }}>
      {children}
    </LanguageContext.Provider>
  );
}
