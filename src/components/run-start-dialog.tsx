import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { SessionGoal } from "@/types";
import { cn } from "@/lib/utils";

interface RunStartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: string;
  onStart: (goal?: SessionGoal) => void;
}

export function RunStartDialog({ open, onOpenChange, label, onStart }: RunStartDialogProps) {
  const [useGoal, setUseGoal] = useState(false);
  const [goalType, setGoalType] = useState<"cards" | "minutes">("cards");
  const [goalValue, setGoalValue] = useState(20);

  function handleStart() {
    onStart(useGoal ? { type: goalType, value: goalValue } : undefined);
    onOpenChange(false);
    setUseGoal(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start Run — {label}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={useGoal}
              onChange={(e) => setUseGoal(e.target.checked)}
              className="rounded"
            />
            Set a session goal
          </label>

          {useGoal && (
            <div className="flex flex-col gap-3 rounded-lg border p-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setGoalType("cards")}
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                    goalType === "cards"
                      ? "border-foreground/20 bg-foreground/5 text-foreground"
                      : "border-border text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  Cards
                </button>
                <button
                  type="button"
                  onClick={() => setGoalType("minutes")}
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                    goalType === "minutes"
                      ? "border-foreground/20 bg-foreground/5 text-foreground"
                      : "border-border text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  Minutes
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  value={goalValue}
                  onChange={(e) => setGoalValue(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">
                  {goalType === "cards" ? "cards" : "minutes"}
                </span>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleStart}>Start</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
