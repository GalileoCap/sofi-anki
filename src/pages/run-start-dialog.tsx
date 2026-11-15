import { useState } from "react";

import { Field } from "@/components/field";
import { Chip, Segmented } from "@/components/sticker";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/language-context";
import type { RunMode, SessionGoal } from "@/core/model";
import { looks } from "@/lib/ui-looks";
import { cn } from "@/lib/utils";

/** The goal a run is offered before anyone changes it. */
const DEFAULT_GOAL: SessionGoal = { type: "cards", value: 20 };

/** A checkbox with its label, tall enough to tap. */
const checkLook = "flex min-h-11 cursor-pointer items-center gap-2.5 text-sm";

type RunStartDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  counts: Record<Exclude<RunMode, "all">, number>;
  onStart: (mode: RunMode, goal: SessionGoal | undefined, shuffle: boolean) => void;
};

/** Choosing the cards to study: which of the deck's, whether shuffled, and an optional goal. */
export function RunStartDialog({ open, onOpenChange, counts, onStart }: RunStartDialogProps) {
  const { t } = useLanguage();
  const [picked, setPicked] = useState<RunMode>("all");
  const [shuffle, setShuffle] = useState(false);
  const [goal, setGoal] = useState<SessionGoal | null>(null);
  const chosen = picked;
  const empty = chosen !== "all" && counts[chosen] === 0;

  function start() {
    onStart(chosen, goal ?? undefined, shuffle);
    onOpenChange(false);
    setPicked("all");
    setShuffle(false);
    setGoal(null);
  }

  /** A value that does not read as a whole number leaves the goal as it was. */
  function setGoalValue(text: string) {
    const value = Number.parseInt(text, 10);
    if (goal && Number.isFinite(value)) setGoal({ ...goal, value: Math.max(1, value) });
  }

  const modes: { mode: RunMode; label: string; count: number | null }[] = [
    { mode: "all", label: t("runStart.allCards"), count: null },
    { mode: "due", label: t("common.due"), count: counts.due },
    { mode: "weak", label: t("common.weak"), count: counts.weak },
    { mode: "new", label: t("common.new"), count: counts.new },
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
              disabled={m.count === 0}
              onClick={() => setPicked(m.mode)}
              className={cn(
                "flex min-h-11 cursor-pointer items-center justify-between rounded-lg border-2 bg-card px-3.5 text-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40",
                picked === m.mode ? "border-primary" : "border-border",
              )}
            >
              {m.label}
              {m.count !== null && <Chip>{m.count}</Chip>}
            </button>
          ))}
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
