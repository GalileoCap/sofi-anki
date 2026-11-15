import type { IconSvgElement } from "@hugeicons/react";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/** An icon at the size of the text beside it, which a screen reader skips. */
export function Icon({ icon }: { icon: IconSvgElement }) {
  return <HugeiconsIcon icon={icon} strokeWidth={2} aria-hidden="true" data-icon="inline-start" />;
}

type IconButtonProps = Omit<ComponentProps<typeof Button>, "children" | "size"> & {
  icon: IconSvgElement;
  /** What the button does: its name, and its tooltip while the words are hidden. */
  label: string;
  /** Where the words show beside the icon: never, or from a phone's width up (`sm`). */
  words?: "never" | "sm";
};

/**
 * A button that is an icon, named by `label` for a screen reader and in a tooltip on hover and
 * focus (`hi-6`). With `words="sm"` the label shows beside the icon where there is room.
 */
export function IconButton({ icon, label, words = "never", className, ...props }: IconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button size={words === "sm" ? "default" : "icon"} aria-label={label} className={cn(words === "sm" && "max-sm:size-10 max-sm:px-0", className)} {...props}>
          <Icon icon={icon} />
          {words === "sm" && <span className="max-sm:sr-only">{label}</span>}
        </Button>
      </TooltipTrigger>
      <TooltipContent className={cn(words === "sm" && "sm:hidden")}>{label}</TooltipContent>
    </Tooltip>
  );
}
