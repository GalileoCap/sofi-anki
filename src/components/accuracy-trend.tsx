import { useLanguage } from "@/contexts/language-context";
import type { RunRecord } from "@/core/model";
import { firstTries } from "@/core/stats";
import { cn } from "@/lib/utils";

/** How many runs the trend shows, the newest. */
const SHOWN = 20;

/** A bar's parts from the top down. */
const stacked = ["other", "wrong", "approximate", "correct"] as const;

const swatch = "inline-block h-2 w-2 rounded-sm";
const colors = {
  correct: "bg-green-400 dark:bg-green-600",
  approximate: "bg-yellow-400 dark:bg-yellow-600",
  wrong: "bg-red-400 dark:bg-red-600",
  other: "bg-muted",
};

/** The newest runs, oldest on the left, each a bar of how its cards went the first time. */
export function AccuracyTrend({ runs }: { runs: readonly RunRecord[] }) {
  const { t } = useLanguage();
  const shown = runs.slice(0, SHOWN).reverse();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-20 items-end gap-1">
        {shown.map((run) => {
          const counts = firstTries(run);
          const parts = {
            other: counts.skip + counts.save_for_later,
            wrong: counts.wrong,
            approximate: counts.approximate,
            correct: counts.correct,
          };
          const total = Object.values(parts).reduce((a, b) => a + b, 0);
          if (total === 0) return null;
          return (
            <div
              key={run.id}
              className="flex h-full flex-1 flex-col overflow-hidden rounded-sm"
              title={`${new Date(run.completedAt).toLocaleDateString()}: ${counts.correct} ${t("common.correct")}, ${counts.approximate} ${t("common.approximate")}, ${counts.wrong} ${t("common.wrong")}`}
            >
              {stacked.map(
                (part) => parts[part] > 0 && <div key={part} className={colors[part]} style={{ height: `${(parts[part] / total) * 100}%` }} />,
              )}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className={cn(swatch, colors.correct)} /> {t("common.correct")}
        </span>
        <span className="flex items-center gap-1">
          <span className={cn(swatch, colors.approximate)} /> {t("globalStats.approx")}
        </span>
        <span className="flex items-center gap-1">
          <span className={cn(swatch, colors.wrong)} /> {t("common.wrong")}
        </span>
      </div>
    </div>
  );
}
