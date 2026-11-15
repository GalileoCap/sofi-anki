import { useState } from "react";

import { Field } from "@/components/field";
import { Chip, Segmented, Toggle } from "@/components/sticker";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/language-context";
import { toggled } from "@/core/decks";
import { type Card, type Complexity, type RunMode, type SessionGoal, complexities } from "@/core/model";
import { looks } from "@/lib/ui-looks";
import { cn } from "@/lib/utils";

/** The goal a run is offered before anyone changes it. */
const DEFAULT_GOAL: SessionGoal = { type: "cards", value: 20 };

/** A checkbox with its label, tall enough to tap. */
const checkLook = "flex min-h-11 cursor-pointer items-center gap-2.5 text-sm";

type RunStartDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The deck's cards of each kind there is to study. */
  cards: Record<RunMode, readonly Card[]>;
  /** The difficulties chosen, or null for every one. */
  onStart: (mode: RunMode, difficulties: readonly Complexity[] | null, goal: SessionGoal | undefined, shuffle: boolean) => void;
};

/** Choosing the cards to study: which of the deck's, of which difficulties, whether shuffled, and an optional goal. */
export function RunStartDialog({ open, onOpenChange, cards, onStart }: RunStartDialogProps) {
  const { t } = useLanguage();
  const [picked, setPicked] = useState<RunMode>("all");
  const [shuffle, setShuffle] = useState(false);
  const [goal, setGoal] = useState<SessionGoal | null>(null);
  const [difficulties, setDifficulties] = useState<ReadonlySet<Complexity>>(new Set());
  const count = (mode: RunMode) => cards[mode].filter((card) => difficulties.size === 0 || difficulties.has(card.complexity)).length;
  const empty = count(picked) === 0;

  function start() {
    onStart(picked, difficulties.size === 0 ? null : complexities.filter((c) => difficulties.has(c)), goal ?? undefined, shuffle);
    onOpenChange(false);
    setPicked("all");
    setShuffle(false);
    setGoal(null);
    setDifficulties(new Set());
  }

  /** A value that does not read as a whole number leaves the goal as it was. */
  function setGoalValue(text: string) {
    const value = Number.parseInt(text, 10);
    if (goal && Number.isFinite(value)) setGoal({ ...goal, value: Math.max(1, value) });
  }

  const modes: { mode: RunMode; label: string }[] = [
    { mode: "all", label: t("runStart.allCards") },
    { mode: "due", label: t("common.due") },
    { mode: "weak", label: t("common.weak") },
    { mode: "new", label: t("common.new") },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("deck.chooseCards")}</DialogTitle>
        </DialogHeader>
        <Field label={t("runStart.which")} group>
          {modes.map((m) => (
            <button
              key={m.mode}
              type="button"
              aria-pressed={picked === m.mode}
              disabled={m.mode !== "all" && count(m.mode) === 0}
              onClick={() => setPicked(m.mode)}
              className={cn(
                "flex min-h-11 cursor-pointer items-center justify-between rounded-lg border-2 bg-card px-3.5 text-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40",
                picked === m.mode ? "border-primary" : "border-border",
              )}
            >
              {m.label}
              <Chip>{count(m.mode)}</Chip>
            </button>
          ))}
        </Field>
        <Field label={t("cardForm.difficulty")} group>
          <div className={looks.chips}>
            {complexities.map((c) => (
              <Toggle key={c} pressed={difficulties.has(c)} onClick={() => setDifficulties(toggled(difficulties, c))}>
                {t(`complexity.${c}`)}
              </Toggle>
            ))}
          </div>
          <p className={looks.fine}>{t("runStart.difficultyHint")}</p>
        </Field>
        <div>
          <label className={checkLook}>
            <input type="checkbox" checked={shuffle} onChange={(e) => setShuffle(e.target.checked)} className={looks.checkbox} />
            {t("runStart.shuffleCards")}
          </label>
          <label className={checkLook}>
            <input type="checkbox" checked={goal !== null} onChange={(e) => setGoal(e.target.checked ? DEFAULT_GOAL : null)} className={looks.checkbox} />
            {t("runStart.sessionGoal")}
          </label>
          {goal && (
            <div className="mt-1 flex flex-wrap items-center gap-3 pl-7.5">
              <Input
                type="number"
                min={1}
                value={goal.value}
                onChange={(e) => setGoalValue(e.target.value)}
                aria-label={t("runStart.sessionGoal")}
                className="w-24"
              />
              <Segmented
                label={t("runStart.sessionGoal")}
                options={[
                  { value: "cards", label: t("runStart.cards") },
                  { value: "minutes", label: t("runStart.minutes") },
                ]}
                value={goal.type}
                onChange={(type) => setGoal({ ...goal, type })}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={start} disabled={empty}>
            {t("runStart.study")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
