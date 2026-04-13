import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { DeckImport } from "@/types";

interface ImportDeckDialogProps {
  trigger: React.ReactNode;
  onImport: (data: DeckImport) => void;
}

export function ImportDeckDialog({ trigger, onImport }: ImportDeckDialogProps) {
  const [open, setOpen] = useState(false);
  const [json, setJson] = useState("");
  const [error, setError] = useState("");

  function handleOpenChange(next: boolean) {
    setOpen(next);
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
        parsed.cards.some(
          (c: unknown) =>
            typeof c !== "object" ||
            c === null ||
            typeof (c as Record<string, unknown>).title !== "string" ||
            typeof (c as Record<string, unknown>).response !== "string"
        )
      ) {
        setError('Invalid format. Expected { "title": "...", "cards": [{ "title": "...", "response": "..." }] }');
        return;
      }
      onImport(parsed as DeckImport);
      setOpen(false);
    } catch {
      setError("Invalid JSON. Please check the format and try again.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Deck</DialogTitle>
          <DialogDescription>
            Paste a JSON object with a <code className="rounded bg-muted px-1 py-0.5 text-xs">title</code> and
            an array of <code className="rounded bg-muted px-1 py-0.5 text-xs">cards</code>, each
            with <code className="rounded bg-muted px-1 py-0.5 text-xs">title</code> and <code className="rounded bg-muted px-1 py-0.5 text-xs">response</code>.
          </DialogDescription>
        </DialogHeader>
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
  trigger: React.ReactNode;
  onImport: (cards: { title: string; response: string }[]) => void;
}

export function ImportCardsDialog({ trigger, onImport }: ImportCardsDialogProps) {
  const [open, setOpen] = useState(false);
  const [json, setJson] = useState("");
  const [error, setError] = useState("");

  function handleOpenChange(next: boolean) {
    setOpen(next);
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
        cards.some(
          (c: unknown) =>
            typeof c !== "object" ||
            c === null ||
            typeof (c as Record<string, unknown>).title !== "string" ||
            typeof (c as Record<string, unknown>).response !== "string"
        )
      ) {
        setError('Invalid format. Expected [{ "title": "...", "response": "..." }] or { "cards": [...] }');
        return;
      }
      onImport(cards as { title: string; response: string }[]);
      setOpen(false);
    } catch {
      setError("Invalid JSON. Please check the format and try again.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Cards</DialogTitle>
          <DialogDescription>
            Paste a JSON array of cards, each
            with <code className="rounded bg-muted px-1 py-0.5 text-xs">title</code> and <code className="rounded bg-muted px-1 py-0.5 text-xs">response</code>.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder={'[\n  { "title": "Q1", "response": "A1" },\n  { "title": "Q2", "response": "A2" }\n]'}
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
