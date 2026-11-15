import { LanguageContext } from "@/contexts/language-context";
import { useLang } from "@/hooks/use-lang";
import { type TranslationKey, translate } from "@/lib/translations";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { lang, setLang } = useLang();
  const t = (key: TranslationKey) => translate(lang, key);
  const tp = (n: number, oneKey: TranslationKey, otherKey: TranslationKey) => translate(lang, n === 1 ? oneKey : otherKey);
  return <LanguageContext.Provider value={{ lang, setLang, t, tp }}>{children}</LanguageContext.Provider>;
}
