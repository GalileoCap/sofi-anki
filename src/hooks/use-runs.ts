import { useState, useEffect, useCallback } from "react";
import type { CardRunResult, RunRecord } from "@/types";
import { loadRuns, saveRuns } from "@/lib/storage";

export function useRuns() {
  const [runs, setRuns] = useState<RunRecord[]>(() => loadRuns());

  useEffect(() => {
    saveRuns(runs);
  }, [runs]);

  const addRun = useCallback(
    (deckId: string, totalTimeMs: number, results: CardRunResult[]): RunRecord => {
      const record: RunRecord = {
        id: crypto.randomUUID(),
        deckId,
        completedAt: Date.now(),
        totalTimeMs,
        results,
      };
      setRuns((prev) => [...prev, record]);
      return record;
    },
    []
  );

  function deleteRunsForDeck(deckId: string) {
    setRuns((prev) => prev.filter((r) => r.deckId !== deckId));
  }

  function getRunsForDeck(deckId: string): RunRecord[] {
    return runs.filter((r) => r.deckId === deckId);
  }

  return { runs, addRun, deleteRunsForDeck, getRunsForDeck };
}
