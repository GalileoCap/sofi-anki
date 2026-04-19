import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { encodeDeck, MAX_SHARE_URL_LENGTH } from "@/lib/share";
import type { Deck } from "@/types";


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
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  function handleOpenChange(next: boolean) {
    setInternalOpen(next);
    controlledOnOpenChange?.(next);
    if (!next) {
      setShareUrl(null);
      setCopiedUrl(false);
    }
  }

  // Compute share URL when dialog opens (only if needed)
  useEffect(() => {
    if (!open || !includeShareUrl) return;
    encodeDeck(deck).then((encoded) => {
      const url = `${window.location.origin}${window.location.pathname}#/share/${encoded}`;
      setShareUrl(url.length <= MAX_SHARE_URL_LENGTH ? url : null);
    });
  }, [open, includeShareUrl, deck]);

  const deckJson = JSON.stringify(
    {
      title: deck.title,
      ...(deck.tags?.length ? { tags: deck.tags } : {}),
      ...(deck.color ? { color: deck.color } : {}),
      ...(deck.emoji ? { emoji: deck.emoji } : {}),
      cards: deck.cards.map((c) => {
        const tags = c.tags?.length ? { tags: c.tags } : {};
        const hint = c.hint ? { hint: c.hint } : {};
        if (c.type === "choice") {
          return {
            type: "choice",
            title: c.title,
            complexity: c.complexity,
            ...tags,
            ...hint,
            options: c.options.map((o) => ({ text: o.text, correct: o.correct })),
          };
        }
        return {
          title: c.title,
          response: c.response,
          complexity: c.complexity,
          ...tags,
          ...hint,
        };
      }),
    },
    null,
    2
  );

  async function copyToClipboard(text: string, setCopied: (v: boolean) => void) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-h-[85vh] overflow-y-auto overflow-x-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export &amp; Share</DialogTitle>
        </DialogHeader>

        {includeShareUrl && (
          <>
            <div className="flex min-w-0 flex-col gap-2">
              <p className="text-sm font-medium">Share Link</p>
              {shareUrl === null && open ? (
                <p className="text-xs text-muted-foreground">Computing link…</p>
              ) : shareUrl ? (
                <div className="flex items-center gap-2">
                  <p className="flex-1 truncate rounded bg-muted px-2 py-1 font-mono text-xs">{shareUrl}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(shareUrl, setCopiedUrl)}
                  >
                    {copiedUrl ? "Copied!" : "Copy"}
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Deck is too large to share via URL.</p>
              )}
            </div>
            <Separator />
          </>
        )}

        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Deck Data</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(deckJson, setCopiedData)}
            >
              {copiedData ? "Copied!" : "Copy"}
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
