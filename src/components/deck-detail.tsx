import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card as UiCard,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { CardForm } from "@/components/card-form";
import { ComplexityBadge } from "@/components/complexity-badge";
import { ImportCardsDialog } from "@/components/import-dialog";
import { ExportDialog } from "@/components/export-dialog";
import type { Card, Complexity, Deck, DeckImportCard } from "@/types";
import { cn } from "@/lib/utils";

const COMPLEXITIES: Complexity[] = ["easy", "medium", "hard"];
const COMPLEXITY_LABELS: Record<Complexity, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

interface DeckDetailProps {
  deck: Deck;
  hasRuns: boolean;
  onBack: () => void;
  onStartStudy: (complexityFilter: Complexity[] | null) => void;
  onViewStats: () => void;
  onAddCard: (card: Omit<Card, "id">) => void;
  onEditCard: (cardId: string, card: Omit<Card, "id">) => void;
  onDeleteCard: (cardId: string) => void;
  onDeleteDeck: () => void;
  onImportCards: (cards: DeckImportCard[]) => void;
}

export function DeckDetail({
  deck,
  hasRuns,
  onBack,
  onStartStudy,
  onViewStats,
  onAddCard,
  onEditCard,
  onDeleteCard,
  onDeleteDeck,
  onImportCards,
}: DeckDetailProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [search, setSearch] = useState("");
  const [complexityFilter, setComplexityFilter] = useState<Set<Complexity>>(new Set());

  const complexityCounts = useMemo(() => {
    const counts: Record<Complexity, number> = { easy: 0, medium: 0, hard: 0 };
    for (const card of deck.cards) {
      counts[card.complexity]++;
    }
    return counts;
  }, [deck.cards]);

  const filteredCards = useMemo(() => {
    let cards = deck.cards;
    if (complexityFilter.size > 0) {
      cards = cards.filter((c) => complexityFilter.has(c.complexity));
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      cards = cards.filter((c) => c.title.toLowerCase().includes(q));
    }
    return cards;
  }, [deck.cards, complexityFilter, search]);

  function toggleComplexity(c: Complexity) {
    setComplexityFilter((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  }

  const activeFilter = complexityFilter.size > 0 ? Array.from(complexityFilter) : null;

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
        <Button
          onClick={() => onStartStudy(activeFilter)}
          disabled={filteredCards.length === 0}
        >
          Start Run{activeFilter ? ` (${filteredCards.length})` : ""}
        </Button>
        <Button variant="outline" onClick={onViewStats} disabled={!hasRuns}>
          Stats
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

      {/* Filters */}
      {deck.cards.length > 0 && (
        <div className="flex flex-col gap-3">
          <Input
            placeholder="Search cards..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Filter:</span>
            {COMPLEXITIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => toggleComplexity(c)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all",
                  complexityFilter.has(c)
                    ? "border-foreground/20 bg-foreground/5 text-foreground"
                    : "border-transparent text-muted-foreground hover:bg-muted"
                )}
              >
                {COMPLEXITY_LABELS[c]}
                <span className="font-mono text-muted-foreground">{complexityCounts[c]}</span>
              </button>
            ))}
            {complexityFilter.size > 0 && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setComplexityFilter(new Set())}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      )}

      {deck.cards.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-muted-foreground">No cards yet.</p>
          <p className="text-sm text-muted-foreground">
            Add cards manually or import them from JSON.
          </p>
        </div>
      ) : filteredCards.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-sm text-muted-foreground">No cards match your filters.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredCards.map((card) => (
            <UiCard key={card.id} size="sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm">{card.title}</CardTitle>
                  <ComplexityBadge complexity={card.complexity} />
                  {card.type === "choice" && (
                    <Badge variant="outline" className="text-xs">
                      {card.multiSelect ? "Multi" : "Single"} Choice
                    </Badge>
                  )}
                </div>
                <CardAction>
                  <div className="flex gap-1">
                    <CardForm
                      trigger={
                        <Button variant="ghost" size="xs">
                          Edit
                        </Button>
                      }
                      onSubmit={(updates) => onEditCard(card.id, updates)}
                      initial={card}
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
            </UiCard>
          ))}
        </div>
      )}
    </div>
  );
}
