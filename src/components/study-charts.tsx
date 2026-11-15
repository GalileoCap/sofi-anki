import { DayStickers, GradeMark, Sheet, Sticker } from "@/components/sticker";
import { useLanguage } from "@/contexts/language-context";
import type { AnswerResult, Deck, Millis, RunRecord } from "@/core/model";
import { dayKey, firstTries, monthDays } from "@/core/stats";
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

/** The month of `now` as a calendar of stickers: each day keeps its number, a day studied shows its decks, today an empty spot. */
export function MonthSheet({ runs, decks, now }: { runs: readonly RunRecord[]; decks: readonly Deck[]; now: Millis }) {
  const { tp, lang } = useLanguage();
  const days = monthDays(runs, now);
  const studied = days.filter((day) => day.decks.length > 0).length;
  const lead = (days[0].day.getDay() + 6) % 7;
  const monday = new Date(days[0].day.getFullYear(), days[0].day.getMonth(), days[0].day.getDate() - lead);
  const weekday = new Intl.DateTimeFormat(lang, { weekday: "narrow" });
  const month = new Intl.DateTimeFormat(lang, { month: "long" }).format(now);
  const date = new Intl.DateTimeFormat(lang, { month: "long", day: "numeric" });
  const today = dayKey(now);

  return (
    <Sheet label={month.charAt(0).toUpperCase() + month.slice(1)} value={`${studied} ${tp(studied, "stats.dayStudied", "stats.daysStudied")}`}>
      <div className="grid grid-cols-7 gap-x-0.5 gap-y-1.5 text-center">
        {Array.from({ length: 7 }, (_, i) => (
          <span key={`name-${i}`} className={looks.fine} aria-hidden="true">
            {weekday.format(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i))}
          </span>
        ))}
        {Array.from({ length: lead }, (_, i) => (
          <span key={`lead-${i}`} />
        ))}
        {days.map(({ day, decks: deckIds }) => {
          const key = dayKey(day);
          return (
            <span key={key} className="grid justify-items-center" title={date.format(day)}>
              {deckIds.length > 0 || key === today ? <DayStickers deckIds={deckIds} decks={decks} /> : <span className="block size-7.5" />}
              <span className={cn("text-xs tabular-nums", key > today && "text-muted-foreground")}>{day.getDate()}</span>
            </span>
          );
        })}
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
          <span key={result} className={cn("inline-flex items-center gap-1 font-bold", gradeLooks[result].text)}>
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
