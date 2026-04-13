import { useState, useEffect } from "react";
import type { AppSettings } from "@/types";
import { loadSettings, saveSettings } from "@/lib/storage";

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  function updateDailyGoal(goal: number) {
    setSettings((prev) => ({ ...prev, dailyCardGoal: Math.max(0, goal) }));
  }

  return { settings, updateDailyGoal };
}
