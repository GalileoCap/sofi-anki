import { useState } from "react";

import { CopyButton } from "@/components/copy-button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/language-context";
import { deckToJson } from "@/core/deck-json";
import type { Deck } from "@/core/model";
import { shareUrl } from "@/core/share";
import { pageBase } from "@/effects/page";

type ExportDialogProps = {
  deck: Deck;
  /** A button that opens the dialog, for a dialog that keeps its own open state. */
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Whether the dialog offers the share link above the deck's JSON. */
  includeShareUrl?: boolean;
};

/** The deck as JSON to copy, and its share link when asked for. */
export function ExportDialog({ deck, trigger, open: controlledOpen, onOpenChange, includeShareUrl }: ExportDialogProps) {
  const { t } = useLanguage();
  const [ownOpen, setOwnOpen] = useState(false);
  const open = controlledOpen ?? ownOpen;

  function changeOpen(next: boolean) {
    setOwnOpen(next);
    onOpenChange?.(next);
  }

  const link = open && includeShareUrl ? shareUrl(pageBase(), deck) : null;
  const deckJson = JSON.stringify(deckToJson(deck), null, 2);

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-h-[85vh] overflow-y-auto overflow-x-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("exportDialog.title")}</DialogTitle>
        </DialogHeader>

        {includeShareUrl && (
          <>
            <div className="flex min-w-0 flex-col gap-2">
              <p className="text-sm font-medium">{t("exportDialog.shareLink")}</p>
              {link === null ? (
                <p className="text-xs text-muted-foreground">{t("exportDialog.tooLarge")}</p>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="flex-1 truncate rounded bg-muted px-2 py-1 font-mono text-xs">{link}</p>
                  <CopyButton text={link} />
                </div>
              )}
            </div>
            <Separator />
          </>
        )}

        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{t("exportDialog.deckData")}</p>
            <CopyButton text={deckJson} />
          </div>
          <pre className="max-h-60 min-w-0 overflow-auto rounded-lg bg-muted p-3 text-xs leading-relaxed whitespace-pre-wrap break-all">{deckJson}</pre>
        </div>
      </DialogContent>
    </Dialog>
  );
}
