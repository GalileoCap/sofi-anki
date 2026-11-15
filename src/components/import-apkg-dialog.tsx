import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/language-context";
import type { CardSchedule, Deck } from "@/core/model";
import { now } from "@/effects/clock";
import { readFileBytes } from "@/effects/files";
import { looks } from "@/lib/ui-looks";

type ParsedApkg = { decks: Deck[]; schedules: CardSchedule[] };

type ImportApkgDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (parsed: ParsedApkg) => void;
};

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "parsed"; result: ParsedApkg; fileName: string }
  | { kind: "error"; message: string };

/** Decks from an Anki export, dropped or chosen, listed before they come in. */
export function ImportApkgDialog({ open, onOpenChange, onImport }: ImportApkgDialogProps) {
  const { t, tp } = useLanguage();
  const [state, setState] = useState<State>({ kind: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);

  function changeOpen(next: boolean) {
    onOpenChange(next);
    if (next) setState({ kind: "idle" });
  }

  async function readFile(file: File) {
    setState({ kind: "loading" });
    const { readApkg } = await import("@/effects/anki-file");
    await readFileBytes(file)
      .mapErr(() => t("importApkg.parseFailed"))
      .andThen((bytes) => readApkg(bytes, now()).mapErr(() => t("importApkg.parseFailed")))
      .match(
        (result) =>
          setState(result.decks.length === 0 ? { kind: "error", message: t("importApkg.noCards") } : { kind: "parsed", result, fileName: file.name }),
        (message) => setState({ kind: "error", message }),
      );
  }

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) readFile(file);
  }

  function drop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) readFile(file);
  }

  function bringIn() {
    if (state.kind !== "parsed") return;
    onImport(state.result);
    changeOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("importApkg.title")}</DialogTitle>
          <DialogDescription>{t("importApkg.description")}</DialogDescription>
        </DialogHeader>
        <input ref={inputRef} type="file" accept=".apkg,.zip" className="hidden" aria-hidden="true" tabIndex={-1} onChange={pick} />

        {state.kind === "parsed" ? (
          <div>
            <p className={looks.muted}>{t("importApkg.found").replace("{file}", state.fileName)}</p>
            <div className={looks.list}>
              {state.result.decks.map((deck) => (
                <div key={deck.id} className={looks.listRow}>
                  <span className="min-w-0 truncate font-bold">{deck.title}</span>
                  <span className={looks.fineFigure}>
                    {deck.cards.length} {tp(deck.cards.length, "common.card", "common.cards")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border p-6 text-center"
            onDragOver={(e) => e.preventDefault()}
            onDrop={drop}
          >
            {state.kind === "loading" ? (
              <p className={looks.muted}>{t("importApkg.parsing")}</p>
            ) : (
              <>
                <p className="font-bold">{t("importApkg.dropZone")}</p>
                <Button variant="outline" onClick={() => inputRef.current?.click()}>
                  {t("importApkg.browseFile")}
                </Button>
              </>
            )}
          </div>
        )}

        {state.kind === "error" && (
          <p role="alert" className={looks.error}>
            {state.message}
          </p>
        )}

        {state.kind === "parsed" && (
          <DialogFooter>
            <Button variant="ghost" onClick={() => inputRef.current?.click()}>
              {t("importApkg.chooseAnother")}
            </Button>
            <Button onClick={bringIn}>
              {state.result.decks.length === 1
                ? t("importApkg.importDeck")
                : t("importApkg.importAllDecks").replace("{n}", String(state.result.decks.length))}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
