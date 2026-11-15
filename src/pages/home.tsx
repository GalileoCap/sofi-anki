import { DropdownMenu } from "radix-ui";
import { useState } from "react";

import { BackupDialog } from "@/components/backup-dialog";
import { DeckForm } from "@/components/deck-form";
import { EmptyState, NoMatch } from "@/components/empty-state";
import { ImportApkgDialog } from "@/components/import-apkg-dialog";
import { GoalBar } from "@/components/goal-bar";
import { ImportDeckDialog } from "@/components/import-dialog";
import { OverflowMenu } from "@/components/overflow-menu";
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
import { chipState, looks } from "@/lib/ui-looks";
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
    <div className={looks.sections}>
      <div className="flex items-center justify-between gap-2">
        <h1 className={looks.title}>{t("deckList.title")}</h1>
        <div className={looks.row}>
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
          <OverflowMenu size="icon-sm">
            <DropdownMenu.Item className={looks.menuItem} onSelect={() => setDialog("json")}>
              {t("deckList.importJson")}
            </DropdownMenu.Item>
            <DropdownMenu.Item className={looks.menuItem} onSelect={() => setDialog("apkg")}>
              {t("deckList.importApkg")}
            </DropdownMenu.Item>
            <DropdownMenu.Item className={looks.menuItem} onSelect={() => setDialog("backup")}>
              {t("deckList.backupRestore")}
            </DropdownMenu.Item>
          </OverflowMenu>
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
        <div className={looks.filters}>
          <Input
            placeholder={t("deckList.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          {tags.length > 0 && (
            <div className={looks.chips}>
              {tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={cn(looks.chip, chipState(tagFilter.has(tag)))}
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
        <EmptyState message={t("deckList.noDecks")} hint={t("deckList.noDecksHint")} />
      ) : shown.length === 0 ? (
        <NoMatch message={t("deckList.noMatch")} />
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
          <div className="flex h-24 items-center justify-center text-emoji" style={{ backgroundColor: deck.color }}>
            {deck.emoji}
          </div>
        ) : (
          deck.emoji && <div className="pt-3 text-center text-emoji">{deck.emoji}</div>
        )}
        <CardHeader>
          <CardTitle>{deck.title}</CardTitle>
          <CardDescription className={looks.chips}>
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
          <div className={looks.pair}>
            <span className="text-muted-foreground">{t("deckList.streak")}</span>
            <span className="font-mono font-medium text-foreground">
              {days} {tp(days, "common.day", "common.days")}
            </span>
          </div>
          <div className={looks.pair}>
            <span className="text-muted-foreground">{t("deckList.today")}</span>
            <span
              className={cn(looks.value, goal > 0 && today >= goal ? looks.positive : "text-foreground")}
            >
              {today}
            </span>
            {goal > 0 && (
              <>
                <span className="text-muted-foreground">/</span>
                {goalInput !== null ? (
                  <span className={looks.tightRow}>
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
                    <span className={looks.fine}>&#9998;</span>
                  </button>
                )}
              </>
            )}
          </div>
          {goal > 0 && (
            <div className="min-w-20 flex-1">
              <GoalBar share={today / goal} />
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
