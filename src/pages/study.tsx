import { Tooltip } from "radix-ui";
import { useState } from "react";

import { GoalBar } from "@/components/goal-bar";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import type { Card, CardRunResult, Deck, SessionGoal, Store } from "@/core/model";
import {
  type RunAction,
  type RunState,
  answeredResults,
  currentCard,
  estimatedTotal,
  goalReached,
  isFinished,
  progress,
  shuffled,
  startRun,
  stepRun,
  withRun,
} from "@/core/run";
import { clockFace, elapsed, pauseStopwatch, resumeStopwatch, startStopwatch } from "@/core/time";
import { newId, now, randoms } from "@/effects/clock";
import { useKeys } from "@/hooks/use-keys";
import { useNow } from "@/hooks/use-now";
import { looks } from "@/lib/ui-looks";
import { cn } from "@/lib/utils";
import { RunSummary } from "@/pages/run-summary";
import { Shortcut, StudyCard } from "@/pages/study-card";

type Change = (change: (store: Store) => Store) => void;

type StudyPageProps = {
  deck: Deck;
  /** The cards the run studies, in the deck's order. */
  cards: readonly Card[];
  goal: SessionGoal | undefined;
  shuffle: boolean;
  update: Change;
  onExit: () => void;
};

/** A run through `cards`, which starts over from its summary as a new run. */
export function StudyPage(props: StudyPageProps) {
  const [round, setRound] = useState(0);
  return <Run key={round} {...props} onRestart={() => setRound(round + 1)} />;
}

/** One run, timed with its pauses left out, kept in the store when it ends or is left. */
function Run({ deck, cards, goal, shuffle, update, onExit, onRestart }: StudyPageProps & { onRestart: () => void }) {
  const { t } = useLanguage();
  const [run, setRun] = useState(() => startRun(shuffle ? shuffled(cards, randoms(cards.length)) : cards));
  const [watch, setWatch] = useState(() => startStopwatch(now()));
  const [tick, refreshTick] = useNow(1000);
  /** The run's time when the card on screen came up. */
  const [cardShownAt, setCardShownAt] = useState(0);
  /** Counts the cards shown, so a card shown again starts fresh. */
  const [shown, setShown] = useState(0);
  const [totalMs, setTotalMs] = useState<number | null>(null);
  const [confirmExit, setConfirmExit] = useState(false);
  const [goalDismissed, setGoalDismissed] = useState(false);
  const [timerShown, setTimerShown] = useState(true);
  const paused = watch.pausedAt !== null;
  const spent = elapsed(watch, tick);
  const card = currentCard(run);

  function keep(results: readonly CardRunResult[], ms: number) {
    update((store) => withRun(store, { id: newId(), deckId: deck.id, completedAt: now(), totalTimeMs: ms, results: [...results] }));
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

  /** Leaving keeps the cards answered so far as a run, and nothing when none was. */
  function leave() {
    const answered = answeredResults(run);
    if (answered.length > 0) keep(answered, elapsed(watch, now()));
    onExit();
  }

  useKeys((event) => {
    if (totalMs !== null) return;
    if (event.key === "p") togglePause();
    else if (event.key === "Escape") setConfirmExit(!confirmExit);
    else if ((event.ctrlKey || event.metaKey) && event.key === "z") {
      event.preventDefault();
      if (run.undo.length > 0) step(() => ({ kind: "undo" }));
    }
  });

  if (totalMs !== null || card === undefined) {
    return (
      <div className={looks.page}>
        <RunSummary results={[...run.results.values()]} totalTimeMs={totalMs ?? spent} onRestart={onRestart} onExit={onExit} />
      </div>
    );
  }

  const estimate = estimatedTotal(run, spent);
  const showGoal = goal !== undefined && !goalDismissed && goalReached(goal, run, spent);

  return (
    <div className={cn(looks.page, "flex flex-col items-center gap-6")}>
      <div className="flex w-full flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className={looks.spread}>
          {confirmExit ? (
            <div className={looks.tightRow}>
              <Button variant="destructive" size="sm" onClick={leave}>
                {t("studySession.exit")}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmExit(false)}>
                {t("common.cancel")}
              </Button>
            </div>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setConfirmExit(true)}>
              {t("studySession.exit")}
              <Shortcut>Esc</Shortcut>
            </Button>
          )}
          <div className={looks.row}>
            <Button
              variant="ghost"
              size="xs"
              disabled={run.undo.length === 0}
              onClick={() => step(() => ({ kind: "undo" }))}
              title={t("studySession.undoTitle")}
            >
              {t("common.undo")}
              <Shortcut>⌘Z</Shortcut>
            </Button>
            <Button variant={paused ? "secondary" : "ghost"} size="xs" onClick={togglePause}>
              {paused ? t("common.resume") : t("common.pause")}
              <Shortcut>P</Shortcut>
            </Button>
            {timerShown && <Timer spent={spent} estimate={estimate} />}
            <Button variant="ghost" size="xs" className="hidden sm:inline-flex" onClick={() => setTimerShown(!timerShown)}>
              {timerShown ? t("common.hide") : t("common.show")}
            </Button>
            <p className={looks.muted}>
              {run.index + 1} / {run.queue.length}
            </p>
          </div>
        </div>
        <div className="flex justify-center sm:hidden">
          <span className={looks.fineFigure}>{clockFace(spent)}</span>
        </div>
      </div>

      <RunProgress run={run} />
      {goal && <GoalProgress goal={goal} completed={run.completed} spent={spent} reached={showGoal} />}

      {showGoal && !paused && (
        <div className="flex w-full items-center justify-between rounded-lg border border-positive/40 bg-positive-soft px-4 py-3">
          <p className="text-sm font-medium text-positive">{t("studySession.youReachedGoal")}</p>
          <div className={looks.buttons}>
            <Button size="sm" variant="outline" onClick={() => setGoalDismissed(true)}>
              {t("common.continue")}
            </Button>
            <Button size="sm" onClick={() => step(() => ({ kind: "finish" }))}>
              {t("common.finish")}
            </Button>
          </div>
        </div>
      )}

      {paused && (
        <div className="flex flex-col items-center gap-4 py-16">
          <p className="text-xl font-medium text-muted-foreground">{t("studySession.paused")}</p>
          <Button onClick={togglePause}>
            {t("common.resume")}
            <Shortcut>P</Shortcut>
          </Button>
        </div>
      )}
      <div className={cn("w-full", paused && "hidden")}>
        <StudyCard
          key={shown}
          card={card}
          paused={paused}
          onSkip={() => step((durationMs) => ({ kind: "skip", durationMs }))}
          onPostpone={() => step((durationMs) => ({ kind: "postpone", durationMs, random: randoms(1)[0] }))}
          onAnswer={(result, redoLater, selectedOptionIds) =>
            step((durationMs) => ({ kind: "answer", result, durationMs, redoLater, selectedOptionIds }))
          }
        />
      </div>
    </div>
  );
}

/** The run's time so far, and on hover its whole time at the pace so far. */
function Timer({ spent, estimate }: { spent: number; estimate: number | null }) {
  const { t } = useLanguage();
  return (
    <Tooltip.Provider delayDuration={300}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <span className="hidden cursor-default font-mono text-sm text-muted-foreground select-none sm:inline">{clockFace(spent)}</span>
        </Tooltip.Trigger>
        {estimate !== null && (
          <Tooltip.Portal>
            <Tooltip.Content
              sideOffset={6}
              className="z-50 rounded-md border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-sm"
            >
              ~{clockFace(estimate)}
              {t("studySession.estimatedTotal")}
              <Tooltip.Arrow className="fill-popover" />
            </Tooltip.Content>
          </Tooltip.Portal>
        )}
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

const dot = "inline-block h-2 w-2 shrink-0 rounded-full";

/** The run's cards as a bar: done, put off to later, still ahead. */
function RunProgress({ run }: { run: RunState }) {
  const { t } = useLanguage();
  const { done, redo, pending, total } = progress(run);
  const share = (n: number) => `${total > 0 ? (n / total) * 100 : 0}%`;
  return (
    <div className={looks.wide}>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full shrink-0 bg-primary/60 transition-[width] duration-300" style={{ width: share(done) }} />
        <div className="h-full shrink-0 bg-caution/80 transition-[width] duration-300" style={{ width: share(redo) }} />
      </div>
      <div className={looks.legend}>
        <span className={looks.tightRow}>
          <span className={cn(dot, "bg-primary/60")} />
          {done}
          {t("studySession.done")}
        </span>
        {redo > 0 && (
          <span className={looks.tightRow}>
            <span className={cn(dot, "bg-caution/80")} />
            {redo}
            {t("studySession.redoLater")}
          </span>
        )}
        <span className={looks.tightRow}>
          <span className={cn(dot, "bg-muted-foreground/30")} />
          {pending}
          {t("studySession.pending")}
        </span>
      </div>
    </div>
  );
}

type GoalProgressProps = { goal: SessionGoal; completed: number; spent: number; reached: boolean };

/** How far the run is toward its goal, in cards or in minutes. */
function GoalProgress({ goal, completed, spent, reached }: GoalProgressProps) {
  const { t } = useLanguage();
  const goalMs = goal.value * 60_000;
  const share = goal.type === "cards" ? completed / goal.value : spent / goalMs;
  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {goal.type === "cards"
            ? `${Math.min(completed, goal.value)} / ${goal.value} ${t("common.cards")}`
            : `${clockFace(Math.min(spent, goalMs))} / ${clockFace(goalMs)}`}
        </span>
        {reached && <span className={cn("font-medium", looks.positive)}>{t("studySession.goalReached")}</span>}
      </div>
      <GoalBar share={share} />
    </div>
  );
}
