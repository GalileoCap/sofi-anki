import { useLanguage } from "@/contexts/language-context";
import type { Millis, RunRecord } from "@/core/model";
import { cardsByDay, dayKey, heatmapWeeks } from "@/core/stats";
import { cn } from "@/lib/utils";

/** The days the heatmap shows: thirteen weeks. */
const DAYS = 13 * 7;

/** The shade of a day, by the cards studied on it, from the least to the most. */
const LEVELS = [
  { least: 0, className: "bg-muted/30" },
  { least: 1, className: "bg-green-200 dark:bg-green-900/50" },
  { least: 6, className: "bg-green-400 dark:bg-green-700/60" },
  { least: 16, className: "bg-green-500 dark:bg-green-600/70" },
  { least: 31, className: "bg-green-700 dark:bg-green-500" },
] as const;

const shade = (count: number): string => LEVELS.findLast((level) => count >= level.least)?.className ?? LEVELS[0].className;

const DAY_LABELS = ["M", "", "W", "", "F", "", ""];

const cell = "h-[20px]";

/** The cards studied each day of the last thirteen weeks, a column a week from Monday. */
export function StudyHeatmap({ runs, now }: { runs: readonly RunRecord[]; now: Millis }) {
  const { t, tp } = useLanguage();
  const counts = cardsByDay(runs);
  const weeks = heatmapWeeks(now, DAYS);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-[3px]">
        <div className="flex flex-col gap-[3px] pr-1">
          {DAY_LABELS.map((label, i) => (
            <div key={i} className={cn(cell, "flex items-center justify-center text-[9px] text-muted-foreground")}>
              {label}
            </div>
          ))}
        </div>
        {weeks.map((week) => (
          <div key={dayKey(week[0])} className="flex flex-1 flex-col gap-[3px]">
            {week.map((day) => {
              const count = counts.get(dayKey(day)) ?? 0;
              const label = day.toLocaleDateString(undefined, { month: "short", day: "numeric" });
              return (
                <div
                  key={dayKey(day)}
                  className={cn(cell, "rounded-sm", shade(count))}
                  title={`${label}: ${count} ${tp(count, "common.card", "common.cards")}`}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <span>{t("heatmap.less")}</span>
        {LEVELS.map((level) => (
          <div key={level.least} className={cn("h-3 w-3 rounded-sm", level.className)} />
        ))}
        <span>{t("heatmap.more")}</span>
      </div>
    </div>
  );
}
