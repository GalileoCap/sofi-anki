import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { DropdownMenu } from "radix-ui";
import { useState } from "react";

import { CardForm } from "@/components/card-form";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Markdown } from "@/components/markdown";
import { OverflowMenu } from "@/components/overflow-menu";
import { Chip, ComesBack, GradeChip, GradeMark } from "@/components/sticker";
import { useLanguage } from "@/contexts/language-context";
import type { CardDraft } from "@/core/decks";
import type { Card, Deck, Millis } from "@/core/model";
import { MAX_INTERVAL_DAYS, dueTime } from "@/core/scheduler";
import { type CardPerformance, daysUntil } from "@/core/stats";
import { gradeLooks, kindWords, markSlot, smallMark } from "@/lib/sticker-looks";
import { looks } from "@/lib/ui-looks";
import { cn } from "@/lib/utils";

/** The table's columns: the card, its last grade, how often it was right, when it comes back, its menu. A phone keeps the first, the date and the menu. */
const columnsLook = "grid grid-cols-[minmax(0,1fr)_auto_2.75rem] items-center gap-x-3 lg:grid-cols-[minmax(0,1fr)_6rem_3.5rem_7.5rem_2.75rem]";

/** A card's question without the Markdown marks, for its tooltip. */
const plain = (text: string) => text.replace(/[`*_#>]/g, "");

type CardListProps = {
  deck: Deck;
  cards: readonly Card[];
  performance: ReadonlyMap<string, CardPerformance>;
  now: Millis;
  /** The cards shown open, by id. */
  opened: ReadonlySet<string>;
  onToggle: (cardId: string) => void;
  onEdit: (cardId: string, draft: CardDraft) => void;
  onDelete: (cardId: string) => void;
};

/** A deck's cards as a table, drawn as the window scrolls to them, each opening to its answer. */
export function CardList({ deck, cards, performance, now, opened, onToggle, onEdit, onDelete }: CardListProps) {
  // The virtualizer changes inside one object, which the React Compiler would memoize past.
  "use no memo";
  const { t } = useLanguage();
  const [listTop, setListTop] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const editing = cards.find((card) => card.id === editingId);
  const virtualizer = useWindowVirtualizer({ count: cards.length, estimateSize: () => 64, overscan: 5, scrollMargin: listTop });

  return (
    <div>
      <div className={cn(columnsLook, looks.fine, "border-b-[1.5px] border-border pb-1.5")}>
        <span>{t("deck.colCard")}</span>
        <span className={looks.laptopOnly}>{t("deck.colLast")}</span>
        <span className="hidden text-right lg:block">{t("deck.colRight")}</span>
        <span className="text-right">{t("deck.colComesBack")}</span>
        <span />
      </div>
      <div
        ref={(node) => {
          if (node) setListTop(node.offsetTop);
        }}
        className="relative"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualizer.getVirtualItems().map((item) => {
          const card = cards[item.index];
          return (
            <div
              key={item.key}
              data-index={item.index}
              ref={virtualizer.measureElement}
              className="absolute top-0 left-0 w-full border-b-[1.5px] border-border"
              style={{ transform: `translateY(${item.start - virtualizer.options.scrollMargin}px)` }}
            >
              <CardRow
                card={card}
                performance={performance.get(card.id)}
                now={now}
                open={opened.has(card.id)}
                onToggle={() => onToggle(card.id)}
                onEdit={() => setEditingId(card.id)}
                onDelete={() => setDeletingId(card.id)}
              />
            </div>
          );
        })}
      </div>
      {editing && (
        <CardForm
          deck={deck}
          open
          onOpenChange={(next) => !next && setEditingId(null)}
          onSubmit={(draft) => {
            onEdit(editing.id, draft);
            setEditingId(null);
          }}
          initial={editing}
          dialogTitle={t("cardForm.editCard")}
          submitLabel={t("common.save")}
        />
      )}
      <ConfirmDialog
        open={deletingId !== null}
        onOpenChange={(next) => !next && setDeletingId(null)}
        title={t("deck.deleteCardTitle")}
        body={t("deck.deleteCardBody")}
        confirm={t("deck.deleteCard")}
        onConfirm={() => deletingId !== null && onDelete(deletingId)}
      />
    </div>
  );
}

type CardRowProps = {
  card: Card;
  performance: CardPerformance | undefined;
  now: Millis;
  open: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

/** One card: its question with its difficulty and kind under it, its last grade, how often right, when it comes back, and one menu. */
function CardRow({ card, performance, now, open, onToggle, onEdit, onDelete }: CardRowProps) {
  const { t } = useLanguage();
  const schedule = performance?.schedule;
  const studied = performance !== undefined && performance.runs > 0;
  const kind = [...kindWords(card, t), ...card.tags].join(", ");

  return (
    <div className="py-2.5">
      <div className={columnsLook}>
        <button type="button" onClick={onToggle} aria-expanded={open} className="min-h-11 min-w-0 cursor-pointer text-left">
          <span className="block truncate text-sm" title={plain(card.title)}>
            <Markdown inline>{card.title}</Markdown>
          </span>
          <span className={looks.fine}>{kind}</span>
        </button>
        <span className={looks.laptopOnly}>{schedule?.lastResult && <GradeChip result={schedule.lastResult} />}</span>
        <span className="hidden text-right text-sm tabular-nums lg:block">{studied ? `${Math.round(performance.score * 100)}%` : ""}</span>
        <span className="text-right">{schedule === undefined ? <Chip urgent>{t("common.new")}</Chip> : <ComesBack days={daysUntil(dueTime(schedule), now)} />}</span>
        <OverflowMenu size="icon-sm">
          <DropdownMenu.Item className={looks.menuItem} onSelect={onEdit}>
            {t("common.edit")}
          </DropdownMenu.Item>
          <DropdownMenu.Separator className={looks.menuRule} />
          <DropdownMenu.Item className={cn(looks.menuItem, looks.menuDanger)} onSelect={onDelete}>
            {t("common.delete")}
          </DropdownMenu.Item>
        </OverflowMenu>
      </div>
      {open && (
        <div className="mt-2 flex flex-col gap-2 border-t-2 border-dashed border-border pt-2.5 text-base lg:text-sm">
          {card.type === "standard" ? (
            <Markdown>{card.response}</Markdown>
          ) : (
            <ul className={looks.column}>
              {card.options.map((option) => (
                <li key={option.id} className={cn(looks.row, !option.correct && "text-muted-foreground")}>
                  <span className={markSlot}>
                    {option.correct && <GradeMark result="correct" className={cn(smallMark, gradeLooks.correct.text)} />}
                  </span>
                  <Markdown inline>{option.text}</Markdown>
                  {option.correct && <span className="sr-only">{t("common.correct")}</span>}
                </li>
              ))}
            </ul>
          )}
          {card.hint && (
            <p>
              <strong>{t("common.hint")}.</strong> <Markdown inline>{card.hint}</Markdown>
            </p>
          )}
          <CardHistory performance={performance} />
        </div>
      )}
    </div>
  );
}

/** How a card has gone and when it comes back: how often right and over how many runs, its spacing, due date and ease, and its last grade. */
function CardHistory({ performance }: { performance: CardPerformance | undefined }) {
  const { t, lang } = useLanguage();
  const schedule = performance?.schedule;
  if (performance === undefined || performance.runs === 0 || schedule === undefined) return <p className={looks.fine}>{t("deck.notStudied")}</p>;
  const p = String(Math.round(performance.score * 100));
  const days = Math.min(schedule.intervalDays, MAX_INTERVAL_DAYS);
  const date = new Intl.DateTimeFormat(lang, { month: "long", day: "numeric" }).format(dueTime(schedule));
  const words = [
    (performance.runs === 1 ? t("deck.accuracyOne") : t("deck.accuracy")).replace("{p}", p).replace("{n}", String(performance.runs)),
    days === 0 ? t("deck.intervalNone") : days === 1 ? t("deck.intervalOne") : t("deck.interval").replace("{n}", String(days)),
    t("deck.dueOn").replace("{date}", date),
    t("deck.ease").replace("{n}", schedule.easeFactor.toFixed(1)),
  ];
  return (
    <p className={cn(looks.fine, "flex flex-wrap items-center gap-x-3 gap-y-1")}>
      {words.map((word) => (
        <span key={word}>{word}</span>
      ))}
      {schedule.lastResult && (
        <span className={looks.row}>
          {t("deck.last")}
          <GradeChip result={schedule.lastResult} />
        </span>
      )}
    </p>
  );
}
