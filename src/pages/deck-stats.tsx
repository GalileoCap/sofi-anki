import { useState } from "react";

import { Fold } from "@/components/fold";
import { LastStudied } from "@/components/last-studied";
import { Markdown } from "@/components/markdown";
import { Chip, ComesBack, DeckRow, GradeChip, GradeMark } from "@/components/sticker";
import { FirstTriesChart, MonthSheet } from "@/components/study-charts";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import type { Deck, Millis, RunRecord, Store } from "@/core/model";
import { deckSchedules, dueCards, dueTime, indexSchedules, isAnswer, weakCards } from "@/core/scheduler";
import { type CardStat, cardStats, cardTimeline, daysUntil, firstTries, firstTryRight, newestFirst, timing, totals } from "@/core/stats";
import { longDuration, shortDuration } from "@/core/time";
import { kindWords, smallMark } from "@/lib/sticker-looks";
import type { TranslationKey } from "@/lib/translations";
import { looks } from "@/lib/ui-looks";
import { cn } from "@/lib/utils";

/** A run's first tries in words, each in its grade's colour. */
const countWords: { result: "correct" | "approximate" | "wrong" | "skip"; key: TranslationKey; text: string }[] = [
  { result: "correct", key: "runEnd.right", text: "text-positive" },
  { result: "approximate", key: "runEnd.almost", text: "text-caution" },
  { result: "wrong", key: "runEnd.wrong", text: "text-negative" },
  { result: "skip", key: "runEnd.skipped", text: "text-muted-foreground" },
];

/** Below this percent right, a card is marked as needing work. */
const POOR = 50;

type DeckStatsPageProps = {
  deck: Deck;
  store: Store;
  /** When the screen opened, which the dates count from. */
  now: Millis;
  onBack: () => void;
};

/** How one deck's studying is going: its totals and timing, the month, each run's first tries, each run opening to its cards, and each card opening to its history. */
export function DeckStatsPage({ deck, store, now, onBack }: DeckStatsPageProps) {
  const { t, tp } = useLanguage();
  const runs = newestFirst(store.runs.filter((run) => run.deckId === deck.id));
  const schedules = indexSchedules(store.schedules);
  const right = firstTryRight(runs);
  const spent = totals(runs);
  const times = timing(runs);
  const due = dueCards(deck, schedules, now).length;
  const weak = weakCards(deck, schedules).length;
  const line = [
    `${runs.length} ${tp(runs.length, "stats.runOne", "stats.runMany")}`,
    runs.length > 0 && t("stats.inAll").replace("{time}", longDuration(spent.timeMs)),
    runs.length > 0 && `${spent.cards} ${tp(spent.cards, "runEnd.cardStudied", "runEnd.cardsStudied")}`,
    due > 0 && (due === 1 ? t("home.dueOne") : t("home.due").replace("{n}", String(due))),
    weak > 0 && (weak === 1 ? t("deckStats.weakOne") : t("deckStats.weak").replace("{n}", String(weak))),
    right !== null && t("stats.firstRight").replace("{p}", String(right)),
  ]
    .filter(Boolean)
    .join(", ");
  const meta = (
    <>
      {deck.cards.length} {tp(deck.cards.length, "common.card", "common.cards")}, <LastStudied at={runs[0]?.completedAt ?? null} now={now} />
    </>
  );

  return (
    <div className={looks.narrow}>
      <div className={looks.topbar}>
        <Button variant="ghost" onClick={onBack}>
          {t("deckStats.back")}
        </Button>
      </div>
      <DeckRow deck={deck} meta={meta} head />
      <div className={looks.tight}>
        <p className={looks.lead}>{line}</p>
        {times && (
          <p className={looks.lead}>
            {t("deckStats.timing")
              .replace("{average}", shortDuration(times.average))
              .replace("{fastest}", shortDuration(times.fastest))
              .replace("{slowest}", shortDuration(times.slowest))
              .replace("{card}", shortDuration(times.perCard))}
          </p>
        )}
      </div>
      <MonthSheet runs={runs} decks={[deck]} now={now} />
      {runs.length > 0 && <FirstTriesChart runs={runs} decks={[deck]} />}
      {runs.length > 0 && (
        <div>
          <h2 className={looks.sectionTitle}>{t("deckStats.runs")}</h2>
          <div className={looks.list}>
            {runs.map((run) => (
              <RunRow key={run.id} run={run} now={now} />
            ))}
          </div>
        </div>
      )}
      {runs.length > 0 && (
        <div>
          <h2 className={looks.sectionTitle}>{t("deckStats.cards")}</h2>
          <div className={looks.list}>
            {cardStats(deck, runs, deckSchedules(schedules, deck.id)).map((stat) => (
              <CardRow key={stat.card.id} stat={stat} runs={runs} now={now} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** A run's day near now in words, today, yesterday or the weekday, and its date from a week back. */
function runDay(at: Millis, now: Millis, lang: string): string {
  const midnight = (moment: Millis) => new Date(moment).setHours(0, 0, 0, 0);
  const days = Math.round((midnight(now) - midnight(at)) / 86_400_000);
  const word =
    days < 2
      ? new Intl.RelativeTimeFormat(lang, { numeric: "auto" }).format(-days, "day")
      : days < 7
        ? new Date(at).toLocaleDateString(lang, { weekday: "long" })
        : new Date(at).toLocaleDateString(lang, { month: "short", day: "numeric" });
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/** A run: when, how long, and its first tries, opening to each card with its tries. */
function RunRow({ run, now }: { run: RunRecord; now: Millis }) {
  const { t, lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const counts = firstTries(run);
  const time = new Date(run.completedAt).toLocaleTimeString(lang, { hour: "2-digit", minute: "2-digit" });
  const full = new Date(run.completedAt).toLocaleDateString(lang, { dateStyle: "full" });

  return (
    <div className="border-b-[1.5px] border-border last:border-b-0">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex min-h-11 w-full cursor-pointer flex-col gap-0.5 py-2.5 text-left transition-colors hover:bg-muted"
      >
        <span className={looks.spread}>
          <span title={full}>
            {runDay(run.completedAt, now, lang)}, {time}
          </span>
          <span className={looks.figure}>{shortDuration(run.totalTimeMs)}</span>
        </span>
        <span className="text-xs">
          {countWords
            .filter(({ result }) => counts[result] > 0)
            .map(({ result, key, text }, i) => (
              <span key={result}>
                {i > 0 && ", "}
                <span className={cn(looks.value, text)}>{t(key).replace("{n}", String(counts[result]))}</span>
              </span>
            ))}
        </span>
      </button>
      {open && (
        <div className="flex flex-col border-t-2 border-dashed border-border py-1">
          {run.results.map((result) => (
            <div key={result.card.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-1.5">
              <span className={looks.titled}>
                <Markdown inline className="min-w-0">
                  {result.card.title}
                </Markdown>
                <span className={looks.fine}>
                  {[...kindWords(result.card, t), t("runEnd.firstTry").replace("{time}", shortDuration(result.attempts[0]?.durationMs ?? 0))].join(", ")}
                </span>
              </span>
              <span className={looks.chips}>
                {result.attempts.map((attempt, i) =>
                  isAnswer(attempt.result) ? (
                    <GradeChip key={i} result={attempt.result} />
                  ) : (
                    <Chip key={i}>{t(attempt.result === "skip" ? "common.skipped" : "deckStats.later")}</Chip>
                  ),
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** A card: how often it was right and studied, its time and when it comes back, opening to each run that reached it. */
function CardRow({ stat, runs, now }: { stat: CardStat; runs: readonly RunRecord[]; now: Millis }) {
  const { t, lang } = useLanguage();
  const { card, timesStudied, accuracy, averageMs, schedule } = stat;
  const poor = accuracy !== null && accuracy < POOR;
  const meta = [
    timesStudied === 1 ? t("deckStats.timesOne") : t("deckStats.times").replace("{n}", String(timesStudied)),
    t("deckStats.perRun").replace("{time}", shortDuration(averageMs)),
  ].join(", ");
  const head = (
    <span className="flex min-w-0 flex-1 flex-col">
      <Markdown inline className="min-w-0">
        {card.title}
      </Markdown>
      <span className={looks.fine}>
        {timesStudied === 0 ? (
          t("deck.notStudied")
        ) : (
          <>
            <span className={cn(looks.marked, poor ? "text-negative" : "text-foreground")}>
              {poor && <GradeMark result="wrong" className={smallMark} />}
              {accuracy === null ? t("deckStats.notAnswered") : t("deckStats.right").replace("{p}", String(accuracy))}
            </span>
            , {meta}
          </>
        )}
      </span>
    </span>
  );
  const end = schedule && <ComesBack days={daysUntil(dueTime(schedule), now)} />;
  if (timesStudied === 0) return <div className={cn(looks.listRow, "pl-6")}>{head}</div>;
  const date = new Intl.DateTimeFormat(lang, { month: "short", day: "numeric" });
  return (
    <Fold
      summary={
        <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
          {head}
          {end}
        </span>
      }
      className={looks.foldRow}
    >
      <ol className="mt-1 mb-2 flex flex-col gap-1.5 pl-6">
        {cardTimeline(card.id, runs).map((entry, i) => (
          <li key={i} className={cn(looks.row, "text-sm")}>
            <span className={cn(looks.fineFigure, "w-14")}>{date.format(entry.at)}</span>
            {isAnswer(entry.result) ? <GradeChip result={entry.result} /> : <Chip>{t(entry.result === "skip" ? "common.skipped" : "deckStats.later")}</Chip>}
            <span className={looks.fine}>
              {entry.intervalAfter === 0
                ? t("deckStats.thenNone")
                : entry.intervalAfter === 1
                  ? t("deckStats.thenOne")
                  : t("deckStats.then").replace("{n}", String(entry.intervalAfter))}
            </span>
          </li>
        ))}
      </ol>
    </Fold>
  );
}
