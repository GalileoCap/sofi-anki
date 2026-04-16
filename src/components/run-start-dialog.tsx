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
import { Badge } from "@/components/ui/badge";
import type { RunMode, SessionGoal } from "@/types";
import { cn } from "@/lib/utils";

interface RunStartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-selected label shown in title (desktop mode). Omit when showModePicker=true. */
  label?: string;
  /** When true, show a mode picker before goal selection (used on mobile "Start" button). */
  showModePicker?: boolean;
  dueCount?: number;
  weakCount?: number;
  onStart: (mode: RunMode, goal?: SessionGoal, shuffle?: boolean) => void;
}

export function RunStartDialog({
  open,
  onOpenChange,
  label,
  showModePicker,
  dueCount = 0,
  weakCount = 0,
  onStart,
}: RunStartDialogProps) {
  const [selectedMode, setSelectedMode] = useState<RunMode>("all");
  const [shuffle, setShuffle] = useState(false);
  const [useGoal, setUseGoal] = useState(false);
  const [goalType, setGoalType] = useState<"cards" | "minutes">("cards");
  const [goalValue, setGoalValue] = useState(20);

  function handleStart() {
    const mode = showModePicker ? selectedMode : (label ? modeFromLabel(label) : "all");
    onStart(mode, useGoal ? { type: goalType, value: goalValue } : undefined, shuffle);
    onOpenChange(false);
    setUseGoal(false);
    setSelectedMode("all");
    setShuffle(false);
  }

  const title = showModePicker
    ? "Start Study Session"
    : `Start Run — ${label ?? ""}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {showModePicker && (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">Study mode</p>
              <div className="flex flex-col gap-1.5">
                {(
                  [
                    { mode: "all" as RunMode, label: "All Cards", count: null },
                    { mode: "due" as RunMode, label: "Due", count: dueCount },
                    { mode: "weak" as RunMode, label: "Weak", count: weakCount },
                  ] as const
                ).map(({ mode, label: mLabel, count }) => (
                  <button
                    key={mode}
                    type="button"
                    disabled={count !== null && count === 0}
                    onClick={() => setSelectedMode(mode)}
                    className={cn(
                      "flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm font-medium transition-all disabled:opacity-40",
                      selectedMode === mode
                        ? "border-foreground/20 bg-foreground/5 text-foreground"
                        : "border-border text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    <span>{mLabel}</span>
                    {count !== null && (
                      <Badge variant="outline" className="text-xs">{count}</Badge>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={shuffle}
              onChange={(e) => setShuffle(e.target.checked)}
              className="rounded"
            />
            Shuffle cards
          </label>

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
          <Button
            onClick={handleStart}
            disabled={showModePicker && selectedMode === "due" && dueCount === 0}
          >
            Start
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function modeFromLabel(label: string): RunMode {
  if (label.toLowerCase().includes("due")) return "due";
  if (label.toLowerCase().includes("weak")) return "weak";
  return "all";
}
