import { useState, useEffect, useCallback } from "react";
import type { Card, CardRunResult, CardSRS, Deck } from "@/types";
import { loadSRS, saveSRS } from "@/lib/storage";

const DAY_MS = 86_400_000;
const DEFAULT_EASE = 2.5;
const MIN_EASE = 1.3;

function srsKey(deckId: string, cardId: string) {
  return `${deckId}:${cardId}`;
}

export function useSRS() {
  const [srsMap, setSrsMap] = useState<Map<string, CardSRS>>(() => {
    const list = loadSRS();
    const map = new Map<string, CardSRS>();
    for (const entry of list) {
      map.set(srsKey(entry.deckId, entry.cardId), entry);
    }
    return map;
  });

  useEffect(() => {
    saveSRS(Array.from(srsMap.values()));
  }, [srsMap]);

  function getSRS(deckId: string, cardId: string): CardSRS | undefined {
    return srsMap.get(srsKey(deckId, cardId));
  }

  const updateAfterRun = useCallback(
    (deckId: string, results: CardRunResult[]) => {
      setSrsMap((prev) => {
        const next = new Map(prev);
        const now = Date.now();

        for (const result of results) {
          // Use the last graded attempt (accounts for redo)
          const lastGraded = [...result.attempts]
            .reverse()
            .find((a) => a.result === "correct" || a.result === "approximate" || a.result === "wrong");
          if (!lastGraded) continue;

          const key = srsKey(deckId, result.card.id);
          const existing = next.get(key);
          let intervalDays = existing?.intervalDays ?? 0;
          let easeFactor = existing?.easeFactor ?? DEFAULT_EASE;

          if (lastGraded.result === "correct") {
            intervalDays = Math.max(1, Math.round(intervalDays === 0 ? 1 : intervalDays * easeFactor));
            easeFactor = easeFactor + 0.1;
          } else if (lastGraded.result === "approximate") {
            intervalDays = Math.max(1, intervalDays);
          } else {
            // wrong
            intervalDays = 0;
            easeFactor = Math.max(MIN_EASE, easeFactor - 0.2);
          }

          next.set(key, {
            cardId: result.card.id,
            deckId,
            intervalDays,
            easeFactor,
            dueAt: intervalDays === 0 ? now : now + intervalDays * DAY_MS,
            lastResult: lastGraded.result as "wrong" | "approximate" | "correct",
          });
        }

        return next;
      });
    },
    []
  );

  function getDueCards(deck: Deck): Card[] {
    const now = Date.now();
    return deck.cards.filter((c) => {
      const entry = srsMap.get(srsKey(deck.id, c.id));
      if (!entry) return true; // new card = due
      return entry.dueAt <= now;
    });
  }

  function getWeakCards(deck: Deck): Card[] {
    return deck.cards.filter((c) => {
      const entry = srsMap.get(srsKey(deck.id, c.id));
      if (!entry) return false;
      return entry.lastResult === "wrong" || entry.lastResult === "approximate";
    });
  }

  function deleteSRSForDeck(deckId: string) {
    setSrsMap((prev) => {
      const next = new Map(prev);
      for (const [key, entry] of next) {
        if (entry.deckId === deckId) next.delete(key);
      }
      return next;
    });
  }

  /** Returns a cardId → CardSRS map for all cards in a given deck. */
  function getSRSForDeck(deckId: string): Map<string, CardSRS> {
    const result = new Map<string, CardSRS>();
    for (const entry of srsMap.values()) {
      if (entry.deckId === deckId) result.set(entry.cardId, entry);
    }
    return result;
  }

  return { getSRS, getSRSForDeck, updateAfterRun, getDueCards, getWeakCards, deleteSRSForDeck };
}
