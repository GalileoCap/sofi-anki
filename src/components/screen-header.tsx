import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { looks } from "@/lib/ui-looks";

/** A screen's title with the button back to where it was opened from. */
export function ScreenHeader({ onBack, children }: { onBack: () => void; children: ReactNode }) {
  const { t } = useLanguage();
  return (
    <div className="flex items-center gap-3">
      <Button variant="ghost" size="sm" onClick={onBack}>
        {t("common.back")}
      </Button>
      <h1 className={looks.title}>{children}</h1>
    </div>
  );
}
