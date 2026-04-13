import { Badge } from "@/components/ui/badge";
import type { Complexity } from "@/types";

const COMPLEXITY_STYLES: Record<Complexity, string> = {
  easy: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  hard: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const COMPLEXITY_LABELS: Record<Complexity, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export function ComplexityBadge({ complexity }: { complexity: Complexity }) {
  return (
    <Badge variant="outline" className={COMPLEXITY_STYLES[complexity]}>
      {COMPLEXITY_LABELS[complexity]}
    </Badge>
  );
}
