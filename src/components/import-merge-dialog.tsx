import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Deck } from "@/types";

interface ImportMergeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingDeck: Deck;
  incomingDeck: Deck;
  onOverwrite: () => void;
  onMerge: () => void;
}

export function ImportMergeDialog({
  open,
  onOpenChange,
  existingDeck,
  incomingDeck,
  onOverwrite,
  onMerge,
}: ImportMergeDialogProps) {
  const existingCardIds = new Set(existingDeck.cards.map((c) => c.id));
  const newCardCount = incomingDeck.cards.filter((c) => !existingCardIds.has(c.id)).length;
  const { t } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("importMerge.title")}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 text-sm">
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">{existingDeck.title}</span> already
            exists locally with {existingDeck.cards.length} cards. The shared version
            has {incomingDeck.cards.length} cards.
          </p>
          {newCardCount > 0 && (
            <p className="text-muted-foreground">
              Merge would add {newCardCount} new {newCardCount === 1 ? "card" : "cards"}.
            </p>
          )}
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="secondary"
            onClick={() => { onMerge(); onOpenChange(false); }}
            disabled={newCardCount === 0}
          >
            {t("common.merge")} ({newCardCount} new)
          </Button>
          <Button
            variant="destructive"
            onClick={() => { onOverwrite(); onOpenChange(false); }}
          >
            {t("common.overwrite")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
