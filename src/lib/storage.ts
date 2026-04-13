import type { Deck } from "@/types";

const STORAGE_KEY = "anki-decks";

export function loadDecks(): Deck[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveDecks(decks: Deck[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
}
