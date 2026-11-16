import type { ReactNode } from "react";

import { Markdown } from "@/components/markdown";
import { EmojiSticker } from "@/components/sticker";
import type { Deck } from "@/core/model";
import { cn } from "@/lib/utils";

type CardFaceProps = {
  deck: Deck | undefined;
  title: string;
  /** Quiet words at the end of the deck's line, such as the card's difficulty. */
  corner?: ReactNode;
  /** The card scrolls within itself when its content is taller than its room, and takes focus so the keyboard can scroll it. */
  scrolls?: boolean;
  className?: string;
  children?: ReactNode;
};

/** A card as it studies, lifted off the page: the deck it comes from, its question, and what follows. */
export function CardFace({ deck, title, corner, scrolls = false, className, children }: CardFaceProps) {
  return (
    <div
      className={cn("flex flex-col gap-2.5 rounded-xl bg-card p-4.5 shadow-md", scrolls && "min-h-0 overflow-y-auto", className)}
      tabIndex={scrolls ? 0 : undefined}
    >
      {(deck || corner) && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {deck && <EmojiSticker deck={deck} />}
          {deck?.title}
          {corner && <span className="ml-auto">{corner}</span>}
        </div>
      )}
      <Markdown className="text-xl leading-snug font-extrabold">{title}</Markdown>
      {children}
    </div>
  );
}

/** What sits under the card's dashed rule: its answer, or its hint. */
export const UnderRule = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-col gap-2.5 border-t-2 border-dashed border-border pt-2.5">{children}</div>
);
