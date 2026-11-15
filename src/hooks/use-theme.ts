import { useEffect, useState } from "react";

import { type Theme, following, isDark, themes } from "@/core/model";
import { readTheme } from "@/core/stored";
import { readStoredValue, writeStored } from "@/effects/storage";
import { onSystemThemeChange, showDark, systemPrefersDark } from "@/effects/theme";

/** The theme picked, shown on the page and kept for the next visit. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => readTheme(readStoredValue("theme")));

  useEffect(() => {
    const show = () => showDark(isDark(theme, systemPrefersDark()));
    show();
    return theme === "system" ? onSystemThemeChange(show) : undefined;
  }, [theme]);

  /** A theme the browser refuses to keep still shows for this visit. */
  function cycleTheme() {
    const next = following(themes, theme);
    setTheme(next);
    writeStored("theme", next);
  }

  return { theme, cycleTheme };
}
