import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card as UiCard,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { CardForm } from "@/components/card-form";
import { DeckForm } from "@/components/deck-form";
import { ComplexityBadge } from "@/components/complexity-badge";
import { ImportCardsDialog } from "@/components/import-dialog";
import { ExportDialog } from "@/components/export-dialog";
import { RunStartDialog } from "@/components/run-start-dialog";
import { encodeDeck, MAX_SHARE_URL_LENGTH } from "@/lib/share";
import type { Card, Complexity, Deck, DeckImportCard, RunMode, SessionGoal } from "@/types";
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
  dueCount: number;
  weakCount: number;
  onBack: () => void;
  onStartStudy: (runMode: RunMode, complexityFilter: Complexity[] | null, goal?: SessionGoal) => void;
  onViewStats: () => void;
  onEditDeck: (title: string, tags: string[]) => void;
  onAddCard: (card: Omit<Card, "id">) => void;
  onEditCard: (cardId: string, card: Omit<Card, "id">) => void;
  onDeleteCard: (cardId: string) => void;
  onDeleteDeck: () => void;
  onImportCards: (cards: DeckImportCard[]) => void;
}

export function DeckDetail({
  deck,
  hasRuns,
  dueCount,
  weakCount,
  onBack,
  onStartStudy,
  onViewStats,
  onEditDeck,
  onAddCard,
  onEditCard,
  onDeleteCard,
  onDeleteDeck,
  onImportCards,
}: DeckDetailProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [shareStatus, setShareStatus] = useState<"idle" | "copying" | "copied" | "too-large">("idle");
  const [runDialog, setRunDialog] = useState<{ open: boolean; mode: RunMode; label: string }>({
    open: false,
    mode: "all",
    label: "All Cards",
  });
  const [search, setSearch] = useState("");
  const [complexityFilter, setComplexityFilter] = useState<Set<Complexity>>(new Set());
  const [tagFilter, setTagFilter] = useState<Set<string>>(new Set());

  const complexityCounts = useMemo(() => {
    const counts: Record<Complexity, number> = { easy: 0, medium: 0, hard: 0 };
    for (const card of deck.cards) {
      counts[card.complexity]++;
    }
    return counts;
  }, [deck.cards]);

  const allCardTags = useMemo(() => {
    const tags = new Set<string>();
    for (const card of deck.cards) {
      for (const t of card.tags ?? []) tags.add(t);
    }
    return Array.from(tags).sort();
  }, [deck.cards]);

  const filteredCards = useMemo(() => {
    let cards = deck.cards;
    if (complexityFilter.size > 0) {
      cards = cards.filter((c) => complexityFilter.has(c.complexity));
    }
    if (tagFilter.size > 0) {
      cards = cards.filter((c) =>
        (c.tags ?? []).some((t) => tagFilter.has(t))
      );
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      cards = cards.filter((c) =>
        c.title.toLowerCase().includes(q) ||
        (c.tags ?? []).some((t) => t.includes(q))
      );
    }
    return cards;
  }, [deck.cards, complexityFilter, tagFilter, search]);

  function toggleComplexity(c: Complexity) {
    setComplexityFilter((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  }

  function toggleTag(tag: string) {
    setTagFilter((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  const activeFilter = complexityFilter.size > 0 ? Array.from(complexityFilter) : null;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            Back
          </Button>
          <h1 className="text-2xl font-medium text-foreground">{deck.title}</h1>
          <DeckForm
            trigger={
              <Button variant="ghost" size="xs">
                Edit
              </Button>
            }
            onSubmit={onEditDeck}
            initialTitle={deck.title}
            initialTags={deck.tags ?? []}
            dialogTitle="Edit Deck"
            submitLabel="Save"
          />
        </div>
        <Badge variant="secondary" className="text-sm">
          {deck.cards.length} {deck.cards.length === 1 ? "card" : "cards"}
        </Badge>
      </div>

      {/* Study section */}
      <UiCard size="sm">
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm font-medium text-foreground">Study</p>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setRunDialog({ open: true, mode: "all", label: "All Cards" })}
              disabled={filteredCards.length === 0}
            >
              All Cards{activeFilter ? ` (${filteredCards.length})` : ""}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setRunDialog({ open: true, mode: "due", label: "Due Cards" })}
              disabled={dueCount === 0}
            >
              Due
              <Badge variant="outline" className="ml-1 text-xs">{dueCount}</Badge>
            </Button>
            <Button
              variant="secondary"
              onClick={() => setRunDialog({ open: true, mode: "weak", label: "Weak Cards" })}
              disabled={weakCount === 0}
            >
              Weak
              <Badge variant="outline" className="ml-1 text-xs">{weakCount}</Badge>
            </Button>
            <Button variant="outline" onClick={onViewStats} disabled={!hasRuns}>
              Stats
            </Button>
          </div>
        </CardContent>
      </UiCard>

      <RunStartDialog
        open={runDialog.open}
        onOpenChange={(open) => setRunDialog((prev) => ({ ...prev, open }))}
        label={runDialog.label}
        onStart={(goal) => onStartStudy(runDialog.mode, activeFilter, goal)}
      />

      {/* Manage section */}
      <div className="flex flex-wrap items-center gap-2">
        <CardForm
          trigger={<Button variant="outline" size="sm">Add Card</Button>}
          onSubmit={onAddCard}
        />
        <ImportCardsDialog
          trigger={<Button variant="outline" size="sm">Import Cards</Button>}
          onImport={onImportCards}
        />
        <ExportDialog
          trigger={<Button variant="outline" size="sm">Export JSON</Button>}
          deck={deck}
        />
        <Button
          variant="outline"
          size="sm"
          disabled={shareStatus === "copying"}
          onClick={async () => {
            setShareStatus("copying");
            try {
              const encoded = await encodeDeck(deck);
              const url = `${window.location.origin}${window.location.pathname}#/share/${encoded}`;
              if (url.length > MAX_SHARE_URL_LENGTH) {
                setShareStatus("too-large");
                setTimeout(() => setShareStatus("idle"), 3000);
                return;
              }
              await navigator.clipboard.writeText(url);
              setShareStatus("copied");
              setTimeout(() => setShareStatus("idle"), 2000);
            } catch {
              setShareStatus("idle");
            }
          }}
        >
          {shareStatus === "copied" ? "Link Copied!" : shareStatus === "too-large" ? "Too Large" : "Share Link"}
        </Button>
        <div className="flex-1" />
        {!confirmDelete ? (
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setConfirmDelete(true)}>
            Delete Deck
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="destructive" size="sm" onClick={onDeleteDeck}>
              Confirm
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <Input
            placeholder="Search cards..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <div className="flex flex-wrap items-center gap-1.5">
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
            {allCardTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={cn(
                  "inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-medium transition-all",
                  tagFilter.has(tag)
                    ? "border-foreground/20 bg-foreground/5 text-foreground"
                    : "border-transparent text-muted-foreground hover:bg-muted"
                )}
              >
                {tag}
              </button>
            ))}
            {(complexityFilter.size > 0 || tagFilter.size > 0) && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => {
                  setComplexityFilter(new Set());
                  setTagFilter(new Set());
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Card list */}
      {deck.cards.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-lg text-muted-foreground">No cards yet</p>
          <p className="text-sm text-muted-foreground">
            Add cards manually or import them from JSON.
          </p>
        </div>
      ) : filteredCards.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-sm text-muted-foreground">No cards match your filters.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filteredCards.map((card) => (
            <UiCard key={card.id} size="sm">
              <CardHeader>
                <div className="flex items-center gap-2 min-w-0">
                  <CardTitle className="text-sm truncate">{card.title}</CardTitle>
                  <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                    <ComplexityBadge complexity={card.complexity} />
                    {card.type === "choice" && (
                      <Badge variant="outline" className="text-xs">
                        {card.multiSelect ? "Multi" : "Single"}
                      </Badge>
                    )}
                    {(card.tags ?? []).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
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
