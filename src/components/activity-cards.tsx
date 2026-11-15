import { AccuracyTrend } from "@/components/accuracy-trend";
import { StudyHeatmap } from "@/components/study-heatmap";
import { CardContent, CardHeader, CardTitle, Card as UiCard } from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";
import type { Millis, RunRecord } from "@/core/model";
import { cn } from "@/lib/utils";

/** The study heatmap, and beside it the accuracy trend once there are two runs to draw it from. */
export function ActivityCards({ runs, now }: { runs: readonly RunRecord[]; now: Millis }) {
  const { t } = useLanguage();
  const trend = runs.length > 1;
  return (
    <div className={cn("grid grid-cols-1 gap-3", trend && "lg:grid-cols-[1fr_auto]")}>
      <UiCard size="sm">
        <CardHeader>
          <CardTitle>{t("stats.studyActivity")}</CardTitle>
        </CardHeader>
        <CardContent>
          <StudyHeatmap runs={runs} now={now} />
        </CardContent>
      </UiCard>
      {trend && (
        <UiCard size="sm" className="lg:w-64">
          <CardHeader>
            <CardTitle>{t("stats.accuracyTrend")}</CardTitle>
          </CardHeader>
          <CardContent>
            <AccuracyTrend runs={runs} />
          </CardContent>
        </UiCard>
      )}
    </div>
  );
}
