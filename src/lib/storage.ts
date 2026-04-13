import type { CardSRS, Deck, RunRecord } from "@/types";

const DECKS_KEY = "anki-decks";
const RUNS_KEY = "anki-runs";
const SRS_KEY = "anki-srs";

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
