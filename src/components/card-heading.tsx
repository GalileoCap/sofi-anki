import type { ReactNode } from "react";

import { ComplexityBadge } from "@/components/complexity-badge";
import { Badge } from "@/components/ui/badge";
import { CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";
import type { Card } from "@/core/model";

type CardHeadingProps = {
  card: Card;
  /** Drawn before the title, such as an arrow that shows the card is open. */
  before?: ReactNode;
  /** Badges after the card's own, such as whether it is due. */
  children?: ReactNode;
};

/** A card's title on one line with its complexity, its kind of choice and its tags. */
export function CardHeading({ card, before, children }: CardHeadingProps) {
  const { t } = useLanguage();
  return (
    <div className="flex min-w-0 items-center gap-2">
      {before}
      <CardTitle className="truncate text-sm">{card.title}</CardTitle>
      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
        <ComplexityBadge complexity={card.complexity} />
        {card.type === "choice" && (
          <Badge variant="outline" className="text-xs">
            {card.multiSelect ? t("deckDetail.multi") : t("deckDetail.single")}
          </Badge>
        )}
        {card.tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="text-xs">
            {tag}
          </Badge>
        ))}
        {children}
      </div>
    </div>
  );
}
