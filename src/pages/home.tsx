import { MoreVerticalIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { DropdownMenu } from "radix-ui";
import { useState } from "react";

import { BackupDialog } from "@/components/backup-dialog";
import { DeckForm } from "@/components/deck-form";
import { ImportApkgDialog } from "@/components/import-apkg-dialog";
import { ImportDeckDialog } from "@/components/import-dialog";
import { StudyHeatmap } from "@/components/study-heatmap";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/language-context";
import { deckFromJson } from "@/core/deck-json";
import { addDeck, allTags, matchingDecks, newDeck, receiveAnkiDecks } from "@/core/decks";
import type { Deck, Millis, RunRecord, Store } from "@/core/model";
import { cardsToday, streak } from "@/core/stats";
import { newId, now as clockNow } from "@/effects/clock";
import { looks } from "@/lib/looks";
import { cn } from "@/lib/utils";

type Change = (change: (store: Store) => Store) => void;

const withDecks = (change: (decks: readonly Deck[]) => readonly Deck[]) => (store: Store): Store => ({
  ...store,
  decks: change(store.decks),
});

type HomeProps = {
  store: Store;
  update: Change;
  /** When the screen opened, which today and the streak count from. */
  now: Millis;
  onOpenDeck: (id: string) => void;
  onOpenStats: () => void;
};

/** The decks, the study streak and today's count against the daily goal. */
export function Home({ store, update, now, onOpenDeck, onOpenStats }: HomeProps) {
  const { t } = useLanguage();
  const { decks, runs } = store;
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<ReadonlySet<string>>(new Set());
  const [dialog, setDialog] = useState<"json" | "apkg" | "backup" | null>(null);
  const tags = allTags(decks);
  const shown = matchingDecks(decks, search, tagFilter);

  function toggleTag(tag: string) {
    const next = new Set(tagFilter);
    if (!next.delete(tag)) next.add(tag);
    setTagFilter(next);
  }

  const dialogProps = (name: typeof dialog) => ({
    open: dialog === name,
    onOpenChange: (open: boolean) => setDialog(open ? name : null),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className={looks.title}>{t("deckList.title")}</h1>
        <div className="flex items-center gap-2">
          {runs.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onOpenStats}>
              {t("common.stats")}
            </Button>
          )}
          <DeckForm
            trigger={<Button size="sm">{t("deckList.newDeck")}</Button>}
            onSubmit={(title, tags, color, emoji) =>
              update(withDecks((d) => addDeck(d, newDeck(newId(), { title, tags, color, emoji }, clockNow()))))
            }
          />
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={t("deckList.moreOptions")}>
                <HugeiconsIcon icon={MoreVerticalIcon} size={16} strokeWidth={2} />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content className={looks.menu} align="end" sideOffset={4}>
                <DropdownMenu.Item className={looks.menuItem} onSelect={() => setDialog("json")}>
                  {t("deckList.importJson")}
                </DropdownMenu.Item>
                <DropdownMenu.Item className={looks.menuItem} onSelect={() => setDialog("apkg")}>
                  {t("deckList.importApkg")}
                </DropdownMenu.Item>
                <DropdownMenu.Item className={looks.menuItem} onSelect={() => setDialog("backup")}>
                  {t("deckList.backupRestore")}
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>

      <ImportDeckDialog
        {...dialogProps("json")}
        onImport={(data) => update(withDecks((d) => addDeck(d, deckFromJson(data, clockNow(), newId))))}
      />
      <ImportApkgDialog
        {...dialogProps("apkg")}
        onImport={(parsed) => update((s) => receiveAnkiDecks(s, parsed.decks, parsed.schedules))}
      />
      <BackupDialog {...dialogProps("backup")} store={store} onRestore={(restored) => update(() => restored)} />

      {runs.length > 0 && (
        <TodayCard
          runs={runs}
          now={now}
          goal={store.settings.dailyCardGoal}
          onGoal={(goal) => update((s) => ({ ...s, settings: { ...s.settings, dailyCardGoal: goal } }))}
        />
      )}

      {decks.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <Input
            placeholder={t("deckList.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          {tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-medium transition-all",
                    tagFilter.has(tag)
                      ? "border-foreground/20 bg-foreground/5 text-foreground"
                      : "border-transparent text-muted-foreground hover:bg-muted",
                  )}
                >
                  {tag}
                </button>
              ))}
              {tagFilter.size > 0 && (
                <Button variant="ghost" size="xs" onClick={() => setTagFilter(new Set())}>
                  {t("common.clear")}
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {decks.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-muted-foreground">{t("deckList.noDecks")}</p>
          <p className={looks.muted}>{t("deckList.noDecksHint")}</p>
        </div>
      ) : shown.length === 0 ? (
        <p className={cn(looks.muted, "py-8 text-center")}>{t("deckList.noMatch")}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((deck) => (
            <DeckTile key={deck.id} deck={deck} onOpen={() => onOpenDeck(deck.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

/** A deck in the grid: its color band or emoji, title, card count and tags. */
function DeckTile({ deck, onOpen }: { deck: Deck; onOpen: () => void }) {
  const { tp } = useLanguage();
  return (
    <button type="button" onClick={onOpen} className="text-left">
      <Card className="h-full cursor-pointer overflow-hidden transition-colors hover:bg-muted/50" size="sm">
        {deck.color ? (
          <div className="flex h-24 items-center justify-center text-4xl" style={{ backgroundColor: deck.color }}>
            {deck.emoji}
          </div>
        ) : (
          deck.emoji && <div className="pt-3 text-center text-3xl leading-none">{deck.emoji}</div>
        )}
        <CardHeader>
          <CardTitle>{deck.title}</CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary">
              {deck.cards.length} {tp(deck.cards.length, "common.card", "common.cards")}
            </Badge>
            {deck.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </CardDescription>
        </CardHeader>
      </Card>
    </button>
  );
}

type TodayCardProps = {
  runs: readonly RunRecord[];
  now: Millis;
  goal: number;
  onGoal: (goal: number) => void;
};

/** The streak, today's cards against the daily goal, which edits in place, and the heatmap. */
function TodayCard({ runs, now, goal, onGoal }: TodayCardProps) {
  const { t, tp } = useLanguage();
  const [goalInput, setGoalInput] = useState<string | null>(null);
  const days = streak(runs, now);
  const today = cardsToday(runs, now);

  /** A goal that does not read as a whole number leaves the goal as it was. */
  function saveGoal() {
    const next = Number.parseInt(goalInput ?? "", 10);
    if (Number.isFinite(next)) onGoal(Math.max(0, next));
    setGoalInput(null);
  }

  return (
    <Card size="sm">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">{t("deckList.streak")}</span>
            <span className="font-mono font-medium text-foreground">
              {days} {tp(days, "common.day", "common.days")}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">{t("deckList.today")}</span>
            <span
              className={cn(
                "font-mono font-medium",
                goal > 0 && today >= goal ? "text-green-600 dark:text-green-400" : "text-foreground",
              )}
            >
              {today}
            </span>
            {goal > 0 && (
              <>
                <span className="text-muted-foreground">/</span>
                {goalInput !== null ? (
                  <span className="flex items-center gap-1">
                    <input
                      type="number"
                      value={goalInput}
                      onChange={(e) => setGoalInput(e.target.value)}
                      onBlur={saveGoal}
                      onKeyDown={(e) => e.key === "Enter" && saveGoal()}
                      className="w-14 rounded border bg-transparent px-1.5 py-0.5 text-center font-mono text-sm"
                      autoFocus
                    />
                    <span className="text-muted-foreground">{t("common.cards")}</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setGoalInput(String(goal))}
                    className="inline-flex items-center gap-1 rounded border border-dashed border-muted-foreground/30 px-1.5 py-0.5 font-mono font-medium text-foreground transition-colors hover:border-foreground/50 hover:bg-muted/50"
                    title={t("deckList.editGoal")}
                  >
                    {goal} {t("common.cards")}
                    <span className="text-[10px] text-muted-foreground">&#9998;</span>
                  </button>
                )}
              </>
            )}
          </div>
          {goal > 0 && (
            <div className="min-w-20 flex-1">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-green-500 transition-all"
                  style={{ width: `${Math.min(100, (today / goal) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <div className="px-6 pb-4">
        <StudyHeatmap runs={runs} now={now} />
      </div>
    </Card>
  );
}
