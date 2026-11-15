import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";

import { DayStickers, GradeMark, Sheet, Sticker } from "@/components/sticker";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import type { AnswerResult, Deck, Millis, RunRecord } from "@/core/model";
import { type DayKey, dayKey, firstTries, monthDays, monthsBack } from "@/core/stats";
import { gradeLooks, gradeWords } from "@/lib/sticker-looks";
import type { TranslationKey } from "@/lib/translations";
import { looks } from "@/lib/ui-looks";
import { cn } from "@/lib/utils";

/** The runs the chart draws, the latest, so a bar stays wide enough on a phone. */
const SHOWN_RUNS = 20;

/** The grades from the bar's foot up, with each one's colour and count in words. */
const stack: { result: AnswerResult; bar: string; count: TranslationKey }[] = [
  { result: "correct", bar: "bg-positive", count: "runEnd.right" },
  { result: "approximate", bar: "bg-caution", count: "runEnd.almost" },
  { result: "wrong", bar: "bg-negative", count: "runEnd.wrong" },
];

/** A run's deck under its bar and in the key, as a small sticker. */
const ChartDot = ({ deck }: { deck: Deck | undefined }) => <Sticker deck={deck} className="w-2.5 border-[1.5px]" />;

/** The month of `now` as a calendar of stickers, stepping back to the month of the first run: each day keeps its number, a day studied shows its decks and, when picked, its count of cards, and today shows an empty spot. */
export function MonthSheet({ runs, decks, now }: { runs: readonly RunRecord[]; decks: readonly Deck[]; now: Millis }) {
  const { t, tp, lang } = useLanguage();
  const [back, setBack] = useState(0);
  const [picked, setPicked] = useState<DayKey | null>(null);
  const days = monthDays(runs, now, back);
  const earliest = monthsBack(runs, now);
  const first = days[0].day;
  const studied = days.filter((day) => day.decks.length > 0).length;
  const lead = (first.getDay() + 6) % 7;
  const monday = new Date(first.getFullYear(), first.getMonth(), first.getDate() - lead);
  const weekday = new Intl.DateTimeFormat(lang, { weekday: "narrow" });
  const sameYear = first.getFullYear() === new Date(now).getFullYear();
  const month = new Intl.DateTimeFormat(lang, sameYear ? { month: "long" } : { month: "long", year: "numeric" }).format(first);
  const date = new Intl.DateTimeFormat(lang, { month: "long", day: "numeric" });
  const today = dayKey(now);
  const words = ({ day, cards }: (typeof days)[number]) => `${date.format(day)}: ${cards} ${tp(cards, "common.card", "common.cards")}`;
  const shown = days.find(({ day }) => dayKey(day) === picked);
  const step = (by: number) => {
    setBack(back + by);
    setPicked(null);
  };

  return (
    <Sheet label={month.charAt(0).toUpperCase() + month.slice(1)} value={`${studied} ${tp(studied, "stats.dayStudied", "stats.daysStudied")}`}>
      <div className="-mx-1 grid grid-cols-7 gap-y-1.5 text-center">
        {Array.from({ length: 7 }, (_, i) => (
          <span key={`name-${i}`} className={looks.fine} aria-hidden="true">
            {weekday.format(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i))}
          </span>
        ))}
        {Array.from({ length: lead }, (_, i) => (
          <span key={`lead-${i}`} />
        ))}
        {days.map((entry) => {
          const key = dayKey(entry.day);
          const number = <span className={cn("text-xs tabular-nums", key > today && "text-muted-foreground")}>{entry.day.getDate()}</span>;
          if (entry.decks.length === 0) {
            return (
              <span key={key} className="grid justify-items-center" title={date.format(entry.day)}>
                {key === today ? <DayStickers deckIds={[]} decks={decks} /> : <span className="block size-7.5" />}
                {number}
              </span>
            );
          }
          return (
            <button
              key={key}
              type="button"
              aria-pressed={picked === key}
              aria-label={words(entry)}
              title={words(entry)}
              onClick={() => setPicked(picked === key ? null : key)}
              className="grid cursor-pointer justify-items-center rounded-md transition-colors hover:bg-muted aria-pressed:bg-muted"
            >
              <DayStickers deckIds={entry.decks} decks={decks} />
              {number}
            </button>
          );
        })}
      </div>
      <div className={cn(looks.spread, "mt-2 gap-2")}>
        <Button variant="ghost" size="icon" aria-label={t("stats.earlier")} title={t("stats.earlier")} disabled={back >= earliest} onClick={() => step(1)}>
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2.5} aria-hidden="true" />
        </Button>
        <p className={cn(looks.fine, "text-center")} aria-live="polite">
          {shown ? words(shown) : studied > 0 ? t("stats.pickADay") : t("stats.noDays")}
        </p>
        <Button variant="ghost" size="icon" aria-label={t("stats.later")} title={t("stats.later")} disabled={back === 0} onClick={() => step(-1)}>
          <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2.5} aria-hidden="true" />
        </Button>
      </div>
    </Sheet>
  );
}

/** Each run's first tries as a bar of right, almost and wrong, oldest first, with the run's deck under it when the runs span decks. */
export function FirstTriesChart({ runs, decks }: { runs: readonly RunRecord[]; decks: readonly Deck[] }) {
  const { t, lang } = useLanguage();
  const shown = [...runs].sort((a, b) => a.completedAt - b.completedAt).slice(-SHOWN_RUNS);
  const counts = shown.map((run) => firstTries(run));
  const top = Math.max(1, ...counts.map((c) => c.correct + c.approximate + c.wrong));
  const deckIds = [...new Set(shown.map((run) => run.deckId))];
  const byId = new Map(decks.map((deck) => [deck.id, deck]));
  const many = deckIds.length > 1;
  const date = new Intl.DateTimeFormat(lang, { month: "short", day: "numeric" });
  const words = (c: (typeof counts)[number]) =>
    stack.map(({ result, count }) => t(count).replace("{n}", String(c[result]))).join(", ");

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className={looks.sectionTitle}>{t("stats.firstTries")}</h2>
        {runs.length > SHOWN_RUNS && <span className={looks.fineFigure}>{t("stats.lastRuns").replace("{n}", String(SHOWN_RUNS))}</span>}
      </div>
      <div className="mt-1 grid grid-cols-[auto_1fr] gap-1.5">
        <div className="flex h-24 flex-col justify-between text-right text-xs text-muted-foreground tabular-nums" aria-hidden="true">
          <span>{top}</span>
          <span>{Math.round(top / 2)}</span>
          <span>0</span>
        </div>
        <div className="grid auto-cols-fr grid-flow-col gap-0.75">
          {shown.map((run, i) => (
            <div key={run.id} className="flex flex-col items-center gap-0.75">
              <div className="flex h-24 w-full flex-col-reverse" title={`${date.format(run.completedAt)}: ${words(counts[i])}`}>
                {stack.map(({ result, bar }) => (
                  <span key={result} className={bar} style={{ height: `${(counts[i][result] / top) * 100}%` }} />
                ))}
              </div>
              <span className="sr-only">
                {date.format(run.completedAt)}, {byId.get(run.deckId)?.title}: {words(counts[i])}
              </span>
              {many && <ChartDot deck={byId.get(run.deckId)} />}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3.5 gap-y-1 text-xs">
        {stack.map(({ result }) => (
          <span key={result} className={cn(looks.marked, gradeLooks[result].text)}>
            <GradeMark result={result} className="h-2.5 w-3 stroke-[3.6]" />
            {t(gradeWords[result])}
          </span>
        ))}
        {many &&
          deckIds.map((id) => (
            <span key={id} className="inline-flex items-center gap-1.5 text-muted-foreground">
              <ChartDot deck={byId.get(id)} />
              {byId.get(id)?.title}
            </span>
          ))}
      </div>
    </div>
  );
}
