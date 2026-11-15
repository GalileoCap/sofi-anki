import type { ReactNode } from "react";

import { Fold } from "@/components/fold";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { looks } from "@/lib/ui-looks";
import { cn } from "@/lib/utils";

type FilterFoldProps = {
  /** What the filters filter by, shown while folded. */
  label: string;
  /** How many filters are on. The fold opens with any on, and offers to clear them. */
  on: number;
  onClear: () => void;
  className?: string;
  /** The groups of toggles. */
  children: ReactNode;
};

/** Filters folded under their name, with how many are on and a way to clear them. */
export function FilterFold({ label, on, onClear, className, children }: FilterFoldProps) {
  const { t } = useLanguage();
  return (
    <Fold
      className={className}
      open={on > 0}
      summary={
        <span className={looks.muted}>
          {label}
          {on > 0 && ` (${t("deck.filtersOn").replace("{n}", String(on))})`}
        </span>
      }
    >
      <div className={cn(looks.stack, "pt-1 pb-2")}>
        {children}
        {on > 0 && (
          <Button variant="ghost" className="-ml-3 self-start" onClick={onClear}>
            {t("deck.clearFilters")}
          </Button>
        )}
      </div>
    </Fold>
  );
}
