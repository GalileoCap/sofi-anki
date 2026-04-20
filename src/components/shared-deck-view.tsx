import { useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import {
  Card as UiCard,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ComplexityBadge } from "@/components/complexity-badge";
import { ImportMergeDialog } from "@/components/import-merge-dialog";
import type { Deck } from "@/types";

interface SharedDeckViewProps {
  deck: Deck;
  existingDeck: Deck | undefined;
  onImportNew: () => void;
  onOverwrite: () => void;
  onMerge: () => void;
  onGoHome: () => void;
}

export function SharedDeckView({
  deck,
  existingDeck,
  onImportNew,
  onOverwrite,
  onMerge,
  onGoHome,
}: SharedDeckViewProps) {
  const [mergeOpen, setMergeOpen] = useState(false);
  const [imported, setImported] = useState(false);
  const { t, tp } = useLanguage();

  function handleImport() {
    if (existingDeck) {
      setMergeOpen(true);
    } else {
      onImportNew();
      setImported(true);
    }
  }

  function handleOverwrite() {
    onOverwrite();
    setImported(true);
  }

  function handleMerge() {
    onMerge();
    setImported(true);
  }

  return (
    <div className="mx-auto w-[80%] p-4 sm:p-8">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{t("sharedDeck.label")}</p>
            <h1 className="text-2xl font-medium text-foreground">{deck.title}</h1>
          </div>
          <div className="flex gap-2">
            {!imported ? (
              <Button onClick={handleImport}>{t("sharedDeck.importDeck")}</Button>
            ) : (
              <Button onClick={onGoHome}>{t("sharedDeck.goToDecks")}</Button>
            )}
          </div>
        </div>

        {imported && (
          <div className="rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
            {t("sharedDeck.importedSuccess")}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">
            {deck.cards.length} {tp(deck.cards.length, "common.card", "common.cards")}
          </Badge>
          {(deck.tags ?? []).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          {deck.cards.map((card) => (
            <UiCard key={card.id} size="sm">
              <CardHeader>
                <div className="flex items-center gap-2 min-w-0">
                  <CardTitle className="text-sm truncate">{card.title}</CardTitle>
                  <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                    <ComplexityBadge complexity={card.complexity} />
                    {card.type === "choice" && (
                      <Badge variant="outline" className="text-xs">
                        {card.multiSelect ? "Multi" : "Single"}
                      </Badge>
                    )}
                    {(card.tags ?? []).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardHeader>
            </UiCard>
          ))}
        </div>
      </div>

      {existingDeck && (
        <ImportMergeDialog
          open={mergeOpen}
          onOpenChange={setMergeOpen}
          existingDeck={existingDeck}
          incomingDeck={deck}
          onOverwrite={handleOverwrite}
          onMerge={handleMerge}
        />
      )}
    </div>
  );
}
