import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { Deck } from "@/types";

const SCHEMA_PROMPT = `Generate flashcards in the following JSON format:

{
  "title": "Deck Title",
  "cards": [
    {
      "title": "Question or front of card",
      "response": "Answer or back of card",
      "complexity": "easy" | "medium" | "hard"
    },
    {
      "type": "choice",
      "title": "Multiple choice question",
      "complexity": "easy" | "medium" | "hard",
      "options": [
        { "text": "Option A", "correct": true },
        { "text": "Option B", "correct": false }
      ]
    }
  ]
}

Standard cards have "title", "response", and "complexity".
Choice cards have "type": "choice", "title", "complexity", and "options" (array of { "text", "correct" }).
If multiple options are correct, it becomes a multi-select question.
Return only the JSON, no extra text.`;

interface ExportDialogProps {
  trigger: React.ReactNode;
  deck: Deck;
}

export function ExportDialog({ trigger, deck }: ExportDialogProps) {
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [copiedData, setCopiedData] = useState(false);

  const deckJson = JSON.stringify(
    {
      title: deck.title,
      cards: deck.cards.map((c) => {
        if (c.type === "choice") {
          return {
            type: "choice",
            title: c.title,
            complexity: c.complexity,
            options: c.options.map((o) => ({ text: o.text, correct: o.correct })),
          };
        }
        return {
          title: c.title,
          response: c.response,
          complexity: c.complexity,
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
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Export &amp; Share</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">LLM Prompt Template</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(SCHEMA_PROMPT, setCopiedSchema)}
            >
              {copiedSchema ? "Copied!" : "Copy"}
            </Button>
          </div>
          <pre className="max-h-40 overflow-auto rounded-lg bg-muted p-3 text-xs leading-relaxed">
            {SCHEMA_PROMPT}
          </pre>
        </div>

        <Separator />

        <div className="flex flex-col gap-3">
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
          <pre className="max-h-60 overflow-auto rounded-lg bg-muted p-3 text-xs leading-relaxed">
            {deckJson}
          </pre>
        </div>
      </DialogContent>
    </Dialog>
  );
}
