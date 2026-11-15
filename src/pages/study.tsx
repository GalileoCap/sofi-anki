import { Cancel01Icon, MoreHorizontalIcon, PauseIcon, PlayIcon } from "@hugeicons/core-free-icons";
import { DropdownMenu } from "radix-ui";
import { useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Icon, IconButton } from "@/components/icon-button";
import { Bar, GradeMark, Key, Sheet, Spots } from "@/components/sticker";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import type { CardRunResult, Deck, SessionGoal, Store } from "@/core/model";
import {
  type RunAction,
  type RunItem,
  type RunState,
  answeredResults,
  currentCard,
  estimatedTotal,
  goalReached,
  isFinished,
  progress,
  runQueue,
  runsByDeck,
  shuffled,
  startRun,
  stepRun,
  withRuns,
} from "@/core/run";
import { indexSchedules, scheduleKey, wasAnswered } from "@/core/scheduler";
import { firstTries, stickersOn } from "@/core/stats";
import { clockFace, elapsed, pauseStopwatch, resumeStopwatch, startStopwatch } from "@/core/time";
import { newId, now, randoms } from "@/effects/clock";
import { useKeys } from "@/hooks/use-keys";
import { useNow } from "@/hooks/use-now";
import { gradeLooks, gradeWords, smallMark } from "@/lib/sticker-looks";
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
  const [timeShown, setTimeShown] = useState(true);
  const [leaving, setLeaving] = useState(false);
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

  /** Leaving, once confirmed, keeps the cards answered so far, and nothing when none was. */
  function leave() {
    const answered = answeredResults(run);
    if (answered.length > 0) keep(answered, elapsed(watch, now()));
    onExit();
  }

  const undo = () => run.undo.length > 0 && step(() => ({ kind: "undo" }));
  const skip = () => step((durationMs) => ({ kind: "skip", durationMs }));
  const postpone = () => step((durationMs) => ({ kind: "postpone", durationMs, random: randoms(1)[0] }));

  useKeys((event) => {
    if (totalMs !== null || leaving) return;
    if (event.key === "p") togglePause();
    else if (event.key === "Escape") setLeaving(true);
    else if (!paused && event.key === "s") skip();
    else if (!paused && event.key === "l") postpone();
    else if ((event.ctrlKey || event.metaKey) && event.key === "z") {
      event.preventDefault();
      undo();
    }
  });

  if (totalMs !== null || card === undefined) {
    return (
      <main className={looks.page}>
        <RunSummary
          results={[...run.results.values()]}
          items={items}
          decks={before.decks}
          totalTimeMs={totalMs ?? spent}
          onRestart={onRestart}
          onExit={onExit}
        />
      </main>
    );
  }

  const answeredNow = [...run.results.values()].filter((result) => wasAnswered(result.attempts));
  const stickers = [...stickersOn(before.runs, opened), ...answeredNow.flatMap((result) => byKey.get(result.card.id)?.deckId ?? [])];
  const showGoal = goal !== undefined && !goalDismissed && goalReached(goal, run, spent);
  const dailyGoal = before.settings.dailyCardGoal;
  const estimate = estimatedTotal(run, spent);
  const answeredSoFar = answeredResults(run).length;
  const actions: StudyAction[] = [
    { label: paused ? t("common.resume") : t("common.pause"), key: "P", onClick: togglePause },
    { label: t("common.undo"), key: "⌘Z", onClick: undo, disabled: run.undo.length === 0 },
    { label: t("common.skip"), key: "S", onClick: skip, disabled: paused },
    { label: t("studyCard.saveForLater"), key: "L", onClick: postpone, disabled: paused },
  ];
  const toggleTime = { label: timeShown ? t("study.hideTime") : t("study.showTime"), key: "time", onClick: () => setTimeShown(!timeShown) };
  const sheetValue = t("home.ofGoal").replace("{n}", String(stickers.length)).replace("{goal}", String(dailyGoal));

  return (
    <main className={cn(looks.page, "grid min-h-dvh gap-x-10 gap-y-4 lg:grid-cols-[17.5rem_minmax(0,45rem)]")}>
      <aside className="hidden flex-col gap-4 pt-15 lg:flex">
        <Sheet label={t("home.sheet")} value={sheetValue}>
          <Spots stickers={stickers} goal={dailyGoal} decks={before.decks} />
        </Sheet>
        <div className={looks.stack}>
          <div className={looks.spread}>
            <h2 className={looks.sectionTitle}>{t("study.thisRun")}</h2>
            {timeShown && (
              <span className={cn(looks.value, "text-lg")} role="timer" aria-label={t("study.time")}>
                {clockFace(spent)}
              </span>
            )}
          </div>
          {timeShown && estimate !== null && <p className={looks.fine}>{t("study.estimate").replace("{time}", clockFace(estimate))}</p>}
          <Button variant="ghost" className="-ml-3 self-start text-muted-foreground" onClick={toggleTime.onClick}>
            {toggleTime.label}
          </Button>
          <FirstTriesSoFar results={answeredNow} />
          <div className="flex flex-col items-start">
            {actions.map(({ label, key, onClick, disabled }) => (
              <Button key={key} variant="ghost" disabled={disabled} onClick={onClick}>
                {label}
                <Key>{key}</Key>
              </Button>
            ))}
          </div>
        </div>
        <p className={looks.fine}>{t("study.keys")}</p>
      </aside>

      <div className={looks.form}>
        <div className={looks.topbar}>
          <Button variant="ghost" onClick={() => setLeaving(true)}>
            <Icon icon={Cancel01Icon} />
            {t("study.leave")}
            <Key>Esc</Key>
          </Button>
          <span className="tabular-nums whitespace-nowrap">
            {t("study.position").replace("{n}", String(Math.min(run.index + 1, run.queue.length))).replace("{total}", String(run.queue.length))}
          </span>
          <span className={cn(looks.row, "lg:hidden")}>
            <IconButton variant="ghost" icon={paused ? PlayIcon : PauseIcon} label={paused ? t("common.resume") : t("common.pause")} words="sm" onClick={togglePause} />
            <StudyMenu actions={[...actions.filter((action) => action.key !== "P"), toggleTime]} />
          </span>
        </div>
        <div className="flex flex-col gap-1.5 lg:hidden">
          <p className={cn(looks.spread, looks.muted)}>
            <span>{`${t("home.sheet")}: ${sheetValue}`}</span>
            {timeShown && (
              <span className="tabular-nums" role="timer" aria-label={t("study.time")}>
                {estimate === null ? clockFace(spent) : t("study.timeOf").replace("{n}", clockFace(spent)).replace("{total}", clockFace(estimate))}
              </span>
            )}
          </p>
          <Spots stickers={stickers} goal={dailyGoal} decks={before.decks} />
        </div>
        <RunProgress run={run} />
        {goal && <GoalProgress goal={goal} completed={run.completed} spent={spent} reached={goalReached(goal, run, spent) && !showGoal} />}
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
            paused={paused || leaving}
            onAnswer={(result, redoLater, selectedOptionIds) =>
              step((durationMs) => ({ kind: "answer", result, durationMs, redoLater, selectedOptionIds }))
            }
          />
        )}
      </div>
      <ConfirmDialog
        open={leaving}
        onOpenChange={setLeaving}
        title={t("study.leaveTitle")}
        body={
          answeredSoFar === 0
            ? t("study.leaveNothing")
            : answeredSoFar === 1
              ? t("study.leaveKeepsOne")
              : t("study.leaveKeeps").replace("{n}", String(answeredSoFar))
        }
        confirm={t("study.leave")}
        cancel={t("study.keepStudying")}
        destructive={false}
        onConfirm={leave}
      />
    </main>
  );
}

type StudyAction = { label: string; key: string; onClick: () => void; disabled?: boolean };

/** The run's cards as a bar: done, to ask again, still to go, with each count in words. */
function RunProgress({ run }: { run: RunState }) {
  const { t } = useLanguage();
  const { done, redo, pending, total } = progress(run);
  const words = [
    t("study.done").replace("{n}", String(done)),
    ...(redo > 0 ? [t("study.again").replace("{n}", String(redo))] : []),
    t("study.toGo").replace("{n}", String(pending)),
  ];
  return (
    <div className={looks.tight}>
      <Bar
        label={`${t("study.progress")}: ${words.join(", ")}`}
        parts={[
          { share: done / total, className: "bg-foreground" },
          { share: redo / total, className: "bg-caution" },
        ]}
      />
      <p className={cn(looks.fine, "flex flex-wrap gap-x-3 tabular-nums")} aria-hidden="true">
        {words.map((word) => (
          <span key={word}>{word}</span>
        ))}
      </p>
    </div>
  );
}

type GoalProgressProps = { goal: SessionGoal; completed: number; spent: number; reached: boolean };

/** How far the run is toward its goal, in cards or in time, as a green bar. */
function GoalProgress({ goal, completed, spent, reached }: GoalProgressProps) {
  const { t } = useLanguage();
  const goalMs = goal.value * 60_000;
  const words =
    goal.type === "cards"
      ? t("study.goalCards").replace("{n}", String(Math.min(completed, goal.value))).replace("{goal}", String(goal.value))
      : t("study.goalTime").replace("{n}", clockFace(Math.min(spent, goalMs))).replace("{goal}", clockFace(goalMs));
  return (
    <div className={looks.tight}>
      <p className={cn(looks.spread, looks.fine, "flex-wrap gap-x-3 tabular-nums")}>
        <span>{words}</span>
        {reached && <span className="font-bold text-positive">{t("study.goalReached")}</span>}
      </p>
      <Bar label={words} parts={[{ share: goal.type === "cards" ? completed / goal.value : spent / goalMs, className: "bg-positive" }]} />
    </div>
  );
}

/** The first tries of the cards answered so far, each grade's count beside its mark. */
function FirstTriesSoFar({ results }: { results: readonly CardRunResult[] }) {
  const { t } = useLanguage();
  const counts = firstTries({ results: [...results] });
  return (
    <p className="flex gap-4 text-sm">
      {(["correct", "approximate", "wrong"] as const).map((result) => (
        <span key={result} className={cn("inline-flex items-center gap-1.5", looks.value, gradeLooks[result].text)}>
          <GradeMark result={result} className={smallMark} />
          {counts[result]}
          <span className="sr-only">{t(gradeWords[result])}</span>
        </span>
      ))}
    </p>
  );
}

/** On a phone, what is done now and then in a run: take a grade back, skip the card, put it off. */
function StudyMenu({ actions }: { actions: readonly StudyAction[] }) {
  const { t } = useLanguage();
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <IconButton variant="ghost" icon={MoreHorizontalIcon} label={t("home.more")} />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className={looks.menu} align="end" sideOffset={4}>
          {actions.map(({ label, key, onClick, disabled }) => (
            <DropdownMenu.Item key={key} className={looks.menuItem} disabled={disabled} onSelect={onClick}>
              {label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
