import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/language-context";
import { deckToJson } from "@/core/deck-json";
import type { Deck } from "@/core/model";
import { download } from "@/effects/files";
import { looks } from "@/lib/ui-looks";

type ExportDialogProps = {
  deck: Deck;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** The deck as JSON, to download as a file or to copy. */
export function ExportDialog({ deck, open, onOpenChange }: ExportDialogProps) {
  const { t } = useLanguage();
  const deckJson = JSON.stringify(deckToJson(deck), null, 2);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={looks.wideDialog}>
        <DialogHeader>
          <DialogTitle>{t("exportDialog.title")}</DialogTitle>
          <DialogDescription>{t("exportDialog.deckData")}</DialogDescription>
        </DialogHeader>
        <div className={looks.buttons}>
          <Button onClick={() => download(`${deck.title}.json`, deckJson, "application/json")}>{t("exportDialog.download")}</Button>
          <CopyButton text={deckJson} />
        </div>
        <pre className="max-h-60 min-w-0 overflow-auto rounded-lg bg-muted p-3 text-xs leading-relaxed whitespace-pre-wrap break-all">{deckJson}</pre>
      </DialogContent>
    </Dialog>
  );
}
