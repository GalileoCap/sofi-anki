import { DropdownMenu } from "radix-ui";
import { type ReactNode, useState } from "react";

import { CardForm } from "@/components/card-form";
import { DeckForm } from "@/components/deck-form";
import { ExportDialog } from "@/components/export-dialog";
import { ImportCardsDialog } from "@/components/import-dialog";
import { OverflowMenu } from "@/components/overflow-menu";
import { RunStartDialog } from "@/pages/run-start-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent, Card as UiCard } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/language-context";
import { cardFromJson } from "@/core/deck-json";
import {
  type CardDraft,
  addCards,
  allTags,
  cardFromDraft,
  complexityCounts,
  matchingCards,
  removeCard,
  removeDeck,
  replaceCard,
  restyleDeck,
} from "@/core/decks";
import { type Complexity, type Deck, type Millis, type RunMode, type SessionGoal, type Store, complexities } from "@/core/model";
import type { RunChoice } from "@/core/run";
import { deckSchedules, dueCards, indexSchedules, newCards, weakCards, withoutDeck } from "@/core/scheduler";
import { shareUrl } from "@/core/share";
import { cardPerformance, studyOrder } from "@/core/stats";
import { newId, now as clockNow } from "@/effects/clock";
import { copyText, download } from "@/effects/files";
import { pageBase } from "@/effects/page";
import { looks } from "@/lib/looks";
import { cn } from "@/lib/utils";
import { CardList } from "@/pages/deck-card-list";

type DeckPageProps = {
  deck: Deck;
  store: Store;
  update: (change: (store: Store) => Store) => void;
  /** When the screen opened, which due cards count from. */
  now: Millis;
  onBack: () => void;
  onStudy: (choice: RunChoice, goal: SessionGoal | undefined, shuffle: boolean) => void;
  onStats: () => void;
};

const toggled = <T,>(set: ReadonlySet<T>, item: T): Set<T> => {
  const next = new Set(set);
  if (!next.delete(item)) next.add(item);
  return next;
};

const chip = "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all";
const chipState = (on: boolean) =>
  on ? "border-foreground/20 bg-foreground/5 text-foreground" : "border-transparent text-muted-foreground hover:bg-muted";

/** One deck: how to study it, its cards, and what can be done with it. */
export function DeckPage({ deck, store, update, now, onBack, onStudy, onStats }: DeckPageProps) {
  const { t, tp } = useLanguage();
  const schedules = indexSchedules(store.schedules);
  const performance = cardPerformance(deck, store.runs, deckSchedules(schedules, deck.id));
  const counts = { due: dueCards(deck, schedules, now).length, weak: weakCards(deck, schedules).length, new: newCards(deck, store.runs).length };
  const hasRuns = store.runs.some((run) => run.deckId === deck.id);

  const [search, setSearch] = useState("");
  const [complexityFilter, setComplexityFilter] = useState<ReadonlySet<Complexity>>(new Set());
  const [tagFilter, setTagFilter] = useState<ReadonlySet<string>>(new Set());
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [startDialog, setStartDialog] = useState<{ mode: RunMode; label: string } | "pick" | null>(null);
  const [dialog, setDialog] = useState<"import" | "export" | null>(null);
  const [exporting, setExporting] = useState(false);

  const shown = studyOrder(matchingCards(deck.cards, { search, complexities: complexityFilter, tags: tagFilter }), performance, now);
  const cardCounts = complexityCounts(deck.cards);
  const allShownOpen = shown.every((card) => expanded.has(card.id));
  const chosenComplexities = complexityFilter.size > 0 ? [...complexityFilter] : null;

  const change = (decks: (decks: readonly Deck[]) => readonly Deck[]) => update((s) => ({ ...s, decks: decks(s.decks) }));
  const draftCard = (draft: CardDraft, id: string) => cardFromDraft(draft, id, newId);

  function deleteDeck() {
    update((s) => ({
      ...s,
      decks: removeDeck(s.decks, deck.id),
      runs: s.runs.filter((run) => run.deckId !== deck.id),
      schedules: [...withoutDeck(indexSchedules(s.schedules), deck.id).values()],
    }));
    onBack();
  }

  async function exportApkg() {
    setExporting(true);
    const { writeApkg } = await import("@/effects/anki-file");
    await writeApkg(deck, schedules, clockNow()).map((bytes) => download(`${deck.title}.apkg`, bytes, "application/zip"));
    setExporting(false);
  }

  const start = (mode: RunMode, goal: SessionGoal | undefined, shuffle: boolean) => onStudy({ mode, complexities: chosenComplexities }, goal, shuffle);

  const editDeck = (trigger: ReactNode) => (
    <DeckForm
      trigger={trigger}
      onSubmit={(title, tags, color, emoji) => change((d) => restyleDeck(d, deck.id, { title, tags, color, emoji }))}
      initialTitle={deck.title}
      initialTags={deck.tags}
      initialColor={deck.color}
      initialEmoji={deck.emoji}
      dialogTitle={t("deckDetail.editDeck")}
      submitLabel={t("common.save")}
    />
  );

  const modeButton = (mode: Exclude<RunMode, "all">, label: string, title: string) => (
    <Button variant="secondary" onClick={() => setStartDialog({ mode, label: title })} disabled={counts[mode] === 0}>
      {label}
      <Badge variant="outline" className="ml-1 text-xs">
        {counts[mode]}
      </Badge>
    </Button>
  );

  const importCards = (
    <ImportCardsDialog
      open={dialog === "import"}
      onOpenChange={(open) => setDialog(open ? "import" : null)}
      onImport={(cards) => change((d) => addCards(d, deck.id, cards.map((card) => cardFromJson(card, newId))))}
    />
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            {t("common.back")}
          </Button>
          {deck.emoji && <span className="shrink-0 text-2xl leading-none">{deck.emoji}</span>}
          <h1 className={cn(looks.title, "truncate")}>{deck.title}</h1>
          <div className="hidden shrink-0 sm:block">
            {editDeck(
              <Button variant="ghost" size="xs">
                {t("common.edit")}
              </Button>,
            )}
          </div>
        </div>
        <Badge variant="secondary" className="shrink-0 text-sm">
          {deck.cards.length} {tp(deck.cards.length, "common.card", "common.cards")}
        </Badge>
      </div>

      <UiCard size="sm">
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm font-medium text-foreground">{t("deckDetail.study")}</p>
          <Button className="w-full sm:hidden" onClick={() => setStartDialog("pick")} disabled={deck.cards.length === 0}>
            {t("common.start")}
          </Button>
          <div className="hidden flex-wrap gap-2 sm:flex">
            <Button onClick={() => setStartDialog({ mode: "all", label: t("runStart.allCards") })} disabled={shown.length === 0}>
              {t("deckDetail.allCards")} ({chosenComplexities ? shown.length : deck.cards.length})
            </Button>
            {modeButton("due", t("common.due"), t("deckDetail.dueCards"))}
            {modeButton("weak", t("common.weak"), t("deckDetail.weakCards"))}
            {modeButton("new", t("common.new"), t("common.new"))}
            <Button variant="outline" onClick={onStats} disabled={!hasRuns}>
              {t("common.stats")}
            </Button>
          </div>
          {hasRuns && (
            <Button variant="ghost" size="sm" className="-mt-2 -ml-2 self-start text-muted-foreground sm:hidden" onClick={onStats}>
              {t("deckDetail.viewStats")}
            </Button>
          )}
        </CardContent>
      </UiCard>

      <RunStartDialog
        open={startDialog === "pick"}
        onOpenChange={(open) => setStartDialog(open ? "pick" : null)}
        mode={null}
        counts={counts}
        onStart={start}
      />
      <RunStartDialog
        open={startDialog !== null && startDialog !== "pick"}
        onOpenChange={(open) => !open && setStartDialog(null)}
        mode={startDialog !== null && startDialog !== "pick" ? startDialog : { mode: "all", label: "" }}
        counts={counts}
        onStart={start}
      />

      <div className="flex flex-wrap items-center gap-2">
        <CardForm
          trigger={
            <Button variant="outline" size="sm">
              {t("deckDetail.addCard")}
            </Button>
          }
          onSubmit={(draft) => change((d) => addCards(d, deck.id, [draftCard(draft, newId())]))}
        />
        <div className="hidden items-center gap-2 sm:flex">
          <Button variant="outline" size="sm" onClick={() => setDialog("import")}>
            {t("deckDetail.importCards")}
          </Button>
          <ExportDialog
            trigger={
              <Button variant="outline" size="sm">
                {t("deckDetail.exportJson")}
              </Button>
            }
            deck={deck}
          />
          <Button variant="outline" size="sm" disabled={exporting} onClick={exportApkg}>
            {exporting ? t("deckDetail.exporting") : t("deckDetail.exportAnki")}
          </Button>
          <ShareLinkButton deck={deck} />
        </div>
        <div className="sm:hidden">
          <OverflowMenu size="icon-xs">
            {editDeck(
              <DropdownMenu.Item className={looks.menuItem} onSelect={(e) => e.preventDefault()}>
                {t("deckDetail.editDeck")}
              </DropdownMenu.Item>,
            )}
            <DropdownMenu.Item className={looks.menuItem} onSelect={() => setDialog("import")}>
              {t("deckDetail.importCards")}
            </DropdownMenu.Item>
            <DropdownMenu.Item className={looks.menuItem} onSelect={() => setDialog("export")}>
              {t("deckDetail.shareExport")}
            </DropdownMenu.Item>
            <DropdownMenu.Item className={looks.menuItem} onSelect={exportApkg}>
              {t("deckDetail.exportApkg")}
            </DropdownMenu.Item>
          </OverflowMenu>
        </div>
        {importCards}
        <ExportDialog open={dialog === "export"} onOpenChange={(open) => setDialog(open ? "export" : null)} deck={deck} includeShareUrl />

        <div className="flex-1" />
        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <Button variant="destructive" size="sm" onClick={deleteDeck}>
              {t("common.confirm")}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
              {t("common.cancel")}
            </Button>
          </div>
        ) : (
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setConfirmDelete(true)}>
            {t("deckDetail.deleteDeck")}
          </Button>
        )}
      </div>

      <Separator />

      {deck.cards.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <Input
            placeholder={t("deckDetail.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <div className="flex flex-wrap items-center gap-1.5">
            {complexities.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setComplexityFilter(toggled(complexityFilter, c))}
                className={cn(chip, chipState(complexityFilter.has(c)))}
              >
                {t(`complexity.${c}`)}
                <span className="font-mono text-muted-foreground">{cardCounts[c]}</span>
              </button>
            ))}
            {allTags(deck.cards).map((tag) => (
              <button key={tag} type="button" onClick={() => setTagFilter(toggled(tagFilter, tag))} className={cn(chip, chipState(tagFilter.has(tag)))}>
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
                {t("common.clear")}
              </Button>
            )}
          </div>
          <Button variant="ghost" size="xs" onClick={() => setExpanded(allShownOpen ? new Set() : new Set(shown.map((card) => card.id)))}>
            {allShownOpen ? t("deckDetail.collapseAll") : t("deckDetail.expandAll")}
          </Button>
        </div>
      )}

      {deck.cards.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-lg text-muted-foreground">{t("deckDetail.noCards")}</p>
          <p className={looks.muted}>{t("deckDetail.noCardsHint")}</p>
        </div>
      ) : shown.length === 0 ? (
        <p className={cn(looks.muted, "py-8 text-center")}>{t("deckDetail.noMatch")}</p>
      ) : (
        <CardList
          cards={shown}
          performance={performance}
          now={now}
          expanded={expanded}
          onToggle={(id) => setExpanded(toggled(expanded, id))}
          onEdit={(id, draft) => change((d) => replaceCard(d, deck.id, draftCard(draft, id)))}
          onDelete={(id) => change((d) => removeCard(d, deck.id, id))}
        />
      )}
    </div>
  );
}

type ShareState = "idle" | "copying" | "copied" | "tooLarge";

/** Copies a link that carries the deck and all its cards, or says the deck is too large for one. */
function ShareLinkButton({ deck }: { deck: Deck }) {
  const { t } = useLanguage();
  const [state, setState] = useState<ShareState>("idle");

  async function share() {
    const url = shareUrl(pageBase(), deck);
    if (url === null) {
      setState("tooLarge");
      setTimeout(() => setState("idle"), 3000);
      return;
    }
    setState("copying");
    const copied = await copyText(url);
    setState(copied.isOk() ? "copied" : "idle");
    if (copied.isOk()) setTimeout(() => setState("idle"), 2000);
  }

  const label = { idle: "deckDetail.shareLink", copying: "deckDetail.shareLink", copied: "deckDetail.shareLinkCopied", tooLarge: "deckDetail.shareLinkTooLarge" } as const;
  return (
    <Button variant="outline" size="sm" disabled={state === "copying"} onClick={share}>
      {t(label[state])}
    </Button>
  );
}
