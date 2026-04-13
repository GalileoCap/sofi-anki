import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";

interface DeckListProps {
  decks: Deck[];
  onSelectDeck: (id: string) => void;
  onAddDeck: (title: string, tags: string[]) => void;
  onImportDeck: (data: DeckImport) => void;
}

export function DeckList({
  decks,
  onSelectDeck,
  onAddDeck,
  onImportDeck,
}: DeckListProps) {
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<Set<string>>(new Set());

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    for (const d of decks) {
      for (const t of d.tags ?? []) tags.add(t);
    }
    return Array.from(tags).sort();
  }, [decks]);

  const filteredDecks = useMemo(() => {
    let result = decks;
    if (tagFilter.size > 0) {
      result = result.filter((d) =>
        (d.tags ?? []).some((t) => tagFilter.has(t))
      );
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          (d.tags ?? []).some((t) => t.includes(q)) ||
          d.cards.some((c) =>
            c.title.toLowerCase().includes(q) ||
            (c.tags ?? []).some((t) => t.includes(q))
          )
      );
    }
    return result;
  }, [decks, search, tagFilter]);

  function toggleTag(tag: string) {
    setTagFilter((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

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

      {decks.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <Input
            placeholder="Search decks and cards..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          {allTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {allTags.map((tag) => (
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
              {tagFilter.size > 0 && (
                <Button variant="ghost" size="xs" onClick={() => setTagFilter(new Set())}>
                  Clear
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {decks.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-muted-foreground">No decks yet.</p>
          <p className="text-sm text-muted-foreground">
            Create a new deck or import one from JSON.
          </p>
        </div>
      ) : filteredDecks.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-sm text-muted-foreground">No decks match your search.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDecks.map((deck) => (
            <button
              key={deck.id}
              onClick={() => onSelectDeck(deck.id)}
              className="text-left"
            >
              <Card className="h-full transition-colors hover:bg-muted/50 cursor-pointer" size="sm">
                <CardHeader>
                  <CardTitle>{deck.title}</CardTitle>
                  <CardDescription className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary">
                      {deck.cards.length} {deck.cards.length === 1 ? "card" : "cards"}
                    </Badge>
                    {(deck.tags ?? []).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
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
