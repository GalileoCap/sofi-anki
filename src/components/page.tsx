import type { ReactNode } from "react";

import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { looks } from "@/lib/looks";

/** A screen with the theme and language toggles above it. */
export function Page({ children }: { children: ReactNode }) {
  return (
    <div className={looks.page}>
      <div className={looks.toolbar}>
        <ThemeToggle />
        <LanguageToggle />
      </div>
      {children}
    </div>
  );
}
