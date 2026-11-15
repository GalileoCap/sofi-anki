import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { following, langs } from "@/core/model";

export function LanguageToggle() {
  const { lang, setLang, t } = useLanguage();
  const label = lang.toUpperCase();
  return (
    <Button variant="ghost" size="sm" onClick={() => setLang(following(langs, lang))} title={`${t("language.label")}: ${label}`}>
      <span className="text-xs">{label}</span>
    </Button>
  );
}
