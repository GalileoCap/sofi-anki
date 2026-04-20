import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/language-context";
import type { TranslationKey } from "@/lib/translations";
import type { Complexity } from "@/types";

const COMPLEXITY_STYLES: Record<Complexity, string> = {
  easy: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  hard: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const COMPLEXITY_KEYS: Record<Complexity, TranslationKey> = {
  easy: "complexity.easy",
  medium: "complexity.medium",
  hard: "complexity.hard",
};

export function ComplexityBadge({ complexity }: { complexity: Complexity }) {
  const { t } = useLanguage();
  return (
    <Badge variant="outline" className={COMPLEXITY_STYLES[complexity]}>
      {t(COMPLEXITY_KEYS[complexity])}
    </Badge>
  );
}
