import { useMemo, useState } from "react";
import type { RunRecord } from "@/types";
import { cn } from "@/lib/utils";

const WEEKS = 13;
const DAYS = WEEKS * 7;

const LEVELS = [
  { min: 0, max: 0, className: "bg-muted/30" },
  { min: 1, max: 5, className: "bg-green-200 dark:bg-green-900/50" },
  { min: 6, max: 15, className: "bg-green-400 dark:bg-green-700/60" },
  { min: 16, max: 30, className: "bg-green-500 dark:bg-green-600/70" },
  { min: 31, max: Infinity, className: "bg-green-700 dark:bg-green-500" },
];

function getLevel(count: number) {
  return LEVELS.find((l) => count >= l.min && count <= l.max) ?? LEVELS[0];
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateLabel(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

interface StudyHeatmapProps {
  runs: RunRecord[];
}

export function StudyHeatmap({ runs }: StudyHeatmapProps) {
  const [now] = useState(() => new Date());

  const { days, cardsByDate } = useMemo(() => {
    // Build date → card count map
    const map = new Map<string, number>();
    for (const run of runs) {
      const d = new Date(run.completedAt);
      const key = dateKey(d);
      map.set(key, (map.get(key) ?? 0) + run.results.length);
    }

    // Build array of days (last DAYS days, ending today)
    const result: { date: Date; key: string }[] = [];
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    // Find the start: go back DAYS-1 days, then align to start of week (Monday)
    const start = new Date(today);
    start.setDate(start.getDate() - (DAYS - 1));
    // Align to Monday (getDay: 0=Sun, 1=Mon, ...)
    const dayOfWeek = start.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    start.setDate(start.getDate() + mondayOffset);

    const cursor = new Date(start);
    while (cursor <= today) {
      result.push({ date: new Date(cursor), key: dateKey(cursor) });
      cursor.setDate(cursor.getDate() + 1);
    }

    return { days: result, cardsByDate: map };
  }, [runs, now]);

  // Group days into columns (weeks)
  const weeks: { date: Date; key: string }[][] = [];
  let currentWeek: { date: Date; key: string }[] = [];
  for (const day of days) {
    // Monday = start of week (getDay: 1)
    const dow = day.date.getDay();
    const mondayIndex = dow === 0 ? 6 : dow - 1;
    if (mondayIndex === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(day);
  }
  if (currentWeek.length > 0) weeks.push(currentWeek);

  const DAY_LABELS = ["M", "", "W", "", "F", "", ""];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-[3px]">
        {/* Day labels */}
        <div className="flex flex-col gap-[3px] pr-1">
          {DAY_LABELS.map((label, i) => (
            <div key={i} className="flex h-[20px] items-center justify-center text-[9px] text-muted-foreground">
              {label}
            </div>
          ))}
        </div>
        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-1 flex-col gap-[3px]">
            {Array.from({ length: 7 }).map((_, di) => {
              const day = week.find((d) => {
                const dow = d.date.getDay();
                return (dow === 0 ? 6 : dow - 1) === di;
              });
              if (!day) {
                return <div key={di} className="h-[20px]" />;
              }
              const count = cardsByDate.get(day.key) ?? 0;
              const level = getLevel(count);
              return (
                <div
                  key={di}
                  className={cn("h-[20px] rounded-sm", level.className)}
                  title={`${formatDateLabel(day.date)}: ${count} cards`}
                />
              );
            })}
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <span>Less</span>
        {LEVELS.map((l, i) => (
          <div key={i} className={cn("h-3 w-3 rounded-sm", l.className)} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
