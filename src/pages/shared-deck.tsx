import { useState } from "react";

import { CardHeading } from "@/components/card-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardHeader, Card as UiCard } from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";
import { type Arrival, receiveDeck, unknownCards } from "@/core/decks";
import type { Deck, Store } from "@/core/model";
import { looks } from "@/lib/ui-looks";
import { SharedMergeDialog } from "@/pages/shared-merge-dialog";

type SharedDeckPageProps = {
  /** The deck the link carries. */
  deck: Deck;
  store: Store;
  update: (change: (store: Store) => Store) => void;
  onGoHome: () => void;
};

/** A deck someone shared by link: its cards, and taking it in, merged with or over a copy already here. */
export function SharedDeckPage({ deck, store, update, onGoHome }: SharedDeckPageProps) {
  const { t, tp } = useLanguage();
  const [mergeOpen, setMergeOpen] = useState(false);
  const [received, setReceived] = useState(false);
  const here = store.decks.find((d) => d.id === deck.id);

  function receive(how: Arrival) {
    update((s) => ({ ...s, decks: receiveDeck(s.decks, deck, how) }));
    setReceived(true);
  }

  return (
    <div className={looks.sections}>
      <div className={looks.spread}>
        <div>
          <p className={looks.muted}>{t("sharedDeck.label")}</p>
          <h1 className={looks.title}>{deck.title}</h1>
        </div>
        {received ? (
          <Button onClick={onGoHome}>{t("sharedDeck.goToDecks")}</Button>
        ) : (
          <Button onClick={() => (here ? setMergeOpen(true) : receive("merge"))}>{t("sharedDeck.importDeck")}</Button>
        )}
      </div>

      {received && (
        <div className="rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
          {t("sharedDeck.importedSuccess")}
        </div>
      )}

      <div className={looks.actions}>
        <Badge variant="secondary">
          {deck.cards.length} {tp(deck.cards.length, "common.card", "common.cards")}
        </Badge>
        {deck.tags.map((tag) => (
          <Badge key={tag} variant="outline" className="text-xs">
            {tag}
          </Badge>
        ))}
      </div>

      <div className={looks.column}>
        {deck.cards.map((card) => (
          <UiCard key={card.id} size="sm">
            <CardHeader>
              <CardHeading card={card} />
            </CardHeader>
          </UiCard>
        ))}
      </div>

      {here && (
        <SharedMergeDialog
          open={mergeOpen}
          onOpenChange={setMergeOpen}
          here={here}
          incoming={deck}
          added={unknownCards(here, deck).length}
          onOverwrite={() => receive("overwrite")}
          onMerge={() => receive("merge")}
        />
      )}
    </div>
  );
}
