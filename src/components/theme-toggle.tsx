import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import type { Theme } from "@/core/model";
import { useTheme } from "@/hooks/use-theme";
import type { TranslationKey } from "@/lib/translations";

const ICONS: Record<Theme, string> = { light: "☀️", dark: "🌙", system: "💻" };
const NAMES: Record<Theme, TranslationKey> = { light: "theme.light", dark: "theme.dark", system: "theme.system" };

export function ThemeToggle() {
  const { theme, cycleTheme } = useTheme();
  const { t } = useLanguage();
  const label = t(NAMES[theme]);
  return (
    <Button variant="ghost" size="sm" onClick={cycleTheme} title={`${t("theme.label")}: ${label}`}>
      <span className="mr-1">{ICONS[theme]}</span>
      <span className="text-xs">{label}</span>
    </Button>
  );
}
