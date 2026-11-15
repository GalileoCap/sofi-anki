import type { AnswerResult, Deck } from "@/core/model";
import type { TranslationKey } from "@/lib/translations";

/** A deck's colour as the `--deck` variable its parts paint with, and a quiet ink for a deck without one. */
export const deckColour = (deck: Pick<Deck, "color"> | undefined) => ({ ["--deck" as string]: deck?.color ?? "var(--muted-foreground)" });

/** Each grade's word. */
export const gradeWords: Record<AnswerResult, TranslationKey> = {
  wrong: "common.wrong",
  approximate: "common.approximate",
  correct: "common.correct",
};

/** Each grade's colour, as text and as a chip. */
export const gradeLooks: Record<AnswerResult, { text: string; chip: string }> = {
  wrong: { text: "text-negative", chip: "bg-negative-soft text-negative" },
  approximate: { text: "text-caution", chip: "bg-caution-soft text-caution" },
  correct: { text: "text-positive", chip: "bg-positive-soft text-positive" },
};

/** A grade's mark at the size of the text beside it. */
export const smallMark = "h-3 w-3.5 stroke-[3.6]";
