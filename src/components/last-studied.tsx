import { useLanguage } from "@/contexts/language-context";
import type { Millis } from "@/core/model";
import { daysSince } from "@/core/stats";

/** When a deck was last studied, in the words of a line about it: today, yesterday, days or weeks ago, then the date. */
export function LastStudied({ at, now }: { at: Millis | null; now: Millis }) {
  const { t, lang } = useLanguage();
  if (at === null) return t("when.never");
  const days = daysSince(at, now);
  const n = (key: Parameters<typeof t>[0], value: number) => t(key).replace("{n}", String(value));
  if (days === 0) return t("when.today");
  if (days === 1) return t("when.yesterday");
  if (days < 7) return n("when.daysAgo", days);
  if (days < 30) return n("when.weeksAgo", Math.floor(days / 7));
  return t("when.on").replace("{date}", new Date(at).toLocaleDateString(lang, { month: "short", day: "numeric" }));
}
