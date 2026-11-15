import { Cancel01Icon } from "@hugeicons/core-free-icons";

import { Fold } from "@/components/fold";
import { Markdown } from "@/components/markdown";
import { GradeMark, Sheet } from "@/components/sticker";
import { StickerShower } from "@/components/sticker-shower";
import { Icon } from "@/components/icon-button";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import type { AnswerResult, CardAttempt, CardDisposition, CardRunResult, Deck } from "@/core/model";
import { type RunItem, byFirstTry, isPerfect } from "@/core/run";
import { scheduleKey } from "@/core/scheduler";
import { shortDuration } from "@/core/time";
import { gradeLooks, kindWords, markSlot, smallMark } from "@/lib/sticker-looks";
import type { TranslationKey } from "@/lib/translations";
import { looks } from "@/lib/ui-looks";
import { cn } from "@/lib/utils";

type Outcome = { disposition: CardDisposition; count: TranslationKey; heading: TranslationKey; bar: string; text: string; grade?: AnswerResult };

/** What a card's first try came to, the misses first, each with its words and colours. */
const outcomes: readonly Outcome[] = [
  { disposition: "wrong", count: "runEnd.wrong", heading: "common.wrong", bar: "bg-negative", text: "text-negative", grade: "wrong" },
  { disposition: "approximate", count: "runEnd.almost", heading: "common.approximate", bar: "bg-caution", text: "text-caution", grade: "approximate" },
  { disposition: "correct", count: "runEnd.right", heading: "common.correct", bar: "bg-positive", text: "text-positive", grade: "correct" },
  { disposition: "skip", count: "runEnd.skipped", heading: "common.skipped", bar: "bg-border", text: "text-muted-foreground" },
  { disposition: "save_for_later", count: "runEnd.saved", heading: "deckStats.later", bar: "bg-muted-foreground", text: "text-muted-foreground" },
];

/** The outcomes whose cards are listed open: those to look at again. */
const openOutcomes: ReadonlySet<CardDisposition> = new Set(["wrong", "approximate"]);

type RunSummaryProps = {
  /** The run's results, each card under its key in the run. */
  results: readonly CardRunResult[];
  items: readonly RunItem[];
  decks: readonly Deck[];
  totalTimeMs: number;
  onRestart: (items: RunItem[]) => void;
  onExit: () => void;
};

/** The end of a run: how many cards, how the first tries went, and every card under how it went. */
export function RunSummary({ results, items, decks, totalTimeMs, onRestart, onExit }: RunSummaryProps) {
  const { t, tp } = useLanguage();
  const grouped = byFirstTry(results);
  const count = (disposition: CardDisposition) => grouped.get(disposition)?.length ?? 0;
  const again = [...(grouped.get("wrong") ?? []), ...(grouped.get("approximate") ?? [])];
  const itemOf = new Map(items.map((item) => [scheduleKey(item.deckId, item.card.id), item]));
  const itemsOf = (some: readonly CardRunResult[]) => some.flatMap((result) => itemOf.get(result.card.id) ?? []);
  const studiedDecks = decks.filter((deck) => results.some((result) => itemOf.get(result.card.id)?.deckId === deck.id));
  const from = studiedDecks.length === 1 ? studiedDecks[0].title : t("runEnd.decks").replace("{n}", String(studiedDecks.length));
  const shown = outcomes.filter((outcome) => count(outcome.disposition) > 0);
  const perfect = isPerfect(results);

  return (
    <div className={looks.narrow}>
      {perfect && <StickerShower decks={studiedDecks} />}
      <div className={cn(looks.topbar, "justify-end")}>
        <Button variant="ghost" onClick={onExit}>
          <Icon icon={Cancel01Icon} />
          {t("common.close")}
        </Button>
      </div>
      <div>
        <h1 className={looks.title}>
          {results.length} {tp(results.length, "runEnd.cardStudied", "runEnd.cardsStudied")}
        </h1>
        <p className={looks.muted}>
          {t("runEnd.fromIn").replace("{from}", from).replace("{time}", shortDuration(totalTimeMs))}
          {perfect && ` ${t("runEnd.perfect")}`}
        </p>
      </div>

      {shown.length > 0 && (
        <Sheet label={t("runEnd.firstTries")} value="">
          <div className="flex h-3.5 gap-0.5 overflow-hidden rounded-full">
            {shown.map((outcome) => (
              <span key={outcome.disposition} className={outcome.bar} style={{ flexGrow: count(outcome.disposition) }} />
            ))}
          </div>
          <p className="mt-2 text-sm">
            {shown.map((outcome, i) => (
              <span key={outcome.disposition}>
                {i > 0 && ", "}
                <span className={cn(looks.value, outcome.text)}>{t(outcome.count).replace("{n}", String(count(outcome.disposition)))}</span>
              </span>
            ))}
          </p>
        </Sheet>
      )}

      {shown.map((outcome) => (
        <Fold
          key={outcome.disposition}
          open={openOutcomes.has(outcome.disposition)}
          summary={
            <h2 className={cn("inline-flex items-center gap-2 text-lg font-bold", outcome.text)}>
              {outcome.grade && <GradeMark result={outcome.grade} className="h-4 w-5" />}
              {t(outcome.heading)}
              <span className={looks.figure}>{count(outcome.disposition)}</span>
            </h2>
          }
        >
          <div className={looks.list}>
            {(grouped.get(outcome.disposition) ?? []).map((result) => (
              <ResultRow key={result.card.id} result={result} />
            ))}
          </div>
        </Fold>
      ))}

      <div className={looks.column}>
        {again.length > 0 ? (
          <Button size="lg" className="w-full" onClick={() => onRestart(itemsOf(again))}>
            {t("runEnd.studyAgain").replace("{n}", String(again.length))}
          </Button>
        ) : (
          <Button size="lg" className="w-full" onClick={onExit}>
            {t("runEnd.backToToday")}
          </Button>
        )}
        <Button variant="outline" size="lg" className="w-full" onClick={() => onRestart(itemsOf(results))}>
          {t("runEnd.studyAll").replace("{n}", String(results.length))}
        </Button>
      </div>
    </div>
  );
}

const attemptWords: Record<CardAttempt["result"], TranslationKey> = {
  correct: "common.correct",
  approximate: "common.approximate",
  wrong: "common.wrong",
  skip: "common.skipped",
  save_for_later: "deckStats.later",
};

/** A card of the run: its question, its kind and first try's time, opening to each try and, for a choice card, its picks. */
function ResultRow({ result }: { result: CardRunResult }) {
  const { t } = useLanguage();
  const { card, attempts } = result;
  const meta = [
    ...kindWords(card, t),
    t("runEnd.firstTry").replace("{time}", shortDuration(attempts[0]?.durationMs ?? 0)),
    ...(attempts.length > 1 ? [t("runEnd.tries").replace("{n}", String(attempts.length))] : []),
  ].join(", ");
  const head = (
    <span className={looks.titled}>
      <Markdown inline className="min-w-0">
        {card.title}
      </Markdown>
      <span className={looks.fine}>{meta}</span>
    </span>
  );
  if (attempts.length < 2 && card.type !== "choice") return <div className={cn(looks.listRow, "pl-6")}>{head}</div>;
  return (
    <Fold summary={head} className={looks.foldRow}>
      <ol className="mt-1 mb-2 flex flex-col gap-2 pl-6">
        {attempts.map((attempt, i) => (
          <li key={i} className={looks.tight}>
            <span className={looks.row}>
              <span className={looks.fine}>{t("runEnd.try").replace("{n}", String(i + 1))}</span>
              <span className={cn("font-bold", attempt.result in gradeLooks && gradeLooks[attempt.result as AnswerResult].text)}>
                {t(attemptWords[attempt.result])}
              </span>
              <span className={looks.fineFigure}>{shortDuration(attempt.durationMs)}</span>
            </span>
            {card.type === "choice" && <Picks card={card} attempt={attempt} />}
          </li>
        ))}
      </ol>
    </Fold>
  );
}

/** A choice card's options against what one try picked: right picks, wrong picks, and right options missed. */
function Picks({ card, attempt }: { card: Extract<CardRunResult["card"], { type: "choice" }>; attempt: CardAttempt }) {
  const { t } = useLanguage();
  if (!attempt.selectedOptionIds) return null;
  const picked = new Set(attempt.selectedOptionIds);
  return (
    <ul className="flex flex-col gap-1 text-sm">
      {card.options.map((option) => {
        const chosen = picked.has(option.id);
        const mark: AnswerResult | null = chosen ? (option.correct ? "correct" : "wrong") : option.correct ? "approximate" : null;
        const words = chosen ? (option.correct ? "runEnd.picked" : "runEnd.wrongPick") : option.correct ? "runEnd.missed" : "runEnd.notPicked";
        return (
          <li key={option.id} className={cn(looks.row, mark === null && "text-muted-foreground")}>
            <span className={markSlot}>{mark && <GradeMark result={mark} className={cn(smallMark, gradeLooks[mark].text)} />}</span>
            <Markdown inline className="min-w-0">
              {option.text}
            </Markdown>
            <span className={cn(looks.fineAside, "ml-auto", mark && gradeLooks[mark].text)}>{t(words)}</span>
          </li>
        );
      })}
    </ul>
  );
}
