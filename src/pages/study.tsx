import { DropdownMenu } from "radix-ui";
import { useState } from "react";

import { Key, Sheet, Spots } from "@/components/sticker";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import type { CardRunResult, Deck, SessionGoal, Store } from "@/core/model";
import {
  type RunAction,
  type RunItem,
  answeredResults,
  currentCard,
  goalReached,
  isFinished,
  runQueue,
  runsByDeck,
  shuffled,
  startRun,
  stepRun,
  withRuns,
} from "@/core/run";
import { indexSchedules, scheduleKey, wasAnswered } from "@/core/scheduler";
import { stickersOn } from "@/core/stats";
import { clockFace, elapsed, pauseStopwatch, resumeStopwatch, startStopwatch } from "@/core/time";
import { newId, now, randoms } from "@/effects/clock";
import { useKeys } from "@/hooks/use-keys";
import { useNow } from "@/hooks/use-now";
import { looks } from "@/lib/ui-looks";
import { cn } from "@/lib/utils";
import { RunSummary } from "@/pages/run-summary";
import { StudyCard } from "@/pages/study-card";

type Change = (change: (store: Store) => Store) => void;

type StudyPageProps = {
  /** The cards the run studies, from one deck or many, in order. */
  items: readonly RunItem[];
  store: Store;
  goal: SessionGoal | undefined;
  shuffle: boolean;
  update: Change;
  onExit: () => void;
};

/** A run through `items`, which can start again from its end on the cards to look at again. */
export function StudyPage(props: StudyPageProps) {
  const [round, setRound] = useState({ n: 0, items: props.items });
  return <Run key={round.n} {...props} items={round.items} onRestart={(items) => setRound({ n: round.n + 1, items })} />;
}

/** One run, timed with its pauses left out, kept in the store as one run per deck when it ends or is left. */
function Run({ items, store, goal, shuffle, update, onExit, onRestart }: StudyPageProps & { onRestart: (items: RunItem[]) => void }) {
  const { t } = useLanguage();
  const [opened] = useState(now);
  const [run, setRun] = useState(() => startRun(runQueue(shuffle ? shuffled(items, randoms(items.length)) : items)));
  const [watch, setWatch] = useState(() => startStopwatch(now()));
  const [tick, refreshTick] = useNow(1000);
  /** The run's time when the card on screen came up. */
  const [cardShownAt, setCardShownAt] = useState(0);
  /** Counts the cards shown, so a card shown again starts fresh. */
  const [shown, setShown] = useState(0);
  const [totalMs, setTotalMs] = useState<number | null>(null);
  const [goalDismissed, setGoalDismissed] = useState(false);
  /** The store as the run found it, so the sheet counts today's earlier cards once. */
  const [before] = useState(store);
  const paused = watch.pausedAt !== null;
  const spent = elapsed(watch, tick);
  const card = currentCard(run);
  const byKey = new Map(items.map((item) => [scheduleKey(item.deckId, item.card.id), item]));
  const deckOf = (cardId: string): Deck | undefined => before.decks.find((deck) => deck.id === byKey.get(cardId)?.deckId);
  const schedules = indexSchedules(before.schedules);

  function keep(results: readonly CardRunResult[], ms: number) {
    update((s) => withRuns(s, runsByDeck(results, items, now(), ms, newId)));
  }

  function step(action: (durationMs: number) => RunAction) {
    const at = elapsed(watch, now());
    const next = stepRun(run, action(at - cardShownAt));
    setRun(next);
    setCardShownAt(at);
    setShown(shown + 1);
    if (isFinished(next)) {
      setTotalMs(at);
      keep([...next.results.values()], at);
    }
  }

  function togglePause() {
    const at = now();
    setWatch(paused ? resumeStopwatch(watch, at) : pauseStopwatch(watch, at));
    refreshTick();
  }

  /** Leaving keeps the cards answered so far, and nothing when none was. */
  function leave() {
    const answered = answeredResults(run);
    if (answered.length > 0) keep(answered, elapsed(watch, now()));
    onExit();
  }

  const undo = () => run.undo.length > 0 && step(() => ({ kind: "undo" }));
  const skip = () => step((durationMs) => ({ kind: "skip", durationMs }));
  const postpone = () => step((durationMs) => ({ kind: "postpone", durationMs, random: randoms(1)[0] }));

  useKeys((event) => {
    if (totalMs !== null) return;
    if (event.key === "p") togglePause();
    else if (event.key === "Escape") leave();
    else if (!paused && event.key === "s") skip();
    else if (!paused && event.key === "l") postpone();
    else if ((event.ctrlKey || event.metaKey) && event.key === "z") {
      event.preventDefault();
      undo();
    }
  });

  if (totalMs !== null || card === undefined) {
    return (
      <div className={looks.page}>
        <RunSummary
          results={[...run.results.values()]}
          items={items}
          decks={before.decks}
          totalTimeMs={totalMs ?? spent}
          onRestart={onRestart}
          onExit={onExit}
        />
      </div>
    );
  }

  const answeredNow = [...run.results.values()].filter((result) => wasAnswered(result.attempts));
  const stickers = [...stickersOn(before.runs, opened), ...answeredNow.flatMap((result) => byKey.get(result.card.id)?.deckId ?? [])];
  const showGoal = goal !== undefined && !goalDismissed && goalReached(goal, run, spent);
  const dailyGoal = before.settings.dailyCardGoal;
  const inRun = new Map<string, number>();
  for (const item of items) inRun.set(item.deckId, (inRun.get(item.deckId) ?? 0) + 1);

  return (
    <div className={cn(looks.page, "grid min-h-dvh gap-x-10 gap-y-4 lg:grid-cols-[17.5rem_minmax(0,45rem)]")}>
      <aside className="hidden flex-col gap-4 pt-15 lg:flex">
        <Sheet label={t("home.sheet")} value={t("home.ofGoal").replace("{n}", String(stickers.length)).replace("{goal}", String(dailyGoal))}>
          <Spots stickers={stickers} goal={dailyGoal} decks={before.decks} />
        </Sheet>
        <div>
          <h2 className={looks.sectionTitle}>{t("study.inThisRun")}</h2>
          <div className={looks.list}>
            {[...inRun].map(([deckId, count]) => (
              <div key={deckId} className={looks.listRow}>
                <span>{before.decks.find((deck) => deck.id === deckId)?.title}</span>
                <span className="tabular-nums">{count}</span>
              </div>
            ))}
          </div>
        </div>
        <p className={looks.fine}>{t("study.keys")}</p>
      </aside>

      <main className={looks.form}>
        <div className={looks.topbar}>
          <Button variant="ghost" className="-ml-3" onClick={leave}>
            {t("study.leave")}
            <Key>Esc</Key>
          </Button>
          <span className="tabular-nums">
            {t("study.position").replace("{n}", String(Math.min(run.index + 1, run.queue.length))).replace("{total}", String(run.queue.length))}
          </span>
          <StudyMenu paused={paused} canUndo={run.undo.length > 0} onPostpone={postpone} onSkip={skip} onPause={togglePause} onUndo={undo} />
        </div>
        <div className="lg:hidden">
          <Spots stickers={stickers} goal={dailyGoal} decks={before.decks} />
        </div>
        {goal && (
          <p className={cn(looks.muted, "tabular-nums")}>
            {goal.type === "cards"
              ? t("study.goalCards").replace("{n}", String(Math.min(run.completed, goal.value))).replace("{goal}", String(goal.value))
              : t("study.goalTime").replace("{n}", clockFace(Math.min(spent, goal.value * 60_000))).replace("{goal}", clockFace(goal.value * 60_000))}
          </p>
        )}
        {showGoal && !paused && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-positive bg-card px-4 py-3">
            <p className={looks.good}>{t("studySession.youReachedGoal")}</p>
            <div className={looks.buttons}>
              <Button variant="outline" onClick={() => setGoalDismissed(true)}>
                {t("common.continue")}
              </Button>
              <Button onClick={() => step(() => ({ kind: "finish" }))}>{t("common.finish")}</Button>
            </div>
          </div>
        )}
        {paused ? (
          <div className="flex flex-col items-center gap-4 py-16">
            <p className="text-xl font-bold text-muted-foreground">{t("studySession.paused")}</p>
            <Button onClick={togglePause}>
              {t("common.resume")}
              <Key>P</Key>
            </Button>
          </div>
        ) : (
          <StudyCard
            key={shown}
            card={card}
            deck={deckOf(card.id)}
            schedule={schedules.get(card.id)}
            now={opened}
            paused={paused}
            onAnswer={(result, selectedOptionIds) =>
              step((durationMs) => ({ kind: "answer", result, durationMs, redoLater: result !== "correct", selectedOptionIds }))
            }
          />
        )}
      </main>
    </div>
  );
}

type StudyMenuProps = { paused: boolean; canUndo: boolean; onPostpone: () => void; onSkip: () => void; onPause: () => void; onUndo: () => void };

/** What is done now and then in a run: put the card off, skip it, pause, take a grade back. */
function StudyMenu({ paused, canUndo, onPostpone, onSkip, onPause, onUndo }: StudyMenuProps) {
  const { t } = useLanguage();
  const item = (label: string, key: string, onSelect: () => void, disabled = false) => (
    <DropdownMenu.Item className={looks.menuItem} disabled={disabled} onSelect={onSelect}>
      <span className="flex-1">{label}</span>
      <Key>{key}</Key>
    </DropdownMenu.Item>
  );
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button variant="ghost" className="-mr-3">
          {t("home.more")}
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className={looks.menu} align="end" sideOffset={4}>
          {item(t("studyCard.saveForLater"), "L", onPostpone, paused)}
          {item(t("common.skip"), "S", onSkip, paused)}
          {item(paused ? t("common.resume") : t("common.pause"), "P", onPause)}
          {item(t("common.undo"), "⌘Z", onUndo, !canUndo)}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
