import { useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { deckToJson } from "@/core/deck-json";
import type { Deck } from "@/core/model";
import { shareUrl as linkFor } from "@/core/share";
import { copyText } from "@/effects/files";
import { pageBase } from "@/effects/page";

interface ExportDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  deck: Deck;
  /** When true, include a Share Link section at the top */
  includeShareUrl?: boolean;
}

export function ExportDialog({ trigger, open: controlledOpen, onOpenChange: controlledOnOpenChange, deck, includeShareUrl }: ExportDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;

  const [copiedData, setCopiedData] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const { t } = useLanguage();

  function handleOpenChange(next: boolean) {
    setInternalOpen(next);
    controlledOnOpenChange?.(next);
    if (!next) setCopiedUrl(false);
  }

  const shareUrl = open && includeShareUrl ? linkFor(pageBase(), deck) : null;
  const deckJson = JSON.stringify(deckToJson(deck), null, 2);

  function copyToClipboard(text: string, setCopied: (v: boolean) => void) {
    copyText(text).map(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-h-[85vh] overflow-y-auto overflow-x-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("exportDialog.title")}</DialogTitle>
        </DialogHeader>

        {includeShareUrl && (
          <>
            <div className="flex min-w-0 flex-col gap-2">
              <p className="text-sm font-medium">{t("exportDialog.shareLink")}</p>
              {shareUrl === null && open ? (
                <p className="text-xs text-muted-foreground">{t("exportDialog.computingLink")}</p>
              ) : shareUrl ? (
                <div className="flex items-center gap-2">
                  <p className="flex-1 truncate rounded bg-muted px-2 py-1 font-mono text-xs">{shareUrl}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(shareUrl, setCopiedUrl)}
                  >
                    {copiedUrl ? t("common.copied") : t("common.copy")}
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">{t("exportDialog.tooLarge")}</p>
              )}
            </div>
            <Separator />
          </>
        )}

        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{t("exportDialog.deckData")}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(deckJson, setCopiedData)}
            >
              {copiedData ? t("common.copied") : t("common.copy")}
            </Button>
          </div>
          <pre className="max-h-60 min-w-0 overflow-auto rounded-lg bg-muted p-3 text-xs leading-relaxed whitespace-pre-wrap break-all">
            {deckJson}
          </pre>
        </div>
      </DialogContent>
    </Dialog>
  );
}
