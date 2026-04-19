import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { DeckImport, DeckImportCard } from "@/types";

const DECK_SCHEMA_PROMPT = `Generate flashcards in the following JSON format:

{
  "title": "Deck Title",
  "tags": ["topic1", "topic2"],
  "cards": [
    {
      "title": "Question or front of card",
      "response": "Answer or back of card",
      "hint": "Optional hint shown before revealing the answer",
      "complexity": "easy" | "medium" | "hard",
      "tags": ["subtopic"]
    },
    {
      "type": "choice",
      "title": "Multiple choice question",
      "hint": "Optional hint shown before answer",
      "complexity": "easy" | "medium" | "hard",
      "tags": ["subtopic"],
      "options": [
        { "text": "Option A", "correct": true },
        { "text": "Option B", "correct": false }
      ]
    }
  ]
}

Standard cards have "title", "response", "complexity", optional "tags", and optional "hint".
Choice cards have "type": "choice", "title", "complexity", optional "tags", optional "hint", and "options" (array of { "text", "correct" }).
If multiple options are correct, it becomes a multi-select question.
The deck and each card can have "tags" (array of strings) for categorization.
Return only the JSON, no extra text.`;

const CARDS_SCHEMA_PROMPT = `Generate flashcards in the following JSON format:

{
  "cards": [
    {
      "title": "Question or front of card",
      "response": "Answer or back of card",
      "hint": "Optional hint shown before revealing the answer",
      "complexity": "easy" | "medium" | "hard",
      "tags": ["subtopic"]
    },
    {
      "type": "choice",
      "title": "Multiple choice question",
      "hint": "Optional hint shown before answer",
      "complexity": "easy" | "medium" | "hard",
      "tags": ["subtopic"],
      "options": [
        { "text": "Option A", "correct": true },
        { "text": "Option B", "correct": false }
      ]
    }
  ]
}

Standard cards have "title", "response", "complexity", optional "tags", and optional "hint".
Choice cards have "type": "choice", "title", "complexity", optional "tags", optional "hint", and "options" (array of { "text", "correct" }).
Return only the JSON, no extra text.`;

function isValidCard(c: unknown): c is DeckImportCard {
  if (typeof c !== "object" || c === null) return false;
  const obj = c as Record<string, unknown>;
  if (typeof obj.title !== "string") return false;
  // Choice card
  if (obj.type === "choice") {
    if (!Array.isArray(obj.options)) return false;
    return obj.options.every(
      (o: unknown) =>
        typeof o === "object" &&
        o !== null &&
        typeof (o as Record<string, unknown>).text === "string" &&
        typeof (o as Record<string, unknown>).correct === "boolean"
    );
  }
  // Standard card
  return typeof obj.response === "string";
}

interface ImportDeckDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onImport: (data: DeckImport) => void;
}

export function ImportDeckDialog({ trigger, open: controlledOpen, onOpenChange: controlledOnOpenChange, onImport }: ImportDeckDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const [json, setJson] = useState("");
  const [error, setError] = useState("");
  const [copiedSchema, setCopiedSchema] = useState(false);

  function handleOpenChange(next: boolean) {
    setInternalOpen(next);
    controlledOnOpenChange?.(next);
    if (next) {
      setJson("");
      setError("");
    }
  }

  function handleImport() {
    try {
      const parsed = JSON.parse(json);
      if (
        typeof parsed.title !== "string" ||
        !Array.isArray(parsed.cards) ||
        parsed.cards.some((c: unknown) => !isValidCard(c))
      ) {
        setError('Invalid format. Each card needs "title" + "response", or "type": "choice" + "options".');
        return;
      }
      onImport(parsed as DeckImport);
      handleOpenChange(false);
    } catch {
      setError("Invalid JSON. Please check the format and try again.");
    }
  }

  async function copySchema() {
    await navigator.clipboard.writeText(DECK_SCHEMA_PROMPT);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-h-[85vh] overflow-x-hidden overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Deck</DialogTitle>
          <DialogDescription>
            Paste a JSON object with a <code className="rounded bg-muted px-1 py-0.5 text-xs">title</code> and
            an array of <code className="rounded bg-muted px-1 py-0.5 text-xs">cards</code>. Cards can be
            standard (with <code className="rounded bg-muted px-1 py-0.5 text-xs">response</code>) or
            choice (with <code className="rounded bg-muted px-1 py-0.5 text-xs">options</code>).
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">LLM Prompt Template</p>
            <Button variant="outline" size="sm" onClick={copySchema}>
              {copiedSchema ? "Copied!" : "Copy"}
            </Button>
          </div>
          <pre className="max-h-36 overflow-auto rounded-lg bg-muted p-3 text-xs leading-relaxed whitespace-pre-wrap break-all">
            {DECK_SCHEMA_PROMPT}
          </pre>
        </div>

        <Separator />

        <Textarea
          placeholder={'{\n  "title": "My Deck",\n  "cards": [\n    { "title": "Q1", "response": "A1" }\n  ]\n}'}
          value={json}
          onChange={(e) => {
            setJson(e.target.value);
            setError("");
          }}
          rows={8}
          className="font-mono text-xs"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button onClick={handleImport} disabled={!json.trim()}>
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ImportCardsDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onImport: (cards: DeckImportCard[]) => void;
}

export function ImportCardsDialog({ trigger, open: controlledOpen, onOpenChange: controlledOnOpenChange, onImport }: ImportCardsDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const [json, setJson] = useState("");
  const [error, setError] = useState("");
  const [copiedSchema, setCopiedSchema] = useState(false);

  function handleOpenChange(next: boolean) {
    setInternalOpen(next);
    controlledOnOpenChange?.(next);
    if (next) {
      setJson("");
      setError("");
    }
  }

  function handleImport() {
    try {
      const parsed = JSON.parse(json);
      const cards = Array.isArray(parsed) ? parsed : parsed.cards;
      if (
        !Array.isArray(cards) ||
        cards.some((c: unknown) => !isValidCard(c))
      ) {
        setError('Invalid format. Each card needs "title" + "response", or "type": "choice" + "options".');
        return;
      }
      onImport(cards as DeckImportCard[]);
      handleOpenChange(false);
    } catch {
      setError("Invalid JSON. Please check the format and try again.");
    }
  }

  async function copySchema() {
    await navigator.clipboard.writeText(CARDS_SCHEMA_PROMPT);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-h-[85vh] overflow-x-hidden overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Cards</DialogTitle>
          <DialogDescription>
            Paste a JSON object with a <code className="rounded bg-muted px-1 py-0.5 text-xs">cards</code> array.
            Standard cards need <code className="rounded bg-muted px-1 py-0.5 text-xs">title</code> and <code className="rounded bg-muted px-1 py-0.5 text-xs">response</code>.
            Choice cards need <code className="rounded bg-muted px-1 py-0.5 text-xs">type: "choice"</code> and <code className="rounded bg-muted px-1 py-0.5 text-xs">options</code>.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">LLM Prompt Template</p>
            <Button variant="outline" size="sm" onClick={copySchema}>
              {copiedSchema ? "Copied!" : "Copy"}
            </Button>
          </div>
          <pre className="max-h-36 overflow-auto rounded-lg bg-muted p-3 text-xs leading-relaxed whitespace-pre-wrap break-all">
            {CARDS_SCHEMA_PROMPT}
          </pre>
        </div>

        <Separator />

        <Textarea
          placeholder={'{\n  "cards": [\n    { "title": "Q1", "response": "A1" },\n    { "type": "choice", "title": "Q2", "options": [\n      { "text": "A", "correct": true },\n      { "text": "B", "correct": false }\n    ]}\n  ]\n}'}
          value={json}
          onChange={(e) => {
            setJson(e.target.value);
            setError("");
          }}
          rows={8}
          className="font-mono text-xs"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button onClick={handleImport} disabled={!json.trim()}>
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
