import { useState } from "react";

import { LastStudied } from "@/components/last-studied";
import { Markdown } from "@/components/markdown";
import { Chip, DeckRow, GradeChip } from "@/components/sticker";
import { FirstTriesChart, MonthSheet } from "@/components/study-charts";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import type { Deck, Millis, RunRecord, Store } from "@/core/model";
import { isAnswer } from "@/core/scheduler";
import { firstTries, firstTryRight, newestFirst, totals } from "@/core/stats";
import { shortDuration } from "@/core/time";
import type { TranslationKey } from "@/lib/translations";
import { looks } from "@/lib/ui-looks";
import { cn } from "@/lib/utils";

/** A run's first tries in words, each in its grade's colour. */
const countWords: { result: "correct" | "approximate" | "wrong"; key: TranslationKey; text: string }[] = [
  { result: "correct", key: "runEnd.right", text: "text-positive" },
  { result: "approximate", key: "runEnd.almost", text: "text-caution" },
  { result: "wrong", key: "runEnd.wrong", text: "text-negative" },
];

type DeckStatsPageProps = {
  deck: Deck;
  store: Store;
  /** When the screen opened, which the dates count from. */
  now: Millis;
  onBack: () => void;
};

/** How one deck's studying is going: its runs in a line, the month, each run's first tries, and each run opening to its cards. */
export function DeckStatsPage({ deck, store, now, onBack }: DeckStatsPageProps) {
  const { t, tp } = useLanguage();
  const runs = newestFirst(store.runs.filter((run) => run.deckId === deck.id));
  const right = firstTryRight(runs);
  const line = [
    `${runs.length} ${tp(runs.length, "stats.runOne", "stats.runMany")}`,
    runs.length > 0 && t("deckStats.average").replace("{time}", shortDuration(totals(runs).timeMs / runs.length)),
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
      <p className={looks.muted}>{line}</p>
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
              <Markdown inline className="min-w-0">
                {result.card.title}
              </Markdown>
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
