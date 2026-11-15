import { useState } from "react";

import { ComplexityBadge } from "@/components/complexity-badge";
import { Markdown } from "@/components/markdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent, Card as UiCard } from "@/components/ui/card";
import { Kbd } from "@/components/ui/kbd";
import { useLanguage } from "@/contexts/language-context";
import type { AnswerResult, Card } from "@/core/model";
import { gradeChoice } from "@/core/run";
import { useKeys } from "@/hooks/use-keys";
import { looks } from "@/lib/looks";
import type { TranslationKey } from "@/lib/translations";
import { cn } from "@/lib/utils";

const grades: { result: AnswerResult; label: TranslationKey; key: string; className: string }[] = [
  {
    result: "wrong",
    label: "common.wrong",
    key: "1",
    className:
      "border-red-300 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900",
  },
  {
    result: "approximate",
    label: "common.approximate",
    key: "2",
    className:
      "border-yellow-300 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-400 dark:hover:bg-yellow-900",
  },
  {
    result: "correct",
    label: "common.correct",
    key: "3",
    className:
      "border-green-300 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-800 dark:bg-green-950 dark:text-green-400 dark:hover:bg-green-900",
  },
];

type StudyCardProps = {
  card: Card;
  /** While the run is paused the card stays as it is and takes no keys. */
  paused: boolean;
  onSkip: () => void;
  onPostpone: () => void;
  onAnswer: (result: AnswerResult, redoLater: boolean, selectedOptionIds?: readonly string[]) => void;
};

/** One card of a run: its question, then its answer and the grade given. */
export function StudyCard({ card, paused, onSkip, onPostpone, onAnswer }: StudyCardProps) {
  const { t } = useLanguage();
  const [revealed, setRevealed] = useState(false);
  const [complexityShown, setComplexityShown] = useState(false);
  const [hintShown, setHintShown] = useState(false);
  const [grade, setGrade] = useState<AnswerResult | null>(null);
  const [redoLater, setRedoLater] = useState(false);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());

  /** A grade short of correct asks for the card again later in the run. */
  function pickGrade(result: AnswerResult) {
    setGrade(result);
    if (result !== "correct") setRedoLater(true);
  }

  /** A choice card is graded by the options picked, a standard card by whoever studies it. */
  function reveal() {
    if (card.type === "choice") {
      if (selected.size === 0) return;
      pickGrade(gradeChoice(card, selected));
    }
    setRevealed(true);
    setComplexityShown(true);
  }

  function pick(optionId: string) {
    if (revealed || card.type !== "choice") return;
    const next = new Set(card.multiSelect ? selected : []);
    if (!next.delete(optionId)) next.add(optionId);
    setSelected(next);
  }

  function next() {
    if (grade !== null) onAnswer(grade, redoLater, card.type === "choice" ? [...selected] : undefined);
  }

  useKeys((event) => {
    if (paused) return;
    const confirm = event.key === " " || event.key === "Enter";
    if (confirm) event.preventDefault();
    if (!revealed) {
      if (confirm) reveal();
      else if (event.key === "s") onSkip();
      else if (event.key === "l") onPostpone();
      else if (event.key === "c") setComplexityShown(true);
      else if (event.key === "h" && card.hint) setHintShown(!hintShown);
      return;
    }
    const graded = grades.find((g) => g.key === event.key);
    if (graded) pickGrade(graded.result);
    else if (event.key === "r") setRedoLater(!redoLater);
    else if (confirm) next();
  });

  const face = (below: React.ReactNode, className: string) => (
    <UiCard className={className}>
      <CardContent className="flex flex-col items-center gap-6 text-center">
        <Markdown className="text-2xl font-medium text-foreground">{card.title}</Markdown>
        {complexityShown ? (
          <ComplexityBadge complexity={card.complexity} />
        ) : (
          <Badge
            variant="outline"
            className="cursor-pointer bg-muted/50 text-muted-foreground hover:bg-muted"
            onClick={() => setComplexityShown(true)}
          >
            {t("deckDetail.showComplexity")}
            <Shortcut>C</Shortcut>
          </Badge>
        )}
        {card.type === "choice" && (
          <ChoiceOptions card={card} selected={selected} revealed={revealed} onPick={pick} />
        )}
        {below}
      </CardContent>
    </UiCard>
  );

  const question = !revealed && (
    <div className="flex w-full flex-col items-center gap-3">
      {card.hint &&
        (hintShown ? (
          <div className={cn(looks.hint, "w-full")}>
            <Markdown>{card.hint}</Markdown>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setHintShown(true)}
            className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            {t("studyCard.showHint")}
            <Shortcut>H</Shortcut>
          </button>
        ))}
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={reveal} disabled={card.type === "choice" && selected.size === 0}>
          {card.type === "choice" ? t("studyCard.submitReveal") : t("studyCard.revealAnswer")}
          <Shortcut>Space</Shortcut>
        </Button>
        <Button variant="outline" onClick={onSkip}>
          {t("common.skip")}
          <Shortcut>S</Shortcut>
        </Button>
        <Button variant="secondary" onClick={onPostpone}>
          {t("studyCard.saveForLater")}
          <Shortcut>L</Shortcut>
        </Button>
      </div>
    </div>
  );

  const answer = revealed && (
    <>
      {card.type === "standard" && (
        <div className="w-full rounded-lg bg-muted/50 p-4 text-lg text-muted-foreground">
          <Markdown>{card.response}</Markdown>
        </div>
      )}
      <div className="flex w-full flex-col items-center gap-4">
        <div className="flex w-full flex-col gap-1.5">
          <p className={looks.muted}>{card.type === "choice" ? t("studyCard.autoGraded") : t("studyCard.howDidYouDo")}</p>
          <div className="flex justify-center gap-2">
            {grades.map((g) => (
              <button
                key={g.result}
                type="button"
                onClick={() => pickGrade(g.result)}
                className={cn(
                  "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                  g.className,
                  grade === g.result && "ring-2 ring-ring ring-offset-2",
                )}
              >
                {t(g.label)}
                <Shortcut>{g.key}</Shortcut>
              </button>
            ))}
          </div>
        </div>
        <label className={cn(looks.muted, "flex cursor-pointer items-center gap-2")}>
          <input type="checkbox" checked={redoLater} onChange={(e) => setRedoLater(e.target.checked)} className="rounded" />
          {t("studyCard.redoLater")}
          <Shortcut>R</Shortcut>
        </label>
        <Button onClick={next} disabled={grade === null} className="w-full max-w-xs">
          {t("common.next")}
          <Shortcut>Enter</Shortcut>
        </Button>
      </div>
    </>
  );

  return (
    <div className="card-flip-container mx-auto w-full">
      <div className={cn("card-flip-inner", revealed && "flipped")}>
        {face(question, "card-flip-front")}
        {face(answer, "card-flip-back")}
      </div>
    </div>
  );
}

/** A key that does the same as the button it sits in, shown on wide screens. */
export function Shortcut({ children }: { children: React.ReactNode }) {
  return <Kbd className="ml-1 hidden sm:inline-flex">{children}</Kbd>;
}

type ChoiceOptionsProps = {
  card: Extract<Card, { type: "choice" }>;
  selected: ReadonlySet<string>;
  revealed: boolean;
  onPick: (optionId: string) => void;
};

/** A choice card's options, marked right and wrong once revealed. */
function ChoiceOptions({ card, selected, revealed, onPick }: ChoiceOptionsProps) {
  const { t } = useLanguage();
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-center justify-center gap-2">
        <Badge variant="outline" className="text-xs">
          {card.multiSelect ? t("studyCard.multiSelect") : t("studyCard.singleSelect")}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {card.multiSelect ? t("studyCard.checkAllCorrect") : t("studyCard.pickOne")}
        </span>
      </div>
      {card.options.map((option) => {
        const picked = selected.has(option.id);
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onPick(option.id)}
            disabled={revealed}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg border px-4 py-2.5 text-left text-sm transition-all",
              !revealed && (picked ? "border-foreground/30 bg-foreground/5 ring-1 ring-ring" : "border-border hover:bg-muted/50"),
              revealed && option.correct && "border-green-400 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-950 dark:text-green-300",
              revealed && picked && !option.correct && "border-red-400 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-950 dark:text-red-300",
              revealed && "cursor-default",
            )}
          >
            <span
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center border",
                card.multiSelect ? "rounded" : "rounded-full",
                picked ? "border-foreground bg-foreground text-background" : "border-muted-foreground/40",
              )}
            >
              {picked &&
                (card.multiSelect ? (
                  <span className="text-[10px] leading-none">✓</span>
                ) : (
                  <span className="block h-2 w-2 rounded-full bg-background" />
                ))}
            </span>
            <Markdown inline>{option.text}</Markdown>
          </button>
        );
      })}
    </div>
  );
}
