import { useState } from "react";

import { Markdown } from "@/components/markdown";
import { CardFace, UnderRule } from "@/components/card-face";
import { GradeMark, Key, Segmented } from "@/components/sticker";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import type { AnswerResult, Card, CardSchedule, Deck, Millis } from "@/core/model";
import { gradeChoice } from "@/core/run";
import { intervalAfter } from "@/core/scheduler";
import { useKeys } from "@/hooks/use-keys";
import { gradeLooks, gradeWords } from "@/lib/sticker-looks";
import { looks } from "@/lib/ui-looks";
import { cn } from "@/lib/utils";

/** The three grades in the order of their keys. */
const grades: readonly AnswerResult[] = ["wrong", "approximate", "correct"];

type StudyCardProps = {
  card: Card;
  deck: Deck | undefined;
  /** The card's schedule before this answer, which says where each grade sends it. */
  schedule: CardSchedule | undefined;
  now: Millis;
  /** While the run is paused the card stays as it is and takes no keys. */
  paused: boolean;
  onAnswer: (result: AnswerResult, redoLater: boolean, selectedOptionIds?: readonly string[]) => void;
};

/** Whether a graded card is asked again in this run: when its grade is short of right, always, or never. */
type AskAgain = "missed" | "yes" | "no";
const askAgainOrder: readonly AskAgain[] = ["missed", "yes", "no"];

/** One card of a run: the question, then the answer under it and three stamps that grade it and move on. */
export function StudyCard({ card, deck, schedule, now, paused, onAnswer }: StudyCardProps) {
  const { t } = useLanguage();
  const [revealed, setRevealed] = useState(false);
  const [hintShown, setHintShown] = useState(false);
  const [difficultyShown, setDifficultyShown] = useState(false);
  const [askAgain, setAskAgain] = useState<AskAgain>("missed");
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  /** A choice card is graded by the options picked; the person may stamp another grade. */
  const suggested = revealed && card.type === "choice" ? gradeChoice(card, selected) : null;

  function reveal() {
    if (card.type === "choice" && selected.size === 0) return;
    setRevealed(true);
  }

  function pick(optionId: string) {
    if (revealed || card.type !== "choice") return;
    const next = new Set(card.multiSelect ? selected : []);
    if (!next.delete(optionId)) next.add(optionId);
    setSelected(next);
  }

  const answer = (result: AnswerResult) =>
    onAnswer(result, askAgain === "yes" || (askAgain === "missed" && result !== "correct"), card.type === "choice" ? [...selected] : undefined);

  useKeys((event) => {
    if (paused) return;
    const confirm = event.key === " " || event.key === "Enter";
    if (confirm) event.preventDefault();
    if (event.key === "c") setDifficultyShown(true);
    if (event.key === "h" && card.hint) setHintShown(!hintShown);
    if (!revealed) {
      if (confirm) reveal();
      return;
    }
    const graded = grades[Number(event.key) - 1];
    if (graded) answer(graded);
    else if (event.key === "r") setAskAgain(askAgainOrder[(askAgainOrder.indexOf(askAgain) + 1) % askAgainOrder.length]);
    else if (confirm && suggested !== null) answer(suggested);
  });

  const goes = (result: AnswerResult) => {
    const days = intervalAfter(schedule, result, now);
    return days === 0 ? t("goes.today") : days === 1 ? t("goes.tomorrow") : t("goes.inDays").replace("{n}", String(days));
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <CardFace
        deck={deck}
        title={card.title}
        corner={(revealed || difficultyShown) && t(`complexity.${card.complexity}`)}
        scrolls
        className="flex-1"
      >
        {card.type === "choice" && <ChoiceOptions card={card} selected={selected} revealed={revealed} onPick={pick} />}
        {revealed && card.type === "standard" && (
          <UnderRule>
            <Markdown>{card.response}</Markdown>
          </UnderRule>
        )}
        {(card.hint || (!revealed && !difficultyShown)) && (
          <div className="mt-auto flex flex-col">
            {card.hint && hintShown && (
              <UnderRule>
                <p>
                  <strong>{t("common.hint")}.</strong> <Markdown inline>{card.hint}</Markdown>
                </p>
              </UnderRule>
            )}
            <div className="-ml-3 flex flex-wrap">
              {card.hint && !hintShown && (
                <Button variant="ghost" className="text-muted-foreground" onClick={() => setHintShown(true)}>
                  {t("study.showHint")}
                  <Key>H</Key>
                </Button>
              )}
              {!revealed && !difficultyShown && (
                <Button variant="ghost" className="text-muted-foreground" onClick={() => setDifficultyShown(true)}>
                  {t("study.showDifficulty")}
                  <Key>C</Key>
                </Button>
              )}
            </div>
          </div>
        )}
      </CardFace>

      {revealed ? (
        <div className={looks.form}>
          <div className="grid grid-cols-3 justify-items-center gap-2.5">
            {grades.map((result, i) => (
              <div key={result} className="grid w-full justify-items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => answer(result)}
                  className={cn(
                    "relative flex aspect-square w-full max-w-26 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-full border-[3px] border-current bg-card px-2 text-sm font-extrabold transition-colors hover:bg-muted focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring",
                    gradeLooks[result].text,
                    suggested === result && "bg-muted outline-3 outline-offset-2 outline-ring",
                  )}
                >
                  <span aria-hidden="true" className="absolute inset-1.25 rounded-full border-[1.5px] border-dashed border-current opacity-60" />
                  <GradeMark result={result} className="h-6 w-7" />
                  {t(gradeWords[result])}
                </button>
                <span className="text-center text-xs text-muted-foreground">
                  {goes(result)}
                  <Key>{i + 1}</Key>
                </span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5">
            <span className={looks.muted}>
              {t("study.askAgain")}
              <Key>R</Key>
            </span>
            <Segmented
              label={t("study.askAgain")}
              options={[
                { value: "missed", label: t("study.againIfMissed") },
                { value: "yes", label: t("study.againYes") },
                { value: "no", label: t("study.againNo") },
              ]}
              value={askAgain}
              onChange={setAskAgain}
            />
          </div>
        </div>
      ) : (
        <Button size="lg" className="w-full" onClick={reveal} disabled={card.type === "choice" && selected.size === 0}>
          {card.type === "choice" ? t("study.check") : t("study.showAnswer")}
          <Key>Space</Key>
        </Button>
      )}
    </div>
  );
}

type ChoiceOptionsProps = {
  card: Extract<Card, { type: "choice" }>;
  selected: ReadonlySet<string>;
  revealed: boolean;
  onPick: (optionId: string) => void;
};

/** A choice card's options; once checked, the right ones are marked right and a wrong pick wrong. */
function ChoiceOptions({ card, selected, revealed, onPick }: ChoiceOptionsProps) {
  const { t } = useLanguage();
  return (
    <div className={looks.column}>
      <p className={looks.muted}>{card.multiSelect ? t("studyCard.checkAllCorrect") : t("studyCard.pickOne")}</p>
      {card.options.map((option) => {
        const picked = selected.has(option.id);
        const mark: AnswerResult | null = !revealed ? null : option.correct ? "correct" : picked ? "wrong" : null;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={picked}
            onClick={() => onPick(option.id)}
            disabled={revealed}
            className={cn(
              "flex min-h-13 w-full items-center gap-3 rounded-md border-2 bg-card px-3.5 py-2 text-left transition-colors",
              picked && !revealed ? "border-primary" : "border-border",
              !revealed && "cursor-pointer hover:bg-muted",
              mark !== null && gradeLooks[mark].text,
            )}
          >
            <span
              aria-hidden="true"
              className={cn("size-5.5 shrink-0 border-2", card.multiSelect ? "rounded-sm" : "rounded-full", picked ? "border-7 border-primary" : "border-border")}
            />
            <Markdown inline>{option.text}</Markdown>
            {mark !== null && (
              <>
                <GradeMark result={mark} className="ml-auto h-4 w-5 shrink-0" />
                <span className="sr-only">{t(gradeWords[mark])}</span>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}
