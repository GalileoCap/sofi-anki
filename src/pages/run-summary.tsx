import { Markdown } from "@/components/markdown";
import { GradeChip, Sheet } from "@/components/sticker";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import type { CardRunResult, Deck } from "@/core/model";
import { type RunItem, byFirstTry, isPerfect } from "@/core/run";
import { scheduleKey } from "@/core/scheduler";
import { clockFace } from "@/core/time";
import { looks } from "@/lib/ui-looks";
import { cn } from "@/lib/utils";

/** The parts of the first-tries bar, in order, each with its colour. */
const parts = [
  { disposition: "correct", label: "runEnd.right", bar: "bg-positive", text: "text-positive" },
  { disposition: "approximate", label: "runEnd.almost", bar: "bg-caution", text: "text-caution" },
  { disposition: "wrong", label: "runEnd.wrong", bar: "bg-negative", text: "text-negative" },
  { disposition: "skip", label: "runEnd.skipped", bar: "bg-border", text: "text-muted-foreground" },
] as const;

type RunSummaryProps = {
  /** The run's results, each card under its key in the run. */
  results: readonly CardRunResult[];
  items: readonly RunItem[];
  decks: readonly Deck[];
  totalTimeMs: number;
  onRestart: (items: RunItem[]) => void;
  onExit: () => void;
};

/** The end of a run: how many cards, how the first tries went, and the cards to look at again. */
export function RunSummary({ results, items, decks, totalTimeMs, onRestart, onExit }: RunSummaryProps) {
  const { t, tp } = useLanguage();
  const grouped = byFirstTry(results);
  const count = (disposition: (typeof parts)[number]["disposition"]) => grouped.get(disposition)?.length ?? 0;
  const again = [...(grouped.get("wrong") ?? []), ...(grouped.get("approximate") ?? [])];
  const itemOf = new Map(items.map((item) => [scheduleKey(item.deckId, item.card.id), item]));
  const studiedDecks = [...new Set(results.flatMap((result) => itemOf.get(result.card.id)?.deckId ?? []))];
  const from =
    studiedDecks.length === 1
      ? (decks.find((deck) => deck.id === studiedDecks[0])?.title ?? "")
      : t("runEnd.decks").replace("{n}", String(studiedDecks.length));
  const shown = parts.filter((part) => count(part.disposition) > 0);

  return (
    <div className={looks.narrow}>
      <div className={cn(looks.topbar, "justify-end")}>
        <Button variant="ghost" className="-mr-3" onClick={onExit}>
          {t("common.close")}
        </Button>
      </div>
      <div>
        <h1 className={looks.title}>
          {results.length} {tp(results.length, "runEnd.cardStudied", "runEnd.cardsStudied")}
        </h1>
        <p className={looks.muted}>
          {t("runEnd.fromIn").replace("{from}", from).replace("{time}", clockFace(totalTimeMs))}
          {isPerfect(results) && ` ${t("runEnd.perfect")}`}
        </p>
      </div>

      {shown.length > 0 && (
        <Sheet label={t("runEnd.firstTries")} value="">
          <div className="flex h-3.5 gap-0.5 overflow-hidden rounded-full">
            {shown.map((part) => (
              <span key={part.disposition} className={part.bar} style={{ flexGrow: count(part.disposition) }} />
            ))}
          </div>
          <p className="mt-2 text-sm">
            {shown.map((part, i) => (
              <span key={part.disposition}>
                {i > 0 && ", "}
                <span className={cn(looks.value, part.text)}>{t(part.label).replace("{n}", String(count(part.disposition)))}</span>
              </span>
            ))}
          </p>
        </Sheet>
      )}

      {again.length > 0 && (
        <div>
          <h2 className={looks.sectionTitle}>{t("runEnd.lookAgain")}</h2>
          <div className={looks.list}>
            {again.map(({ card, attempts }) => (
              <div key={card.id} className={looks.listRow}>
                <Markdown inline className="min-w-0">
                  {card.title}
                </Markdown>
                {(attempts[0]?.result === "wrong" || attempts[0]?.result === "approximate") && <GradeChip result={attempts[0].result} />}
              </div>
            ))}
          </div>
        </div>
      )}

      {again.length > 0 ? (
        <Button size="lg" className="w-full" onClick={() => onRestart(again.flatMap((result) => itemOf.get(result.card.id) ?? []))}>
          {t("runEnd.studyAgain").replace("{n}", String(again.length))}
        </Button>
      ) : (
        <Button size="lg" className="w-full" onClick={onExit}>
          {t("runEnd.backToToday")}
        </Button>
      )}
    </div>
  );
}
