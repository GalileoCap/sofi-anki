import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { following, langs } from "@/core/model";
import { useTheme } from "@/hooks/use-theme";

/** A button that switches the interface to the other language, named in that language. */
export function LanguageSwitch() {
  const { t, lang, setLang } = useLanguage();
  const next = following(langs, lang);
  return (
    <Button variant="ghost" lang={next} onClick={() => setLang(next)}>
      {t("language.other")}
    </Button>
  );
}

/** A button that steps the theme to the next one, naming the theme in use. */
export function ThemeSwitch() {
  const { t } = useLanguage();
  const { theme, cycleTheme } = useTheme();
  return (
    <Button variant="ghost" onClick={cycleTheme}>
      {t("theme.label")}: {t(`theme.${theme}`)}
    </Button>
  );
}
