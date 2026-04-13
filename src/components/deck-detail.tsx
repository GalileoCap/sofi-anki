import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CardForm } from "@/components/card-form";
import { ComplexityBadge } from "@/components/complexity-badge";
import { ImportCardsDialog } from "@/components/import-dialog";
import { ExportDialog } from "@/components/export-dialog";
import type { Complexity, Deck } from "@/types";

interface DeckDetailProps {
  deck: Deck;
  onBack: () => void;
  onStartStudy: () => void;
  onAddCard: (title: string, response: string, complexity: Complexity) => void;
  onEditCard: (cardId: string, title: string, response: string, complexity: Complexity) => void;
  onDeleteCard: (cardId: string) => void;
  onDeleteDeck: () => void;
  onImportCards: (cards: { title: string; response: string; complexity?: Complexity }[]) => void;
}

export function DeckDetail({
  deck,
  onBack,
  onStartStudy,
  onAddCard,
  onEditCard,
  onDeleteCard,
  onDeleteDeck,
  onImportCards,
}: DeckDetailProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          Back
        </Button>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-medium text-foreground">{deck.title}</h1>
          <Badge variant="secondary">
            {deck.cards.length} {deck.cards.length === 1 ? "card" : "cards"}
          </Badge>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={onStartStudy} disabled={deck.cards.length === 0}>
          Start Run
        </Button>
        <CardForm
          trigger={<Button variant="outline">Add Card</Button>}
          onSubmit={onAddCard}
        />
        <ImportCardsDialog
          trigger={<Button variant="outline">Import Cards</Button>}
          onImport={onImportCards}
        />
        <ExportDialog
          trigger={<Button variant="outline">Export JSON</Button>}
          deck={deck}
        />
        {!confirmDelete ? (
          <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
            Delete Deck
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="destructive" onClick={onDeleteDeck}>
              Confirm Delete
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
          </div>
        )}
      </div>

      <Separator />

      {deck.cards.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-muted-foreground">No cards yet.</p>
          <p className="text-sm text-muted-foreground">
            Add cards manually or import them from JSON.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {deck.cards.map((card) => (
            <Card key={card.id} size="sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm">{card.title}</CardTitle>
                  <ComplexityBadge complexity={card.complexity} />
                </div>
                <CardDescription className="line-clamp-2 text-xs">
                  {card.response}
                </CardDescription>
                <CardAction>
                  <div className="flex gap-1">
                    <CardForm
                      trigger={
                        <Button variant="ghost" size="xs">
                          Edit
                        </Button>
                      }
                      onSubmit={(title, response, complexity) =>
                        onEditCard(card.id, title, response, complexity)
                      }
                      initialTitle={card.title}
                      initialResponse={card.response}
                      initialComplexity={card.complexity}
                      dialogTitle="Edit Card"
                      submitLabel="Save"
                    />
                    <Button
                      variant="ghost"
                      size="xs"
                      className="text-destructive hover:text-destructive"
                      onClick={() => onDeleteCard(card.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </CardAction>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
