import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/language-context";
import type { TranslationKey } from "@/lib/translations";
import type { Complexity } from "@/core/model";

const COMPLEXITY_STYLES: Record<Complexity, string> = {
  easy: "bg-positive-soft text-positive",
  medium: "bg-caution-soft text-caution",
  hard: "bg-negative-soft text-negative",
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
