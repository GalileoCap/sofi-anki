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

/** Decks from an Anki export, dropped or chosen, listed before they come in. Each opening starts with no file. */
export function ImportApkgDialog({ open, onOpenChange, onImport }: ImportApkgDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <ApkgBody onImport={onImport} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

/** The dialog's inside, whose state goes when the dialog closes. */
function ApkgBody({ onImport, onDone }: { onImport: (parsed: ParsedApkg) => void; onDone: () => void }) {
  const { t, tp } = useLanguage();
  const [state, setState] = useState<State>({ kind: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);

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
    onDone();
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t("importApkg.title")}</DialogTitle>
        <DialogDescription>{t("importApkg.description")}</DialogDescription>
      </DialogHeader>
      <input ref={inputRef} type="file" accept=".apkg,.zip" className="hidden" aria-hidden="true" tabIndex={-1} onChange={pick} />

      {state.kind === "parsed" ? (
        <div>
          <p className={looks.muted}>
            {state.result.decks.length === 1
              ? t("importApkg.found").replace("{file}", state.fileName)
              : t("importApkg.foundAll")
                  .replace("{file}", state.fileName)
                  .replace("{n}", String(state.result.decks.reduce((sum, deck) => sum + deck.cards.length, 0)))
                  .replace("{d}", String(state.result.decks.length))}
          </p>
          <div className={looks.list}>
            {state.result.decks.map((deck) => (
              <div key={deck.id} className={looks.listRow}>
                <span className="min-w-0 truncate font-bold" title={deck.title}>{deck.title}</span>
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
    </>
  );
}
