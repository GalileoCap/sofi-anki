import { DropdownMenu } from "radix-ui";
import { useState } from "react";

import { BackupDialog } from "@/components/backup-dialog";
import { DeckForm } from "@/components/deck-form";
import { ImportApkgDialog } from "@/components/import-apkg-dialog";
import { ImportDeckDialog } from "@/components/import-dialog";
import { LastStudied } from "@/components/last-studied";
import { Chip, DayStickers, DeckRow, Key, Sheet, Spots } from "@/components/sticker";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/language-context";
import { deckFromJson } from "@/core/deck-json";
import { addDeck, matchingDecks, newDeck, receiveAnkiDecks } from "@/core/decks";
import { type Deck, type Millis, type Store, following, langs } from "@/core/model";
import { type RunItem, dueItems } from "@/core/run";
import { indexSchedules } from "@/core/scheduler";
import { comingUp, deckRows, lastWeek, stickersOn, streak } from "@/core/stats";
import { newId, now as clockNow } from "@/effects/clock";
import { useKeys } from "@/hooks/use-keys";
import { useTheme } from "@/hooks/use-theme";
import { looks } from "@/lib/ui-looks";
import { cn } from "@/lib/utils";

type Change = (change: (store: Store) => Store) => void;

const withDecks = (change: (decks: readonly Deck[]) => readonly Deck[]) => (store: Store): Store => ({
  ...store,
  decks: change(store.decks),
});

/** Past this many decks, home offers a search. */
const SEARCH_FROM = 8;

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
  const { t, tp, lang, setLang } = useLanguage();
  const { decks, runs } = store;
  const [dialog, setDialog] = useState<"newDeck" | "json" | "apkg" | "backup" | "goal" | null>(null);
  const [search, setSearch] = useState("");
  const schedules = indexSchedules(store.schedules);
  const due = dueItems(
    deckRows(decks, runs, schedules, now).map((row) => row.deck),
    schedules,
    now,
  );
  const rows = deckRows(matchingDecks(decks, search, new Set()), runs, schedules, now);
  const dueDecks = new Set(due.map((item) => item.deckId)).size;
  const later = comingUp(decks, schedules, now);
  const goal = store.settings.dailyCardGoal;

  useKeys((event) => {
    if (dialog === null && event.key === "s" && due.length > 0) onStudy(due);
  });

  const dialogProps = (name: typeof dialog) => ({
    open: dialog === name,
    onOpenChange: (open: boolean) => setDialog(open ? name : null),
  });

  const newDeckForm = (trigger?: React.ReactNode) => (
    <DeckForm
      trigger={trigger}
      {...(trigger === undefined && dialogProps("newDeck"))}
      onSubmit={(title, tags, color, emoji) => update(withDecks((d) => addDeck(d, newDeck(newId(), { title, tags, color, emoji }, clockNow()))))}
    />
  );

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
          <Button variant="ghost" onClick={onOpenStats}>
            {t("common.stats")}
          </Button>
        )}
        <Button variant="ghost" lang={following(langs, lang)} onClick={() => setLang(following(langs, lang))}>
          {t("language.other")}
        </Button>
        <HomeMenu onDialog={setDialog} />
      </div>

      {dialog === "newDeck" && newDeckForm()}
      <ImportDeckDialog {...dialogProps("json")} onImport={(data) => update(withDecks((d) => addDeck(d, deckFromJson(data, clockNow(), newId))))} />
      <ImportApkgDialog {...dialogProps("apkg")} onImport={(parsed) => update((s) => receiveAnkiDecks(s, parsed.decks, parsed.schedules))} />
      <BackupDialog {...dialogProps("backup")} store={store} onRestore={(restored) => update(() => restored)} />
      <GoalDialog {...dialogProps("goal")} goal={goal} onGoal={(next) => update((s) => ({ ...s, settings: { ...s.settings, dailyCardGoal: next } }))} />

      <div className="grid gap-x-12 gap-y-4 lg:grid-cols-[24rem_1fr]">
        <div className={looks.form}>
          <div>
            <h1 className={looks.title}>{t("home.today")}</h1>
            {kept !== null ? (
              <p className={looks.good}>{t("home.kept").replace("{title}", kept)}</p>
            ) : (
              <p className={looks.muted}>{line}</p>
            )}
          </div>
          {decks.length > 0 && <TodaySheet store={store} now={now} goal={goal} />}
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
            {newDeckForm(<Button>{t("home.makeDeck")}</Button>)}
            <Button variant="ghost" onClick={() => setDialog("apkg")}>
              {t("home.fromAnki")}
            </Button>
          </div>
        ) : (
          <div className={looks.stack}>
            <div className={looks.row}>
              <h2 className="flex-1 text-lg font-bold">{t("home.decks")}</h2>
              {newDeckForm(
                <Button variant="outline">
                  {t("home.newDeck")}
                </Button>,
              )}
            </div>
            {decks.length > SEARCH_FROM && (
              <Input placeholder={t("deckList.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} />
            )}
            <div className={looks.column}>
              {rows.map(({ deck, due: count, lastRun }) => (
                <DeckRow
                  key={deck.id}
                  deck={deck}
                  onOpen={() => onOpenDeck(deck.id)}
                  meta={
                    <>
                      {deck.cards.length} {tp(deck.cards.length, "common.card", "common.cards")},{" "}
                      {kept === deck.title ? t("home.keptToday") : <LastStudied at={lastRun} now={now} />}
                    </>
                  }
                  end={count > 0 && <Chip urgent>{count === 1 ? t("home.dueOne") : t("home.due").replace("{n}", String(count))}</Chip>}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Today's sheet: the goal as spots filled by the day's stickers, the last seven days, and the streak. */
function TodaySheet({ store, now, goal }: { store: Store; now: Millis; goal: number }) {
  const { t, tp, lang } = useLanguage();
  const stickers = stickersOn(store.runs, now);
  const met = goal > 0 && stickers.length >= goal;
  const days = streak(store.runs, now);
  const weekday = new Intl.DateTimeFormat(lang, { weekday: "narrow" });
  return (
    <Sheet
      label={t("home.sheet")}
      value={goal > 0 ? t("home.ofGoal").replace("{n}", String(stickers.length)).replace("{goal}", String(goal)) : stickers.length}
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

type HomeMenuProps = {
  onDialog: (dialog: "newDeck" | "json" | "apkg" | "backup" | "goal") => void;
};

/** Home's menu: what is done now and then, from bringing decks in to the theme. */
function HomeMenu({ onDialog }: HomeMenuProps) {
  const { t } = useLanguage();
  const { theme, cycleTheme } = useTheme();
  const item = (label: string, onSelect: () => void) => (
    <DropdownMenu.Item className={looks.menuItem} onSelect={onSelect}>
      {label}
    </DropdownMenu.Item>
  );
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button variant="ghost">{t("home.more")}</Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className={looks.menu} align="end" sideOffset={4}>
          {item(t("home.fromAnki"), () => onDialog("apkg"))}
          {item(t("home.fromJson"), () => onDialog("json"))}
          {item(t("home.backup"), () => onDialog("backup"))}
          <DropdownMenu.Separator className={looks.menuRule} />
          {item(t("home.dailyGoal"), () => onDialog("goal"))}
          <DropdownMenu.Item className={looks.menuItem} onSelect={(e) => (e.preventDefault(), cycleTheme())}>
            {t("theme.label")}: {t(`theme.${theme}`)}
          </DropdownMenu.Item>
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
