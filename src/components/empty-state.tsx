import { looks } from "@/lib/ui-looks";
import { cn } from "@/lib/utils";

/** A list with nothing in it yet, and what to do about it. */
export function EmptyState({ message, hint }: { message: string; hint: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <p className="text-lg text-muted-foreground">{message}</p>
      <p className={looks.muted}>{hint}</p>
    </div>
  );
}

/** A list whose filters leave nothing to show. */
export function NoMatch({ message }: { message: string }) {
  return <p className={cn(looks.muted, "py-8 text-center")}>{message}</p>;
}
