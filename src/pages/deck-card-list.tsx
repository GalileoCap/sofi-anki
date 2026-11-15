import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { DropdownMenu } from "radix-ui";
import { useState } from "react";

import { CardForm } from "@/components/card-form";
import { CardHeading } from "@/components/card-heading";
import { Markdown } from "@/components/markdown";
import { OverflowMenu } from "@/components/overflow-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardAction, CardHeader, Card as UiCard } from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";
import type { CardDraft } from "@/core/decks";
import type { AnswerResult, Card, Millis } from "@/core/model";
import { MAX_INTERVAL_DAYS, dueTime } from "@/core/scheduler";
import { type CardPerformance, daysUntil } from "@/core/stats";
import { accuracyLook, looks } from "@/lib/ui-looks";
import { cn } from "@/lib/utils";

const lastAnswerDot: Record<AnswerResult, string> = {
  correct: "bg-positive",
  approximate: "bg-caution",
  wrong: "bg-negative",
};

const sectionLabel = "mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground";

type CardListProps = {
  cards: readonly Card[];
  performance: ReadonlyMap<string, CardPerformance>;
  now: Millis;
  expanded: ReadonlySet<string>;
  onToggle: (cardId: string) => void;
  onEdit: (cardId: string, draft: CardDraft) => void;
  onDelete: (cardId: string) => void;
};

/** A deck's cards, drawn as the window scrolls to them, each opening to its answer and schedule. */
export function CardList({ cards, performance, now, expanded, onToggle, onEdit, onDelete }: CardListProps) {
  // The virtualizer changes inside one object, which the React Compiler would memoize past.
  "use no memo";
  const { t } = useLanguage();
  const [listTop, setListTop] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = cards.find((card) => card.id === editingId);
  const virtualizer = useWindowVirtualizer({ count: cards.length, estimateSize: () => 64, overscan: 5, scrollMargin: listTop });

  return (
    <>
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
              className="absolute top-0 left-0 w-full pb-2"
              style={{ transform: `translateY(${item.start - virtualizer.options.scrollMargin}px)` }}
            >
              <CardRow
                card={card}
                performance={performance.get(card.id)}
                now={now}
                open={expanded.has(card.id)}
                onToggle={() => onToggle(card.id)}
                onEdit={(draft) => onEdit(card.id, draft)}
                onEditInDialog={() => setEditingId(card.id)}
                onDelete={() => onDelete(card.id)}
              />
            </div>
          );
        })}
      </div>
      {editing && (
        <CardForm
          open
          onOpenChange={(open) => {
            if (!open) setEditingId(null);
          }}
          onSubmit={(draft) => {
            onEdit(editing.id, draft);
            setEditingId(null);
          }}
          initial={editing}
          dialogTitle={t("cardForm.editCard")}
          submitLabel={t("common.save")}
        />
      )}
    </>
  );
}

type CardRowProps = {
  card: Card;
  performance: CardPerformance | undefined;
  now: Millis;
  open: boolean;
  onToggle: () => void;
  onEdit: (draft: CardDraft) => void;
  /** On a phone, the menu's Edit opens the form the list holds. */
  onEditInDialog: () => void;
  onDelete: () => void;
};

/** One card: its title and badges, its state of study, and its edit and delete actions. */
function CardRow({ card, performance, now, open, onToggle, onEdit, onEditInDialog, onDelete }: CardRowProps) {
  const { t, tp } = useLanguage();
  const schedule = performance?.schedule;
  const studied = performance !== undefined && performance.runs > 0;
  const due = schedule !== undefined && dueTime(schedule) <= now;
  const last = schedule?.lastResult ?? null;

  return (
    <UiCard size="sm" className="cursor-pointer" onClick={onToggle}>
      <CardHeader>
        <CardHeading
          card={card}
          before={
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={14}
              strokeWidth={2}
              aria-hidden="true"
              className={cn("shrink-0 text-muted-foreground transition-transform duration-150", open && "rotate-90")}
            />
          }
        >
          {!studied ? (
            <Badge variant="outline" className={looks.fine}>
              {t("deckStats.new")}
            </Badge>
          ) : due ? (
            <Badge
              variant="outline"
              className="border-caution/40 bg-caution-soft text-xs text-caution"
            >
              {t("common.due")}
            </Badge>
          ) : (
            last !== null && (
              <span
                title={`${Math.round(performance.score * 100)}% · ${performance.runs} ${tp(performance.runs, "common.session", "common.sessions")}`}
                className={cn("flex h-2 w-2 shrink-0 rounded-full", lastAnswerDot[last])}
              />
            )
          )}
        </CardHeading>
        <CardAction onClick={(e) => e.stopPropagation()}>
          <div className="hidden gap-1 sm:flex">
            <CardForm
              trigger={
                <Button variant="ghost" size="xs">
                  {t("common.edit")}
                </Button>
              }
              onSubmit={onEdit}
              initial={card}
              dialogTitle={t("cardForm.editCard")}
              submitLabel={t("common.save")}
            />
            <Button variant="ghost" size="xs" className={looks.danger} onClick={onDelete}>
              {t("common.delete")}
            </Button>
          </div>
          <div className="sm:hidden">
            <OverflowMenu size="icon-xs">
              <DropdownMenu.Item className={looks.menuItem} onSelect={onEditInDialog}>
                {t("common.edit")}
              </DropdownMenu.Item>
              <DropdownMenu.Item
                className={cn(looks.menuItem, "text-destructive data-[highlighted]:text-destructive")}
                onSelect={onDelete}
              >
                {t("common.delete")}
              </DropdownMenu.Item>
            </OverflowMenu>
          </div>
        </CardAction>
      </CardHeader>

      {open && (
        <div className="flex flex-col gap-3 border-t px-4 pt-3 pb-4" onClick={(e) => e.stopPropagation()}>
          {card.type === "standard" ? (
            <div>
              <p className={sectionLabel}>{t("common.answer")}</p>
              <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                <Markdown>{card.response}</Markdown>
              </div>
            </div>
          ) : (
            <div>
              <p className={sectionLabel}>{t("common.options")}</p>
              <div className={looks.lines}>
                {card.options.map((option) => (
                  <div
                    key={option.id}
                    className={cn(
                      "flex items-start gap-2 rounded-md px-2 py-1.5 text-sm",
                      option.correct ? "bg-positive-soft text-positive" : "text-muted-foreground",
                    )}
                  >
                    <span className="mt-0.5 shrink-0 font-mono text-xs">{option.correct ? "✓" : "·"}</span>
                    <Markdown inline>{option.text}</Markdown>
                  </div>
                ))}
              </div>
            </div>
          )}

          {card.hint && (
            <div>
              <p className={sectionLabel}>{t("common.hint")}</p>
              <div className={looks.hint}>
                <Markdown>{card.hint}</Markdown>
              </div>
            </div>
          )}

          {performance && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {!studied ? (
                <span>{t("deckDetail.neverStudied")}</span>
              ) : (
                <>
                  <span>
                    {t("deckDetail.accuracy")}{" "}
                    <span className={cn("font-medium", accuracyLook(Math.round(performance.score * 100)))}>{Math.round(performance.score * 100)}%</span> (
                    {performance.runs} {tp(performance.runs, "common.session", "common.sessions")})
                  </span>
                  {schedule && (
                    <>
                      <span>
                        {t("deckDetail.interval")}{" "}
                        <span className={looks.strong}>
                          {schedule.intervalDays === 0 ? t("deckDetail.review") : `${Math.min(schedule.intervalDays, MAX_INTERVAL_DAYS)}d`}
                        </span>
                      </span>
                      <span>
                        {t("deckDetail.due")}{" "}
                        <span className={cn("font-medium", due ? "text-caution" : "text-foreground")}>
                          <DueLabel dueAt={dueTime(schedule)} now={now} />
                        </span>
                      </span>
                      <span>
                        {t("deckDetail.ease")} <span className={looks.strong}>{schedule.easeFactor.toFixed(1)}</span>
                      </span>
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </UiCard>
  );
}

/** When a card is due, in days from now. */
function DueLabel({ dueAt, now }: { dueAt: Millis; now: Millis }) {
  const { t } = useLanguage();
  const days = daysUntil(dueAt, now);
  if (days < 0) return t("deckDetail.dueOverdue").replace("{n}", String(-days));
  if (days === 0) return t("deckDetail.dueToday");
  if (days === 1) return t("deckDetail.dueTomorrow");
  return t("deckDetail.dueIn").replace("{n}", String(days));
}
