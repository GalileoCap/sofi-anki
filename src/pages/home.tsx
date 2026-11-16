import { ChartColumnIcon, GridViewIcon, ListViewIcon, MoreHorizontalIcon, PlusSignIcon, Tick02Icon } from "@hugeicons/core-free-icons";
import { DropdownMenu } from "radix-ui";
import { type ReactNode, useState } from "react";

import { BackupDialog } from "@/components/backup-dialog";
import { DeckForm } from "@/components/deck-form";
import { FilterFold } from "@/components/filter-fold";
import { Icon, IconButton } from "@/components/icon-button";
import { ImportApkgDialog } from "@/components/import-apkg-dialog";
import { ImportDeckDialog } from "@/components/import-dialog";
import { LastStudied } from "@/components/last-studied";
import { LanguageSwitch, ThemeSwitch } from "@/components/preferences";
import { Chip, DayStickers, DeckRow, Key, Sheet, Spots, Toggle } from "@/components/sticker";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/language-context";
import { deckFromJson } from "@/core/deck-json";
import { addDeck, matchingDecks, newDeck, receiveAnkiDecks, toggled } from "@/core/decks";
import type { AppLook, Deck, DeckView, Millis, Store } from "@/core/model";
import { type RunItem, dueItems } from "@/core/run";
import { indexSchedules } from "@/core/scheduler";
import { comingUp, deckRows, lastWeek, stickersOn, streak } from "@/core/stats";
import { newId, now as clockNow } from "@/effects/clock";
import { useDeckView } from "@/hooks/use-deck-view";
import { useKeys } from "@/hooks/use-keys";
import { useLook } from "@/hooks/use-look";
import { deckColour } from "@/lib/sticker-looks";
import { looks } from "@/lib/ui-looks";
import { cn } from "@/lib/utils";

type Change = (change: (store: Store) => Store) => void;

const withDecks = (change: (decks: readonly Deck[]) => readonly Deck[]) => (store: Store): Store => ({
  ...store,
  decks: change(store.decks),
});

type HomeProps = {
  store: Store;
  update: Change;
  /** When the screen opened, which today, what is due and the streak count from. */
  now: Millis;
  /** The title of a deck just kept from a link, which home names once. */
  kept: string | null;
  onOpenDeck: (id: string) => void;
  onOpenStats: () => void;
  onStudy: (items: RunItem[]) => void;
};

/** Today: what is due, the day's sheet of stickers, one button to study it all, and the decks ranked by due. */
export function Home({ store, update, now, kept, onOpenDeck, onOpenStats, onStudy }: HomeProps) {
  const { t, tp } = useLanguage();
  const { decks, runs } = store;
  const [dialog, setDialog] = useState<"newDeck" | "json" | "apkg" | "backup" | "goal" | null>(null);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<ReadonlySet<string>>(new Set());
  const allTags = [...new Set(decks.flatMap((deck) => deck.tags))].sort((a, b) => a.localeCompare(b));
  const schedules = indexSchedules(store.schedules);
  const due = dueItems(
    deckRows(decks, runs, schedules, now).map((row) => row.deck),
    schedules,
    now,
  );
  const rows = deckRows(matchingDecks(decks, search, tagFilter), runs, schedules, now);
  const dueDecks = new Set(due.map((item) => item.deckId)).size;
  const later = comingUp(decks, schedules, now);
  const goal = store.settings.dailyCardGoal;
  const { look, toggleLook } = useLook();
  const { view, pickView } = useDeckView(look);

  useKeys((event) => {
    if (dialog === null && event.key === "s" && due.length > 0) onStudy(due);
  });

  const dialogProps = (name: typeof dialog) => ({
    open: dialog === name,
    onOpenChange: (open: boolean) => setDialog(open ? name : null),
  });

  const line =
    decks.length === 0
      ? t("home.noDecks")
      : [
          due.length === 0
            ? t("home.nothingDue")
            : due.length === 1
              ? t("home.waitingOneCard")
              : t(dueDecks === 1 ? "home.waitingOneDeck" : "home.waiting").replace("{n}", String(due.length)).replace("{d}", String(dueDecks)),
          later.tomorrow + later.laterThisWeek > 0 &&
            t("home.then").replace("{tomorrow}", String(later.tomorrow)).replace("{week}", String(later.laterThisWeek)),
        ]
          .filter(Boolean)
          .join(" ");

  return (
    <div className={looks.form}>
      <div className={cn(looks.topbar, "justify-end")}>
        {runs.length > 0 && (
          <IconButton variant="ghost" icon={ChartColumnIcon} label={t("common.stats")} words="sm" onClick={onOpenStats} />
        )}
        <LanguageSwitch />
        <ThemeSwitch />
        <HomeMenu onDialog={setDialog} look={look} onToggleLook={toggleLook} />
      </div>

      {dialog === "newDeck" && (
        <DeckForm
          open
          onOpenChange={(open) => setDialog(open ? "newDeck" : null)}
          onSubmit={(title, tags, color, emoji) => update(withDecks((d) => addDeck(d, newDeck(newId(), { title, tags, color, emoji }, clockNow()))))}
          imports={
            <>
              <Button type="button" variant="outline" size="sm" onClick={() => setDialog("apkg")}>
                {t("deckForm.fromAnki")}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setDialog("json")}>
                {t("deckForm.fromJson")}
              </Button>
            </>
          }
        />
      )}
      <ImportDeckDialog {...dialogProps("json")} onImport={(data) => update(withDecks((d) => addDeck(d, deckFromJson(data, clockNow(), newId))))} />
      <ImportApkgDialog {...dialogProps("apkg")} onImport={(parsed) => update((s) => receiveAnkiDecks(s, parsed.decks, parsed.schedules))} />
      <BackupDialog {...dialogProps("backup")} store={store} onRestore={(restored) => update(() => restored)} />
      <GoalDialog {...dialogProps("goal")} goal={goal} onGoal={(next) => update((s) => ({ ...s, settings: { ...s.settings, dailyCardGoal: next } }))} />

      <div className={looks.split}>
        <div className={looks.form}>
          <div>
            <h1 className={looks.title}>{t("home.today")}</h1>
            {kept !== null ? (
              <p className={looks.good}>{t("home.kept").replace("{title}", kept)}</p>
            ) : (
              <p className={looks.muted}>{line}</p>
            )}
          </div>
          {decks.length > 0 && <TodaySheet store={store} now={now} goal={goal} onGoal={() => setDialog("goal")} />}
          {due.length > 0 && (
            <Button size="lg" className="w-full" onClick={() => onStudy(due)}>
              {due.length === 1 ? t("home.studyOne") : t("home.study").replace("{n}", String(due.length))}
              <Key>S</Key>
            </Button>
          )}
        </div>

        {decks.length === 0 ? (
          <div className="flex min-h-52 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border p-6 text-center">
            <p className={cn(looks.muted, "max-w-64")}>{t("home.emptyHint")}</p>
            <Button onClick={() => setDialog("newDeck")}>{t("home.makeDeck")}</Button>
            <Button variant="ghost" onClick={() => setDialog("apkg")}>
              {t("home.fromAnki")}
            </Button>
          </div>
        ) : (
          <div className={looks.stack}>
            <div className={looks.row}>
              <h2 className="flex-1 text-lg font-bold">{t("home.decks")}</h2>
              <DeckViewSwitch view={view} onPick={pickView} />
              <Button variant="outline" onClick={() => setDialog("newDeck")}>
                <Icon icon={PlusSignIcon} />
                {t("home.newDeck")}
              </Button>
            </div>
            <Input placeholder={t("deckList.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} />
            {allTags.length > 0 && (
              <FilterFold label={t("common.tags")} on={tagFilter.size} onClear={() => setTagFilter(new Set())}>
                <div role="group" aria-label={t("common.tags")} className={looks.chips}>
                  {allTags.map((tag) => (
                    <Toggle key={tag} pressed={tagFilter.has(tag)} onClick={() => setTagFilter(toggled(tagFilter, tag))}>
                      {tag}
                    </Toggle>
                  ))}
                </div>
              </FilterFold>
            )}
            {rows.length === 0 && <p className={looks.muted}>{t("home.noMatch")}</p>}
            <div className={view === "cards" ? "grid gap-3 sm:grid-cols-2" : looks.column}>
              {rows.map(({ deck, due: count, lastRun }) => {
                const meta = (
                  <>
                    {deck.cards.length} {tp(deck.cards.length, "common.card", "common.cards")},{" "}
                    {kept === deck.title ? t("home.keptToday") : <LastStudied at={lastRun} now={now} />}
                    {deck.tags.length > 0 && `, ${deck.tags.join(", ")}`}
                  </>
                );
                const end = count > 0 && <Chip urgent>{count === 1 ? t("home.dueOne") : t("home.due").replace("{n}", String(count))}</Chip>;
                const onOpen = () => onOpenDeck(deck.id);
                return view === "cards" ? (
                  <DeckCard key={deck.id} deck={deck} meta={meta} end={end} onOpen={onOpen} />
                ) : (
                  <DeckRow key={deck.id} deck={deck} meta={meta} end={end} onOpen={onOpen} />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Today's sheet: the goal as spots filled by the day's stickers, the goal's figure changing it, the last seven days, and the streak. */
function TodaySheet({ store, now, goal, onGoal }: { store: Store; now: Millis; goal: number; onGoal: () => void }) {
  const { t, tp, lang } = useLanguage();
  const stickers = stickersOn(store.runs, now);
  const met = goal > 0 && stickers.length >= goal;
  const days = streak(store.runs, now);
  const weekday = new Intl.DateTimeFormat(lang, { weekday: "narrow" });
  const figure = goal > 0 ? t("home.ofGoal").replace("{n}", String(stickers.length)).replace("{goal}", String(goal)) : String(stickers.length);
  return (
    <Sheet
      label={t("home.sheet")}
      value={
        <Button
          variant="ghost"
          size="sm"
          className="-my-3 font-extrabold text-inherit"
          aria-label={`${figure}, ${t("home.changeGoal")}`}
          title={t("home.changeGoal")}
          onClick={onGoal}
        >
          {figure}
        </Button>
      }
      met={met}
    >
      <Spots stickers={stickers} goal={goal} decks={store.decks} />
      {met && stickers.length > goal && (
        <p className={cn(looks.fine, "mt-2")}>{t("home.pastGoal").replace("{n}", String(stickers.length - goal))}</p>
      )}
      <div className="mt-3.5 grid grid-cols-7 gap-1.5 text-center text-xs text-muted-foreground">
        {lastWeek(store.runs, now).map(({ day, decks }, i) => (
          <span key={i} className="grid justify-items-center gap-0.5">
            <DayStickers deckIds={decks} decks={store.decks} />
            {i === 6 ? t("home.todayShort") : weekday.format(day)}
          </span>
        ))}
      </div>
      {days > 0 && (
        <p className={cn(looks.fine, "mt-1.5 text-center")}>
          {days} {tp(days, "home.dayInARow", "home.daysInARow")}
        </p>
      )}
    </Sheet>
  );
}

/** A deck as a card: a cover in its colour with its emoji, then its title, what it holds and its due count. */
function DeckCard({ deck, meta, end, onOpen }: { deck: Deck; meta: ReactNode; end: ReactNode; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      style={deckColour(deck)}
      className="flex cursor-pointer flex-col overflow-hidden rounded-xl border bg-card text-left text-foreground transition-colors hover:bg-muted"
    >
      <span aria-hidden="true" className="grid h-24 place-items-center bg-(--deck) text-2xl">
        {deck.emoji}
      </span>
      <span className="flex flex-col gap-1.5 px-3.5 py-3 leading-snug">
        <span className="font-bold">{deck.title}</span>
        <span className={looks.fine}>{meta}</span>
        {end && <span>{end}</span>}
      </span>
    </button>
  );
}

/** Home's choice between the decks as cards and as rows. */
function DeckViewSwitch({ view, onPick }: { view: DeckView; onPick: (view: DeckView) => void }) {
  const { t } = useLanguage();
  const option = (value: DeckView, icon: typeof GridViewIcon, label: string) => (
    <IconButton
      variant="ghost"
      icon={icon}
      label={label}
      aria-pressed={view === value}
      className={cn(view === value ? looks.ink : "text-muted-foreground")}
      onClick={() => onPick(value)}
    />
  );
  return (
    <div role="group" aria-label={t("home.deckView")} className="flex">
      {option("cards", GridViewIcon, t("home.asCards"))}
      {option("rows", ListViewIcon, t("home.asRows"))}
    </div>
  );
}

type HomeMenuProps = {
  onDialog: (dialog: "backup" | "goal") => void;
  look: AppLook;
  onToggleLook: () => void;
};

/** Home's menu: what is done now and then, the backup, the daily goal and the look. */
function HomeMenu({ onDialog, look, onToggleLook }: HomeMenuProps) {
  const { t } = useLanguage();
  const item = (label: string, onSelect: () => void) => (
    <DropdownMenu.Item className={looks.menuItem} onSelect={onSelect}>
      {label}
    </DropdownMenu.Item>
  );
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <IconButton variant="ghost" icon={MoreHorizontalIcon} label={t("home.more")} />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className={looks.menu} align="end" sideOffset={4}>
          {item(t("home.backup"), () => onDialog("backup"))}
          <DropdownMenu.Separator className={looks.menuRule} />
          {item(t("home.dailyGoal"), () => onDialog("goal"))}
          <DropdownMenu.CheckboxItem className={looks.menuItem} checked={look === "classic"} onCheckedChange={onToggleLook}>
            {t("home.classicLook")}
            <DropdownMenu.ItemIndicator className="ml-auto">
              <Icon icon={Tick02Icon} />
            </DropdownMenu.ItemIndicator>
          </DropdownMenu.CheckboxItem>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

type GoalDialogProps = { open: boolean; onOpenChange: (open: boolean) => void; goal: number; onGoal: (goal: number) => void };

/** The daily goal in cards. A value that does not read as a whole number leaves it as it was. */
function GoalDialog({ open, onOpenChange, goal, onGoal }: GoalDialogProps) {
  const { t } = useLanguage();
  const [text, setText] = useState(String(goal));
  function save() {
    const next = Number.parseInt(text, 10);
    if (Number.isFinite(next)) onGoal(Math.max(0, next));
    onOpenChange(false);
  }
  return (
    <Dialog open={open} onOpenChange={(next) => (setText(String(goal)), onOpenChange(next))}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("home.dailyGoal")}</DialogTitle>
        </DialogHeader>
        <label className={looks.form}>
          <span className={looks.muted}>{t("home.goalPrompt")}</span>
          <Input type="number" min={0} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save()} />
        </label>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={save}>{t("common.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
