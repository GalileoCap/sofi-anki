import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/language-context";
import type { CardDisposition } from "@/core/model";
import type { TranslationKey } from "@/lib/translations";
import { cn } from "@/lib/utils";

const shown: Record<CardDisposition, { label: TranslationKey; className: string }> = {
  correct: { label: "common.correct", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  approximate: { label: "common.approximate", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  wrong: { label: "common.wrong", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  skip: { label: "common.skipped", className: "bg-muted text-muted-foreground" },
  save_for_later: { label: "common.saved", className: "bg-muted text-muted-foreground" },
};

/** What was done with a card on one try: answered right, near, wrong, skipped or saved for later. */
export function DispositionBadge({ disposition }: { disposition: CardDisposition }) {
  const { t } = useLanguage();
  return (
    <Badge variant="outline" className={cn("text-xs", shown[disposition].className)}>
      {t(shown[disposition].label)}
    </Badge>
  );
}
