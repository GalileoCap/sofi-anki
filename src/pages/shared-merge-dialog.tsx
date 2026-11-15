import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/language-context";
import type { Deck } from "@/core/model";
import { looks } from "@/lib/ui-looks";

type SharedMergeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  here: Deck;
  incoming: Deck;
  /** How many cards a merge adds. */
  added: number;
  onOverwrite: () => void;
  onMerge: () => void;
};

/** A shared deck that is already here: add its new cards, replace the copy here, or leave it. */
export function SharedMergeDialog({ open, onOpenChange, here, incoming, added, onOverwrite, onMerge }: SharedMergeDialogProps) {
  const { t, tp } = useLanguage();
  const cards = (n: number) => `${n} ${tp(n, "common.card", "common.cards")}`;
  const then = (action: () => void) => () => {
    action();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("importMerge.title")}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 text-sm">
          <p className="text-muted-foreground">
            <span className={looks.strong}>{here.title}</span>{" "}
            {t("importMerge.existsWith").replace("{n}", cards(here.cards.length)).replace("{m}", cards(incoming.cards.length))}
          </p>
          {added > 0 && <p className={looks.muted}>{t("importMerge.mergeAdds").replace("{n}", cards(added))}</p>}
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button variant="secondary" onClick={then(onMerge)} disabled={added === 0}>
            {t("common.merge")} ({t("importMerge.newCount").replace("{n}", String(added))})
          </Button>
          <Button variant="destructive" onClick={then(onOverwrite)}>
            {t("common.overwrite")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
