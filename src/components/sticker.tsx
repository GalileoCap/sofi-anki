import type { ReactNode } from "react";

import { Kbd } from "@/components/ui/kbd";
import { useLanguage } from "@/contexts/language-context";
import type { AnswerResult, Deck } from "@/core/model";
import { deckColour, gradeLooks, gradeWords } from "@/lib/sticker-looks";
import { looks } from "@/lib/ui-looks";
import { cn } from "@/lib/utils";

/*
 * The parts of the sticker chart (A12) that every screen shares, each drawn once: a deck's
 * notebook row and its stickers, the sheet's spots, a grade's mark, and the key hint.
 */

const markPaths: Record<AnswerResult, string[]> = {
  wrong: ["M7 5 L23 21 M23 5 L7 21"],
  approximate: ["M4 14 L11 21 L21 6", "M12 8 L19 17"],
  correct: ["M4 14 L11 21 L26 4"],
};

/** A teacher's mark for a grade: a cross, a half tick, a tick. Its shape carries the grade without its colour. */
export function GradeMark({ result, className }: { result: AnswerResult; className?: string }) {
  return (
    <svg viewBox="0 0 30 26" aria-hidden="true" className={cn("fill-none stroke-current stroke-[3.2] [stroke-linecap:round] [stroke-linejoin:round]", className)}>
      {markPaths[result].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

/** A grade as a chip: its mark and its word. */
export function GradeChip({ result }: { result: AnswerResult }) {
  const { t } = useLanguage();
  const look = gradeLooks[result];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap", look.chip)}>
      <GradeMark result={result} className="h-3 w-3.5 stroke-[3.6]" />
      {t(gradeWords[result])}
    </span>
  );
}

/** A chip for a count or a date: solid ink when it asks for study, quiet otherwise. */
export function Chip({ urgent, children }: { urgent?: boolean; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap",
        urgent ? looks.ink : "bg-muted text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

/** A deck's emoji as a round sticker in the deck's colour, or the colour alone. */
export function EmojiSticker({ deck, large }: { deck: Deck; large?: boolean }) {
  return (
    <span
      style={deckColour(deck)}
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center rounded-full border-[2.5px] border-card bg-(--deck) shadow-sm",
        large ? "size-12 text-emoji" : "size-8 text-sm",
      )}
    >
      {deck.emoji}
    </span>
  );
}

/** One sticker: a dot in its deck's colour, named by the deck. */
export function Sticker({ deck, className }: { deck: Deck | undefined; className?: string }) {
  return (
    <i
      role="img"
      aria-label={deck?.title}
      title={deck?.title}
      style={deckColour(deck)}
      className={cn("block aspect-square rounded-full border-[2.5px] border-card bg-(--deck) shadow-sm", className)}
    />
  );
}

type SheetProps = { label: string; value: ReactNode; met?: boolean; children: ReactNode };

/** A sheet of stickers: a dashed edge that turns solid green when the goal is met, a quiet label and its value. */
export function Sheet({ label, value, met, children }: SheetProps) {
  return (
    <div className={cn("rounded-xl border-2 bg-card px-4 py-3.5", met ? "border-solid border-positive" : "border-dashed border-border")}>
      <div className="mb-2.5 flex justify-between text-sm">
        <span className="font-medium text-muted-foreground">{label}</span>
        <span className={cn("font-extrabold tabular-nums", met && "text-positive")}>{value}</span>
      </div>
      {children}
    </div>
  );
}

/** An empty place for a sticker. */
export const Spot = ({ className }: { className?: string }) => (
  <i aria-hidden="true" className={cn("block aspect-square rounded-full border-2 border-dotted border-border", className)} />
);

/** The day's goal as a row of spots, the first filled with the stickers of the cards studied, in order. */
export function Spots({ stickers, goal, decks }: { stickers: readonly string[]; goal: number; decks: readonly Deck[] }) {
  const byId = new Map(decks.map((deck) => [deck.id, deck]));
  const shown = stickers.slice(0, goal);
  return (
    <div className="grid grid-cols-20 gap-1">
      {shown.map((deckId, i) => (
        <Sticker key={i} deck={byId.get(deckId)} />
      ))}
      {Array.from({ length: Math.max(0, goal - shown.length) }, (_, i) => (
        <Spot key={`spot-${i}`} />
      ))}
    </div>
  );
}

/** Up to two of a day's decks as overlapping stickers, or an empty spot for a day with none. */
export function DayStickers({ deckIds, decks }: { deckIds: readonly string[]; decks: readonly Deck[] }) {
  if (deckIds.length === 0) return <Spot className="m-0.5 size-6.5" />;
  const byId = new Map(decks.map((deck) => [deck.id, deck]));
  const [first, second] = deckIds;
  return (
    <span className="relative block size-7.5">
      {second === undefined ? (
        <Sticker deck={byId.get(first)} className="absolute inset-0.75" />
      ) : (
        <>
          <Sticker deck={byId.get(first)} className="absolute top-0 left-0 w-6" />
          <Sticker deck={byId.get(second)} className="absolute right-0 bottom-0 w-6" />
        </>
      )}
    </span>
  );
}

type DeckRowProps = {
  deck: Deck;
  /** The quiet line under the title. */
  meta: ReactNode;
  /** What sits at the row's end: a chip or a figure. */
  end?: ReactNode;
  onOpen?: () => void;
  /** The top of the deck's own page: larger, and not a button. */
  head?: boolean;
};

/** A deck as a notebook: its spine in the deck's colour, its emoji as a sticker, its title. */
export function DeckRow({ deck, meta, end, onOpen, head }: DeckRowProps) {
  const body = (
    <>
      <EmojiSticker deck={deck} large={head} />
      <span className="flex min-w-0 flex-col leading-snug">
        {head ? <h1 className="text-lg font-extrabold">{deck.title}</h1> : <span className="truncate text-sm font-bold">{deck.title}</span>}
        <span className={looks.fine}>{meta}</span>
      </span>
      {end}
    </>
  );
  const look = cn(
    "grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-l-md rounded-r-md border-l-10 border-(--deck) bg-card text-left text-foreground",
    head ? "min-h-22 py-3 pr-4 pl-3.5" : "min-h-16 py-2 pr-3.5 pl-3",
  );
  if (onOpen === undefined) {
    return (
      <div style={deckColour(deck)} className={look}>
        {body}
      </div>
    );
  }
  return (
    <button type="button" onClick={onOpen} style={deckColour(deck)} className={cn(look, "w-full cursor-pointer transition-colors hover:bg-muted")}>
      {body}
    </button>
  );
}

/** A key that does the same as what it sits beside, shown where there is a keyboard. */
export function Key({ children }: { children: ReactNode }) {
  return <Kbd className="ml-1 hidden h-auto rounded-sm border-[1.5px] border-current bg-transparent px-1 text-xs text-inherit sm:inline-flex">{children}</Kbd>;
}

/** When a card comes back, in days from today: late, today, tomorrow, or in some days. */
export function ComesBack({ days }: { days: number }) {
  const { t } = useLanguage();
  const text =
    days === -1
      ? t("comes.lateOne")
      : days < 0
        ? t("comes.late").replace("{n}", String(-days))
        : days === 0
          ? t("comes.today")
          : days === 1
            ? t("comes.tomorrow")
            : t("comes.inDays").replace("{n}", String(days));
  return <Chip urgent={days <= 0}>{text}</Chip>;
}
