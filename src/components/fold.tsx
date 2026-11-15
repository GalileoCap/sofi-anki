import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type FoldProps = {
  /** What shows while folded, beside a chevron that turns when it opens. */
  summary: ReactNode;
  open?: boolean;
  className?: string;
  children: ReactNode;
};

/** A part that opens to show more, on a click, Enter or Space. */
export function Fold({ summary, open, className, children }: FoldProps) {
  return (
    <details open={open} className={cn("group", className)}>
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden">
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          strokeWidth={2.5}
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90 motion-reduce:transition-none"
        />
        {summary}
      </summary>
      {children}
    </details>
  );
}
