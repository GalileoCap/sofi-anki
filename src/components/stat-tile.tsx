import { CardContent, Card as UiCard } from "@/components/ui/card";
import { looks } from "@/lib/ui-looks";
import { cn } from "@/lib/utils";

/** One figure of a stats screen with its label above it. */
export function StatTile({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <UiCard size="sm">
      <CardContent className="text-center">
        <p className={looks.muted}>{label}</p>
        <p className={cn("mt-1 font-mono text-xl font-medium text-foreground", className)}>{value}</p>
      </CardContent>
    </UiCard>
  );
}
