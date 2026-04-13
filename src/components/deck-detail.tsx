import { useState, useMemo } from "react";
import { DropdownMenu } from "radix-ui";
import { HugeiconsIcon } from "@hugeicons/react";
import { MoreVerticalIcon } from "@hugeicons/core-free-icons";
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

// Dropdown menu item styles
const ITEM_CLASS =
  "flex w-full cursor-pointer select-none items-center rounded px-2 py-1.5 text-sm outline-none transition-colors data-[highlighted]:bg-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-40";
const MENU_CONTENT_CLASS =
  "z-50 min-w-36 rounded-lg border bg-popover p-1 shadow-md";

interface DeckDetailProps {
  deck: Deck;
  hasRuns: boolean;
  dueCount: number;
  weakCount: number;
  onBack: () => void;
  onStartStudy: (runMode: RunMode, complexityFilter: Complexity[] | null, goal?: SessionGoal) => void;
  onViewStats: () => void;
  onEditDeck: (title: string, tags: string[], color?: string, emoji?: string) => void;
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

  // Study run dialog state (desktop: pre-selected mode; mobile: mode picker shown)
  const [runDialog, setRunDialog] = useState<{ open: boolean; mode: RunMode; label: string }>({
    open: false,
    mode: "all",
    label: "All Cards",
  });
  const [mobileStartOpen, setMobileStartOpen] = useState(false);

  // Manage section dialog open states (for mobile overflow menu)
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  // Card editing state (for mobile "..." per card)
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const editingCard = editingCardId ? deck.cards.find((c) => c.id === editingCardId) : undefined;

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

  function handleRunStart(mode: RunMode, goal?: SessionGoal) {
    onStartStudy(mode, activeFilter, goal);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="sm" onClick={onBack}>
            Back
          </Button>
          {deck.emoji && (
            <span className="text-2xl leading-none shrink-0">{deck.emoji}</span>
          )}
          <h1 className="text-2xl font-medium text-foreground truncate">{deck.title}</h1>
          {/* Desktop: inline Edit button */}
          <div className="hidden sm:block shrink-0">
            <DeckForm
              trigger={<Button variant="ghost" size="xs">Edit</Button>}
              onSubmit={onEditDeck}
              initialTitle={deck.title}
              initialTags={deck.tags ?? []}
              initialColor={deck.color}
              initialEmoji={deck.emoji}
              dialogTitle="Edit Deck"
              submitLabel="Save"
            />
          </div>
        </div>
        <Badge variant="secondary" className="text-sm shrink-0">
          {deck.cards.length} {deck.cards.length === 1 ? "card" : "cards"}
        </Badge>
      </div>

      {/* Study section */}
      <UiCard size="sm">
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm font-medium text-foreground">Study</p>

          {/* Mobile: single Start button */}
          <div className="sm:hidden">
            <Button
              className="w-full"
              onClick={() => setMobileStartOpen(true)}
              disabled={deck.cards.length === 0}
            >
              Start
            </Button>
          </div>

          {/* Desktop: original four buttons */}
          <div className="hidden sm:flex flex-wrap gap-2">
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

          {/* Mobile Stats link */}
          {hasRuns && (
            <Button variant="ghost" size="sm" className="sm:hidden self-start -mt-2 -ml-2 text-muted-foreground" onClick={onViewStats}>
              View Stats
            </Button>
          )}
        </CardContent>
      </UiCard>

      {/* Mobile start dialog — with mode picker */}
      <RunStartDialog
        open={mobileStartOpen}
        onOpenChange={setMobileStartOpen}
        showModePicker
        dueCount={dueCount}
        weakCount={weakCount}
        onStart={handleRunStart}
      />

      {/* Desktop run dialog */}
      <RunStartDialog
        open={runDialog.open}
        onOpenChange={(open) => setRunDialog((prev) => ({ ...prev, open }))}
        label={runDialog.label}
        onStart={(mode, goal) => handleRunStart(mode, goal)}
      />

      {/* Manage section */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Add Card — always visible */}
        <CardForm
          trigger={<Button variant="outline" size="sm">Add Card</Button>}
          onSubmit={onAddCard}
        />

        {/* Desktop secondary actions */}
        <div className="hidden sm:flex items-center gap-2">
          <ImportCardsDialog
            trigger={<Button variant="outline" size="sm">Import Cards</Button>}
            onImport={onImportCards}
          />
          <ExportDialog
            trigger={<Button variant="outline" size="sm">Export JSON</Button>}
            deck={deck}
          />
          <ShareLinkButton deck={deck} />
        </div>

        {/* Mobile "..." overflow menu */}
        <div className="sm:hidden">
          <OverflowMenu>
            <DeckForm
              trigger={
                <DropdownMenu.Item className={ITEM_CLASS} onSelect={(e) => e.preventDefault()}>
                  Edit Deck
                </DropdownMenu.Item>
              }
              onSubmit={onEditDeck}
              initialTitle={deck.title}
              initialTags={deck.tags ?? []}
              initialColor={deck.color}
              initialEmoji={deck.emoji}
              dialogTitle="Edit Deck"
              submitLabel="Save"
            />
            <DropdownMenu.Item
              className={ITEM_CLASS}
              onSelect={() => setImportOpen(true)}
            >
              Import Cards
            </DropdownMenu.Item>
            <DropdownMenu.Item
              className={ITEM_CLASS}
              onSelect={() => setExportOpen(true)}
            >
              Share &amp; Export
            </DropdownMenu.Item>
          </OverflowMenu>
        </div>

        {/* Mobile dialogs controlled by overflow menu */}
        <ImportCardsDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          onImport={onImportCards}
        />
        <ExportDialog
          open={exportOpen}
          onOpenChange={setExportOpen}
          deck={deck}
          includeShareUrl
        />

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
                  {/* Desktop: Edit + Delete */}
                  <div className="hidden sm:flex gap-1">
                    <CardForm
                      trigger={<Button variant="ghost" size="xs">Edit</Button>}
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

                  {/* Mobile: "..." */}
                  <div className="sm:hidden">
                    <OverflowMenu>
                      <DropdownMenu.Item
                        className={ITEM_CLASS}
                        onSelect={() => setEditingCardId(card.id)}
                      >
                        Edit
                      </DropdownMenu.Item>
                      <DropdownMenu.Item
                        className={cn(ITEM_CLASS, "text-destructive data-[highlighted]:text-destructive")}
                        onSelect={() => onDeleteCard(card.id)}
                      >
                        Delete
                      </DropdownMenu.Item>
                    </OverflowMenu>
                  </div>
                </CardAction>
              </CardHeader>
            </UiCard>
          ))}
        </div>
      )}

      {/* Controlled CardForm for mobile card editing */}
      {editingCard && (
        <CardForm
          open={!!editingCard}
          onOpenChange={(o) => { if (!o) setEditingCardId(null); }}
          onSubmit={(updates) => {
            onEditCard(editingCard.id, updates);
            setEditingCardId(null);
          }}
          initial={editingCard}
          dialogTitle="Edit Card"
          submitLabel="Save"
        />
      )}
    </div>
  );
}

/** Reusable "⋮" overflow dropdown trigger */
function OverflowMenu({ children }: { children: React.ReactNode }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button variant="ghost" size="icon-xs" aria-label="More options">
          <HugeiconsIcon icon={MoreVerticalIcon} size={14} strokeWidth={2} />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className={MENU_CONTENT_CLASS} align="end" sideOffset={4}>
          {children}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

/** Desktop-only Share Link button (copy URL to clipboard) */
function ShareLinkButton({ deck }: { deck: Deck }) {
  const [shareStatus, setShareStatus] = useState<"idle" | "copying" | "copied" | "too-large">("idle");

  return (
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
  );
}
