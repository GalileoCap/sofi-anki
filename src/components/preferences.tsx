import { ComputerIcon, Moon02Icon, Sun03Icon, TranslateIcon } from "@hugeicons/core-free-icons";

import { Icon, IconButton } from "@/components/icon-button";
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
      <Icon icon={TranslateIcon} />
      {t("language.other")}
    </Button>
  );
}

const themeIcons = { light: Sun03Icon, dark: Moon02Icon, system: ComputerIcon } as const;

/** A button that steps the theme to the next one, its icon and name the theme in use. */
export function ThemeSwitch() {
  const { t } = useLanguage();
  const { theme, cycleTheme } = useTheme();
  return <IconButton variant="ghost" icon={themeIcons[theme]} label={`${t("theme.label")}: ${t(`theme.${theme}`)}`} onClick={cycleTheme} />;
}
