import { useRef, useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { CardSRS, Deck } from "@/types";
import { parseApkg, type ParsedApkg } from "@/lib/apkg";

interface ImportApkgDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onImport: (decks: Deck[], srs: CardSRS[]) => void;
}

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "parsed"; result: ParsedApkg; fileName: string }
  | { kind: "error"; message: string };

export function ImportApkgDialog({
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onImport,
}: ImportApkgDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const [state, setState] = useState<State>({ kind: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  function handleOpenChange(next: boolean) {
    setInternalOpen(next);
    controlledOnOpenChange?.(next);
    if (next) {
      setState({ kind: "idle" });
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleFile(file: File) {
    setState({ kind: "loading" });
    try {
      const result = await parseApkg(file);
      if (result.decks.length === 0) {
        setState({ kind: "error", message: "No importable cards found in this file." });
        return;
      }
      setState({ kind: "parsed", result, fileName: file.name });
    } catch (e) {
      setState({
        kind: "error",
        message: e instanceof Error ? e.message : "Failed to parse the .apkg file.",
      });
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleImport() {
    if (state.kind !== "parsed") return;
    onImport(state.result.decks, state.result.srs);
    handleOpenChange(false);
  }

  const totalCards =
    state.kind === "parsed" ? state.result.decks.reduce((s, d) => s + d.cards.length, 0) : 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("importApkg.title")}</DialogTitle>
          <DialogDescription>
            Select an Anki export file (<code className="rounded bg-muted px-1 py-0.5 text-xs">.apkg</code>).
            Standard and basic-reversed cards are imported; cloze cards are skipped. SRS history is preserved.
          </DialogDescription>
        </DialogHeader>

        {/* Drop zone */}
        {state.kind !== "parsed" && (
          <div
            className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border p-8 text-center transition-colors hover:border-muted-foreground/50"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            {state.kind === "loading" ? (
              <p className="text-sm text-muted-foreground">{t("importApkg.parsing")}</p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Drag &amp; drop an <strong>.apkg</strong> file here, or
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => inputRef.current?.click()}
                >
                  {t("importApkg.browseFile")}
                </Button>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".apkg,.zip"
                  className="hidden"
                  onChange={handleInputChange}
                />
              </>
            )}
          </div>
        )}

        {state.kind === "error" && (
          <p className="text-sm text-destructive">{state.message}</p>
        )}

        {state.kind === "parsed" && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Found <strong>{state.result.decks.length}</strong>{" "}
              {state.result.decks.length === 1 ? "deck" : "decks"} with{" "}
              <strong>{totalCards}</strong> cards total in{" "}
              <span className="font-mono text-xs">{state.fileName}</span>
            </p>
            <ul className="flex flex-col gap-1 rounded-md border bg-muted/40 p-3">
              {state.result.decks.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate font-medium">{d.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {d.cards.length} {d.cards.length === 1 ? "card" : "cards"}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setState({ kind: "idle" });
                  if (inputRef.current) inputRef.current.value = "";
                }}
              >
                {t("importApkg.chooseAnother")}
              </Button>
              <Button size="sm" onClick={handleImport}>
                Import {state.result.decks.length === 1 ? "deck" : "all decks"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
