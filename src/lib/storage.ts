import type { AppSettings, CardSRS, Deck, RunRecord } from "@/types";

const DECKS_KEY = "anki-decks";
const RUNS_KEY = "anki-runs";
const SRS_KEY = "anki-srs";
const SETTINGS_KEY = "anki-settings";

export function loadDecks(): Deck[] {
  const raw = localStorage.getItem(DECKS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveDecks(decks: Deck[]): void {
  localStorage.setItem(DECKS_KEY, JSON.stringify(decks));
}

export function loadRuns(): RunRecord[] {
  const raw = localStorage.getItem(RUNS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveRuns(runs: RunRecord[]): void {
  localStorage.setItem(RUNS_KEY, JSON.stringify(runs));
}

export function loadSRS(): CardSRS[] {
  const raw = localStorage.getItem(SRS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveSRS(srs: CardSRS[]): void {
  localStorage.setItem(SRS_KEY, JSON.stringify(srs));
}

const DEFAULT_SETTINGS: AppSettings = { dailyCardGoal: 20 };

export function loadSettings(): AppSettings {
  const raw = localStorage.getItem(SETTINGS_KEY);
  return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
