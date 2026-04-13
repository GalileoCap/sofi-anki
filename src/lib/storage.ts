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

export interface BackupData {
  version: 1;
  exportedAt: number;
  decks: Deck[];
  runs: RunRecord[];
  srs: CardSRS[];
  settings: AppSettings;
}

export function exportAllData(): string {
  const data: BackupData = {
    version: 1,
    exportedAt: Date.now(),
    decks: loadDecks(),
    runs: loadRuns(),
    srs: loadSRS(),
    settings: loadSettings(),
  };
  return JSON.stringify(data, null, 2);
}

export function importAllData(json: string, mode: "replace" | "merge"): void {
  const data = JSON.parse(json) as BackupData;

  if (mode === "replace") {
    saveDecks(data.decks ?? []);
    saveRuns(data.runs ?? []);
    saveSRS(data.srs ?? []);
    saveSettings(data.settings ?? DEFAULT_SETTINGS);
  } else {
    // Merge: add items that don't exist by ID
    const existingDecks = loadDecks();
    const existingDeckIds = new Set(existingDecks.map((d) => d.id));
    const newDecks = (data.decks ?? []).filter((d) => !existingDeckIds.has(d.id));
    saveDecks([...existingDecks, ...newDecks]);

    const existingRuns = loadRuns();
    const existingRunIds = new Set(existingRuns.map((r) => r.id));
    const newRuns = (data.runs ?? []).filter((r) => !existingRunIds.has(r.id));
    saveRuns([...existingRuns, ...newRuns]);

    const existingSrs = loadSRS();
    const existingSrsKeys = new Set(existingSrs.map((s) => `${s.deckId}:${s.cardId}`));
    const newSrs = (data.srs ?? []).filter((s) => !existingSrsKeys.has(`${s.deckId}:${s.cardId}`));
    saveSRS([...existingSrs, ...newSrs]);

    // Settings: keep current
  }
}
