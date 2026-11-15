import { useState } from "react";

import { Markdown } from "@/components/markdown";
import { LanguageSwitch, ThemeSwitch } from "@/components/preferences";
import { DeckRow } from "@/components/sticker";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { type Arrival, receiveDeck, unknownCards } from "@/core/decks";
import type { Deck, Store } from "@/core/model";
import { kindWords } from "@/lib/sticker-looks";
import { looks } from "@/lib/ui-looks";
import { cn } from "@/lib/utils";
import { SharedMergeDialog } from "@/pages/shared-merge-dialog";

type SharedDeckPageProps = {
  /** The deck the link carries. */
  deck: Deck;
  store: Store;
  update: (change: (store: Store) => Store) => void;
  /** Goes home, with the title of the deck when it was kept. */
  onGoHome: (kept: string | null) => void;
};

/** A deck someone shared by link: the deck and its cards, and keeping it, merged with or over a copy already here. */
export function SharedDeckPage({ deck, store, update, onGoHome }: SharedDeckPageProps) {
  const { t, tp } = useLanguage();
  const [mergeOpen, setMergeOpen] = useState(false);
  const here = store.decks.find((d) => d.id === deck.id);

  function receive(how: Arrival) {
    update((s) => ({ ...s, decks: receiveDeck(s.decks, deck, how) }));
    onGoHome(deck.title);
  }

  const meta = [`${deck.cards.length} ${tp(deck.cards.length, "common.card", "common.cards")}`, deck.tags.join(", ")].filter(Boolean).join(", ");

  return (
    <div className={looks.narrow}>
      <div className={cn(looks.topbar, "justify-end")}>
        <LanguageSwitch />
        <ThemeSwitch />
      </div>
      <div className={looks.tight}>
        <p className={looks.muted}>{t("shared.label")}</p>
        <DeckRow deck={deck} meta={meta} head />
      </div>
      <div>
        <h2 className={looks.sectionTitle}>{t("shared.cards")}</h2>
        <div className={looks.list}>
          {deck.cards.map((card) => (
            <div key={card.id} className={looks.listRow}>
              <span className={looks.titled}>
                <Markdown inline className="min-w-0">
                  {card.title}
                </Markdown>
                <span className={looks.fine}>{[...kindWords(card, t), ...card.tags].join(", ")}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="sticky bottom-0 flex flex-col gap-2 bg-background py-3">
        <Button size="lg" className="w-full" onClick={() => (here ? setMergeOpen(true) : receive("merge"))}>
          {t("shared.keep")}
        </Button>
        <Button variant="ghost" className={looks.muted} onClick={() => onGoHome(null)}>
          {t("shared.notNow")}
        </Button>
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
