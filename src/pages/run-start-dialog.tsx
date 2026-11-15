import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/language-context";
import type { RunMode, SessionGoal } from "@/core/model";
import { looks } from "@/lib/ui-looks";
import { cn } from "@/lib/utils";

/** The goal a run is offered before anyone changes it. */
const DEFAULT_GOAL: SessionGoal = { type: "cards", value: 20 };

const choice = (chosen: boolean) =>
  cn(
    "rounded-lg border px-3 py-2 text-sm font-medium transition-all",
    chosen ? looks.chosen : "border-border text-muted-foreground hover:bg-muted/50",
  );

type RunStartDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * The mode chosen already, named by `label`, or `null` for the dialog to offer every mode
   * with the count of cards in each.
   */
  mode: { mode: RunMode; label: string } | null;
  counts: Record<Exclude<RunMode, "all">, number>;
  onStart: (mode: RunMode, goal: SessionGoal | undefined, shuffle: boolean) => void;
};

/** Before a run: its mode when not chosen yet, whether to shuffle, and an optional goal. */
export function RunStartDialog({ open, onOpenChange, mode, counts, onStart }: RunStartDialogProps) {
  const { t } = useLanguage();
  const [picked, setPicked] = useState<RunMode>("all");
  const [shuffle, setShuffle] = useState(false);
  const [goal, setGoal] = useState<SessionGoal | null>(null);
  const chosen = mode?.mode ?? picked;
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
          <DialogTitle>{mode ? `${t("runStart.titleFor")}: ${mode.label}` : t("runStart.title")}</DialogTitle>
        </DialogHeader>
        <div className={looks.form}>
          {mode === null && (
            <div className={looks.column}>
              <p className={looks.muted}>{t("runStart.studyMode")}</p>
              <div className={looks.wide}>
                {modes.map((m) => (
                  <button
                    key={m.mode}
                    type="button"
                    disabled={m.count === 0}
                    onClick={() => setPicked(m.mode)}
                    className={cn(choice(picked === m.mode), "flex items-center justify-between py-2.5 disabled:opacity-40")}
                  >
                    <span>{m.label}</span>
                    {m.count !== null && (
                      <Badge variant="outline" className="text-xs">
                        {m.count}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <label className={looks.check}>
            <input type="checkbox" checked={shuffle} onChange={(e) => setShuffle(e.target.checked)} className="rounded" />
            {t("runStart.shuffleCards")}
          </label>

          <label className={looks.check}>
            <input
              type="checkbox"
              checked={goal !== null}
              onChange={(e) => setGoal(e.target.checked ? DEFAULT_GOAL : null)}
              className="rounded"
            />
            {t("runStart.sessionGoal")}
          </label>

          {goal && (
            <div className="flex flex-col gap-3 rounded-lg border p-3">
              <div className={looks.buttons}>
                {(["cards", "minutes"] as const).map((type) => (
                  <button key={type} type="button" onClick={() => setGoal({ ...goal, type })} className={cn(choice(goal.type === type), "flex-1")}>
                    {t(type === "cards" ? "runStart.cards" : "runStart.minutes")}
                  </button>
                ))}
              </div>
              <div className={looks.row}>
                <Input type="number" min={1} value={goal.value} onChange={(e) => setGoalValue(e.target.value)} className="w-24" />
                <span className={looks.muted}>{t(goal.type === "cards" ? "runStart.cards" : "runStart.minutes")}</span>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={start} disabled={empty}>
            {t("common.start")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
