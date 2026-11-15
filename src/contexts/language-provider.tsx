import { LanguageContext, languageValue } from "@/contexts/language-context";
import { useLang } from "@/hooks/use-lang";

/** The interface's language for everything under it, kept where `useLang` keeps it. */
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { lang, setLang } = useLang();
  return <LanguageContext.Provider value={languageValue(lang, setLang)}>{children}</LanguageContext.Provider>;
}
