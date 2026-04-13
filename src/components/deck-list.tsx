import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DeckForm } from "@/components/deck-form";
import { ImportDeckDialog } from "@/components/import-dialog";
import type { Deck, DeckImport } from "@/types";

interface DeckListProps {
  decks: Deck[];
  onSelectDeck: (id: string) => void;
  onAddDeck: (title: string) => void;
  onImportDeck: (data: DeckImport) => void;
}

export function DeckList({
  decks,
  onSelectDeck,
  onAddDeck,
  onImportDeck,
}: DeckListProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium text-foreground">Your Decks</h1>
        <div className="flex gap-2">
          <ImportDeckDialog
            trigger={<Button variant="outline">Import</Button>}
            onImport={onImportDeck}
          />
          <DeckForm
            trigger={<Button>New Deck</Button>}
            onSubmit={onAddDeck}
          />
        </div>
      </div>

      {decks.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-muted-foreground">No decks yet.</p>
          <p className="text-sm text-muted-foreground">
            Create a new deck or import one from JSON.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck) => (
            <button
              key={deck.id}
              onClick={() => onSelectDeck(deck.id)}
              className="text-left"
            >
              <Card className="h-full transition-colors hover:bg-muted/50 cursor-pointer" size="sm">
                <CardHeader>
                  <CardTitle>{deck.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {deck.cards.length} {deck.cards.length === 1 ? "card" : "cards"}
                    </Badge>
                  </CardDescription>
                </CardHeader>
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
