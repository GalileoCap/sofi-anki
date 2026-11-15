import { DropdownMenu } from "radix-ui";
import { type ReactNode, useState } from "react";

import { CardForm } from "@/components/card-form";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DeckForm } from "@/components/deck-form";
import { EmptyState, NoMatch } from "@/components/empty-state";
import { Fold } from "@/components/fold";
import { ExportDialog } from "@/components/export-dialog";
import { ImportCardsDialog } from "@/components/import-dialog";
import { DeckRow, Key, Segmented, Toggle } from "@/components/sticker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/language-context";
import { cardFromJson } from "@/core/deck-json";
import {
  type CardDraft,
  addCards,
  allTags,
  cardFromDraft,
  matchingCards,
  removeCard,
  removeDeck,
  replaceCard,
  restyleDeck,
  toggled,
} from "@/core/decks";
import { type Complexity, type Deck, type Millis, type RunMode, type SessionGoal, type Store, complexities, runModes } from "@/core/model";
import type { RunChoice } from "@/core/run";
import { deckSchedules, dueCards, indexSchedules, newCards, weakCards, withoutDeck } from "@/core/scheduler";
import { shareUrl } from "@/core/share";
import { cardPerformance, studyOrder } from "@/core/stats";
import { newId, now as clockNow } from "@/effects/clock";
import { copyText, download } from "@/effects/files";
import { pageBase } from "@/effects/page";
import { useKeys } from "@/hooks/use-keys";
import type { TranslationKey } from "@/lib/translations";
import { looks } from "@/lib/ui-looks";
import { cn } from "@/lib/utils";
import { CardList } from "@/pages/deck-card-list";
import { RunStartDialog } from "@/pages/run-start-dialog";

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

/** How long a line saying what the share did stays. */
const NOTICE_MS = 4000;

const filterWords: Record<RunMode, TranslationKey> = { all: "deck.filterAll", due: "common.due", weak: "common.weak", new: "common.new" };

/** One deck: studying it, adding to it, its cards as a table, and one menu for what is done now and then. */
export function DeckPage({ deck, store, update, now, onBack, onStudy, onStats }: DeckPageProps) {
  const { t, tp } = useLanguage();
  const schedules = indexSchedules(store.schedules);
  const performance = cardPerformance(deck, store.runs, deckSchedules(schedules, deck.id));
  const byMode = { all: deck.cards, due: dueCards(deck, schedules, now), weak: weakCards(deck, schedules), new: newCards(deck, store.runs) };
  const hasRuns = store.runs.some((run) => run.deckId === deck.id);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<RunMode>("all");
  const [difficulties, setDifficulties] = useState<ReadonlySet<Complexity>>(new Set());
  const [tags, setTags] = useState<ReadonlySet<string>>(new Set());
  const [opened, setOpened] = useState<ReadonlySet<string>>(new Set());
  const [dialog, setDialog] = useState<"import" | "export" | "choose" | "delete" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const kept = new Set(byMode[filter].map((card) => card.id));
  const shown = studyOrder(
    matchingCards(deck.cards, { search, complexities: difficulties, tags }).filter((card) => kept.has(card.id)),
    performance,
    now,
  );
  const deckTags = allTags(deck.cards);
  const allOpen = shown.length > 0 && shown.every((card) => opened.has(card.id));
  const change = (decks: (decks: readonly Deck[]) => readonly Deck[]) => update((s) => ({ ...s, decks: decks(s.decks) }));
  const draftCard = (draft: CardDraft, id: string) => cardFromDraft(draft, id, newId);
  const studyNow = () => onStudy({ mode: byMode.due.length > 0 ? "due" : "all", complexities: null }, undefined, false);

  function say(key: TranslationKey) {
    setNotice(t(key));
    setTimeout(() => setNotice(null), NOTICE_MS);
  }

  async function share() {
    const url = shareUrl(pageBase(), deck);
    if (url === null) return say("deck.shareTooLarge");
    say((await copyText(url)).isOk() ? "deck.shareCopied" : "common.copyRefused");
  }

  async function exportApkg() {
    const { writeApkg } = await import("@/effects/anki-file");
    await writeApkg(deck, schedules, clockNow()).map((bytes) => download(`${deck.title}.apkg`, bytes, "application/zip"));
  }

  function deleteDeck() {
    update((s) => ({
      ...s,
      decks: removeDeck(s.decks, deck.id),
      runs: s.runs.filter((run) => run.deckId !== deck.id),
      schedules: [...withoutDeck(indexSchedules(s.schedules), deck.id).values()],
    }));
    onBack();
  }

  const addCard = (trigger: ReactNode) => (
    <CardForm deck={deck} trigger={trigger} onSubmit={(draft) => change((d) => addCards(d, deck.id, [draftCard(draft, newId())]))} />
  );

  useKeys((event) => {
    if (dialog === null && event.key === "s" && deck.cards.length > 0) studyNow();
  });

  const item = (label: string, onSelect: () => void, className?: string) => (
    <DropdownMenu.Item className={cn(looks.menuItem, className)} onSelect={onSelect}>
      {label}
    </DropdownMenu.Item>
  );

  const meta = [`${deck.cards.length} ${tp(deck.cards.length, "common.card", "common.cards")}`, deck.tags.join(", ")].filter(Boolean).join(", ");

  return (
    <div className="grid gap-x-10 gap-y-4 lg:grid-cols-[19rem_minmax(0,1fr)]">
      <div className={cn(looks.form, "lg:self-start")}>
        <div className={looks.topbar}>
          <Button variant="ghost" onClick={onBack}>
            {t("deck.back")}
          </Button>
          {hasRuns && (
            <Button variant="ghost" onClick={onStats}>
              {t("common.stats")}
            </Button>
          )}
        </div>
        <DeckRow deck={deck} meta={meta} head />
        <Button size="lg" className="w-full" onClick={studyNow} disabled={deck.cards.length === 0}>
          {byMode.due.length > 0
            ? t("deck.studyDue").replace("{n}", String(byMode.due.length))
            : t("deck.studyAll").replace("{n}", String(deck.cards.length))}
          <Key>S</Key>
        </Button>
        <div className={cn(looks.buttons, "flex-wrap")}>
          {addCard(
            <Button variant="outline" className="grow">
              {t("deck.addCard")}
            </Button>,
          )}
          <Button variant="outline" className="grow" onClick={() => setDialog("choose")}>
            {t("deck.chooseCards")}
          </Button>
          <Button variant="outline" className="grow" onClick={share}>
            {t("deck.shareLink")}
          </Button>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <Button variant="outline">{t("home.more")}</Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content className={looks.menu} align="end" sideOffset={4}>
                {item(t("deck.exportFile"), () => setDialog("export"))}
                {item(t("deck.exportAnki"), exportApkg)}
                {item(t("deck.bringIn"), () => setDialog("import"))}
                <DeckForm
                  trigger={
                    <DropdownMenu.Item className={looks.menuItem} onSelect={(e) => e.preventDefault()}>
                      {t("deck.editCover")}
                    </DropdownMenu.Item>
                  }
                  onSubmit={(title, tags, color, emoji) => change((d) => restyleDeck(d, deck.id, { title, tags, color, emoji }))}
                  initialTitle={deck.title}
                  initialTags={deck.tags}
                  initialColor={deck.color}
                  initialEmoji={deck.emoji}
                  dialogTitle={t("deck.editCover")}
                  submitLabel={t("common.save")}
                />
                <DropdownMenu.Separator className={looks.menuRule} />
                {item(t("deck.delete"), () => setDialog("delete"), looks.menuDanger)}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
        {notice !== null && (
          <p role="status" className={looks.muted}>
            {notice}
          </p>
        )}
      </div>

      <div className={looks.stack}>
        {deck.cards.length > 0 && (
          <div className={looks.filters}>
            <Input placeholder={t("deckDetail.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} className="sm:flex-1" />
            <Segmented label={t("deck.filter")} options={runModes.map((mode) => ({ value: mode, label: t(filterWords[mode]) }))} value={filter} onChange={setFilter} />
          </div>
        )}
        {deck.cards.length > 0 && (
          <div className="flex items-start justify-between gap-2">
            <Fold
              className="min-w-0 flex-1"
              open={difficulties.size + tags.size > 0}
              summary={
                <span className={looks.muted}>
                  {t("deck.moreFilters")}
                  {difficulties.size + tags.size > 0 && ` (${t("deck.filtersOn").replace("{n}", String(difficulties.size + tags.size))})`}
                </span>
              }
            >
              <div className={cn(looks.stack, "pt-1 pb-2")}>
                <div role="group" aria-label={t("cardForm.difficulty")} className={looks.chips}>
                  {complexities.map((c) => (
                    <Toggle key={c} pressed={difficulties.has(c)} onClick={() => setDifficulties(toggled(difficulties, c))}>
                      {t(`complexity.${c}`)}
                    </Toggle>
                  ))}
                </div>
                {deckTags.length > 0 && (
                  <div role="group" aria-label={t("common.tags")} className={looks.chips}>
                    {deckTags.map((tag) => (
                      <Toggle key={tag} pressed={tags.has(tag)} onClick={() => setTags(toggled(tags, tag))}>
                        {tag}
                      </Toggle>
                    ))}
                  </div>
                )}
                {(difficulties.size > 0 || tags.size > 0) && (
                  <Button
                    variant="ghost"
                    className="-ml-3 self-start"
                    onClick={() => {
                      setDifficulties(new Set());
                      setTags(new Set());
                    }}
                  >
                    {t("deck.clearFilters")}
                  </Button>
                )}
              </div>
            </Fold>
            {shown.length > 0 && (
              <Button variant="ghost" className="shrink-0" onClick={() => setOpened(allOpen ? new Set() : new Set(shown.map((card) => card.id)))}>
                {allOpen ? t("deck.foldAll") : t("deck.openAll")}
              </Button>
            )}
          </div>
        )}
        {deck.cards.length === 0 ? (
          <EmptyState message={t("deckDetail.noCards")} hint={t("deckDetail.noCardsHint")} />
        ) : shown.length === 0 ? (
          <NoMatch message={t("deckDetail.noMatch")} />
        ) : (
          <CardList
            deck={deck}
            cards={shown}
            performance={performance}
            now={now}
            opened={opened}
            onToggle={(id) => setOpened(toggled(opened, id))}
            onEdit={(id, draft) => change((d) => replaceCard(d, deck.id, draftCard(draft, id)))}
            onDelete={(id) => change((d) => removeCard(d, deck.id, id))}
          />
        )}
      </div>

      <RunStartDialog
        open={dialog === "choose"}
        onOpenChange={(open) => setDialog(open ? "choose" : null)}
        cards={byMode}
        onStart={(mode, difficulties, goal, shuffle) => onStudy({ mode, complexities: difficulties }, goal, shuffle)}
      />
      <ImportCardsDialog
        open={dialog === "import"}
        onOpenChange={(open) => setDialog(open ? "import" : null)}
        onImport={(cards) => change((d) => addCards(d, deck.id, cards.map((card) => cardFromJson(card, newId))))}
      />
      <ExportDialog open={dialog === "export"} onOpenChange={(open) => setDialog(open ? "export" : null)} deck={deck} />
      <ConfirmDialog
        open={dialog === "delete"}
        onOpenChange={(open) => setDialog(open ? "delete" : null)}
        title={t("deck.deleteTitle").replace("{title}", deck.title)}
        body={t("deck.deleteBody")}
        confirm={t("deck.delete")}
        onConfirm={deleteDeck}
      />
    </div>
  );
}
