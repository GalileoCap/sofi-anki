import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { useLanguage } from "@/contexts/language-context";
import type { TranslationKey } from "@/lib/translations";

const ICONS: Record<string, string> = {
  light: "\u2600\uFE0F",
  dark: "\uD83C\uDF19",
  system: "\uD83D\uDCBB",
};

const THEME_KEYS: Record<string, TranslationKey> = {
  light: "theme.light",
  dark: "theme.dark",
  system: "theme.system",
};

export function ThemeToggle() {
  const { theme, cycleTheme } = useTheme();
  const { t } = useLanguage();
  const label = t(THEME_KEYS[theme]);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={cycleTheme}
      title={`Theme: ${label}`}
    >
      <span className="mr-1">{ICONS[theme]}</span>
      <span className="text-xs">{label}</span>
    </Button>
  );
}
