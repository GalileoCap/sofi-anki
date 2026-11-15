import type { Result } from "neverthrow";
import { useState } from "react";

import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/language-context";
import type { DecodeError } from "@/core/decode";
import { type DeckImport, type ImportCard, readCardsJson, readDeckJson } from "@/core/deck-json";
import { looks } from "@/lib/ui-looks";
import type { TranslationKey } from "@/lib/translations";

const DECK_EXAMPLE = '{\n  "title": "My Deck",\n  "cards": [\n    { "title": "Q1", "response": "A1" }\n  ]\n}';

const CARDS_EXAMPLE =
  '{\n  "cards": [\n    { "title": "Q1", "response": "A1" },\n    { "type": "choice", "title": "Q2", "options": [\n      { "text": "A", "correct": true },\n      { "text": "B", "correct": false }\n    ]}\n  ]\n}';

const decodeMessage: Record<DecodeError["kind"], TranslationKey> = {
  notJson: "importDialog.invalidJson",
  badShape: "importDialog.invalidFormat",
};

type DialogProps<T> = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (data: T) => void;
};

type JsonImportDialogProps<T> = DialogProps<T> & {
  title: TranslationKey;
  description: TranslationKey;
  prompt: TranslationKey;
  example: string;
  read: (text: string) => Result<T, DecodeError>;
};

/** Pasted JSON read by `read`, with a prompt to copy for a language model that writes it. Each opening starts empty. */
function JsonImportDialog<T>({ open, onOpenChange, ...body }: JsonImportDialogProps<T>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={looks.wideDialog}>
        <JsonBody {...body} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

type JsonBodyProps<T> = Omit<JsonImportDialogProps<T>, "open" | "onOpenChange"> & { onDone: () => void };

/** The dialog's inside, whose text and error go when the dialog closes. */
function JsonBody<T>({ onImport, onDone, title, description, prompt, example, read }: JsonBodyProps<T>) {
  const { t } = useLanguage();
  const [json, setJson] = useState("");
  const [error, setError] = useState<DecodeError | null>(null);

  function importJson() {
    read(json).match(
      (data) => {
        onImport(data);
        onDone();
      },
      setError,
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t(title)}</DialogTitle>
        <DialogDescription>{t(description)}</DialogDescription>
      </DialogHeader>

      <div className={looks.column}>
        <div className={looks.spread}>
          <p className={looks.label}>{t("importDialog.llmPromptTemplate")}</p>
          <CopyButton text={t(prompt)} />
        </div>
        <pre tabIndex={0} className="max-h-36 overflow-auto rounded-lg bg-muted p-3 text-xs leading-relaxed whitespace-pre-wrap break-all">{t(prompt)}</pre>
      </div>

      <Textarea
        placeholder={example}
        value={json}
        onChange={(e) => {
          setJson(e.target.value);
          setError(null);
        }}
        rows={8}
        className={looks.code}
      />
      {error && (
        <p role="alert" className={looks.error}>
          {t(decodeMessage[error.kind])}
        </p>
      )}
      <DialogFooter>
        <Button onClick={importJson} disabled={!json.trim()}>
          {t("importDialog.bringIn")}
        </Button>
      </DialogFooter>
    </>
  );
}

/** A new deck from pasted JSON. */
export function ImportDeckDialog(props: DialogProps<DeckImport>) {
  return (
    <JsonImportDialog
      {...props}
      title="importDialog.importDeckTitle"
      description="importDialog.deckDescription"
      prompt="import.deck.schemaPrompt"
      example={DECK_EXAMPLE}
      read={readDeckJson}
    />
  );
}

/** Cards for a deck from pasted JSON: an array of cards, or an object with one under `cards`. */
export function ImportCardsDialog(props: DialogProps<ImportCard[]>) {
  return (
    <JsonImportDialog
      {...props}
      title="importDialog.importCardsTitle"
      description="importDialog.cardsDescription"
      prompt="import.cards.schemaPrompt"
      example={CARDS_EXAMPLE}
      read={readCardsJson}
    />
  );
}
