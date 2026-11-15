import { ComputerIcon, Moon02Icon, Sun01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import type { Theme } from "@/core/model";
import { useTheme } from "@/hooks/use-theme";
import type { TranslationKey } from "@/lib/translations";

const ICONS: Record<Theme, typeof Sun01Icon> = { light: Sun01Icon, dark: Moon02Icon, system: ComputerIcon };
const NAMES: Record<Theme, TranslationKey> = { light: "theme.light", dark: "theme.dark", system: "theme.system" };

export function ThemeToggle() {
  const { theme, cycleTheme } = useTheme();
  const { t } = useLanguage();
  const label = t(NAMES[theme]);
  return (
    <Button variant="ghost" size="sm" onClick={cycleTheme} title={`${t("theme.label")}: ${label}`}>
      <HugeiconsIcon icon={ICONS[theme]} size={14} strokeWidth={2} aria-hidden="true" />
      <span className="text-xs">{label}</span>
    </Button>
  );
}
