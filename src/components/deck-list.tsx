import { useState, useMemo } from "react";
import { DropdownMenu } from "radix-ui";
import { HugeiconsIcon } from "@hugeicons/react";
import { MoreVerticalIcon } from "@hugeicons/core-free-icons";
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
import { ImportApkgDialog } from "@/components/import-apkg-dialog";
import { BackupDialog } from "@/components/backup-dialog";
import { StudyHeatmap } from "@/components/study-heatmap";
import type { CardSRS, Deck, DeckImport, RunRecord } from "@/types";
import { cn } from "@/lib/utils";

const ITEM_CLASS =
  "flex w-full cursor-pointer select-none items-center rounded px-2 py-1.5 text-sm outline-none transition-colors data-[highlighted]:bg-muted";
const MENU_CONTENT_CLASS =
  "z-50 min-w-36 rounded-lg border bg-popover p-1 shadow-md";

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function computeStreak(runs: RunRecord[], now: Date): number {
  if (runs.length === 0) return 0;
  const studyDays = new Set(runs.map((r) => dateKey(new Date(r.completedAt))));
  const today = dateKey(now);
  let streak = 0;
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // If no run today, check if yesterday had one; if not, streak is 0
  if (!studyDays.has(today)) {
    cursor.setDate(cursor.getDate() - 1);
    if (!studyDays.has(dateKey(cursor))) return 0;
  }

  while (studyDays.has(dateKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function todayCards(runs: RunRecord[], now: Date): number {
  const today = dateKey(now);
  return runs
    .filter((r) => dateKey(new Date(r.completedAt)) === today)
    .reduce((sum, r) => sum + r.results.length, 0);
}

interface DeckListProps {
  decks: Deck[];
  allRuns: RunRecord[];
  dailyGoal: number;
  onUpdateDailyGoal: (goal: number) => void;
  onSelectDeck: (id: string) => void;
  onAddDeck: (title: string, tags: string[], color?: string, emoji?: string) => void;
  onImportDeck: (data: DeckImport) => void;
  onImportApkg: (decks: Deck[], srs: CardSRS[]) => void;
  onRestored: () => void;
  onViewGlobalStats: () => void;
}

export function DeckList({
  decks,
  allRuns,
  dailyGoal,
  onUpdateDailyGoal,
  onSelectDeck,
  onAddDeck,
  onImportDeck,
  onImportApkg,
  onRestored,
  onViewGlobalStats,
}: DeckListProps) {
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<Set<string>>(new Set());
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(String(dailyGoal));
  const [now] = useState(() => new Date());
  const [backupOpen, setBackupOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [apkgOpen, setApkgOpen] = useState(false);

  const streak = useMemo(() => computeStreak(allRuns, now), [allRuns, now]);
  const todayCount = useMemo(() => todayCards(allRuns, now), [allRuns, now]);

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

  function handleGoalSave() {
    const val = parseInt(goalInput) || 0;
    onUpdateDailyGoal(Math.max(0, val));
    setEditingGoal(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-medium text-foreground">Your Decks</h1>
        <div className="flex items-center gap-2">
          {allRuns.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onViewGlobalStats}>
              Stats
            </Button>
          )}
          <DeckForm
            trigger={<Button size="sm">New Deck</Button>}
            onSubmit={(title, tags, color, emoji) => onAddDeck(title, tags, color, emoji)}
          />
          {/* "..." menu for secondary actions */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="More options">
                <HugeiconsIcon icon={MoreVerticalIcon} size={16} strokeWidth={2} />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content className={MENU_CONTENT_CLASS} align="end" sideOffset={4}>
                <DropdownMenu.Item
                  className={ITEM_CLASS}
                  onSelect={() => setImportOpen(true)}
                >
                  Import Deck (JSON)
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className={ITEM_CLASS}
                  onSelect={() => setApkgOpen(true)}
                >
                  Import Anki Deck (.apkg)
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className={ITEM_CLASS}
                  onSelect={() => setBackupOpen(true)}
                >
                  Backup &amp; Restore
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>

      {/* Controlled dialogs from overflow menu */}
      <ImportDeckDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={onImportDeck}
      />
      <ImportApkgDialog
        open={apkgOpen}
        onOpenChange={setApkgOpen}
        onImport={onImportApkg}
      />
      <BackupDialog
        open={backupOpen}
        onOpenChange={setBackupOpen}
        onRestored={onRestored}
      />

      {/* Streak + daily goal + heatmap */}
      {allRuns.length > 0 && (
        <Card size="sm">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Streak:</span>
                <span className="font-mono font-medium text-foreground">
                  {streak} {streak === 1 ? "day" : "days"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Today:</span>
                <span className={cn(
                  "font-mono font-medium",
                  dailyGoal > 0 && todayCount >= dailyGoal
                    ? "text-green-600 dark:text-green-400"
                    : "text-foreground"
                )}>
                  {todayCount}
                </span>
                {dailyGoal > 0 && (
                  <>
                    <span className="text-muted-foreground">/</span>
                    {editingGoal ? (
                      <span className="flex items-center gap-1">
                        <input
                          type="number"
                          value={goalInput}
                          onChange={(e) => setGoalInput(e.target.value)}
                          onBlur={handleGoalSave}
                          onKeyDown={(e) => e.key === "Enter" && handleGoalSave()}
                          className="w-14 rounded border bg-transparent px-1.5 py-0.5 text-center font-mono text-sm"
                          autoFocus
                        />
                        <span className="text-muted-foreground">cards</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setGoalInput(String(dailyGoal));
                          setEditingGoal(true);
                        }}
                        className="inline-flex items-center gap-1 rounded border border-dashed border-muted-foreground/30 px-1.5 py-0.5 font-mono font-medium text-foreground transition-colors hover:border-foreground/50 hover:bg-muted/50"
                        title="Click to edit daily goal"
                      >
                        {dailyGoal} cards
                        <span className="text-[10px] text-muted-foreground">&#9998;</span>
                      </button>
                    )}
                  </>
                )}
              </div>
              {dailyGoal > 0 && (
                <div className="flex-1 min-w-20">
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-green-500 transition-all"
                      style={{ width: `${Math.min(100, (todayCount / dailyGoal) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          <div className="px-6 pb-4">
            <StudyHeatmap runs={allRuns} />
          </div>
        </Card>
      )}

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
              <Card className="h-full transition-colors hover:bg-muted/50 cursor-pointer overflow-hidden" size="sm">
                {deck.color && (
                  <div
                    className="flex h-24 items-center justify-center text-4xl"
                    style={{ backgroundColor: deck.color }}
                  >
                    {deck.emoji ?? null}
                  </div>
                )}
                {!deck.color && deck.emoji && (
                  <div className="pt-3 text-center text-3xl leading-none">{deck.emoji}</div>
                )}
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
