import { useState, useMemo, useEffect } from "react";
import { useDecks } from "@/hooks/use-decks";
import { useRuns } from "@/hooks/use-runs";
import { useSRS } from "@/hooks/use-srs";
import { useSettings } from "@/hooks/use-settings";
import { DeckList } from "@/components/deck-list";
import { DeckDetail } from "@/components/deck-detail";
import { DeckStats } from "@/components/deck-stats";
import { GlobalStats } from "@/components/global-stats";
import { StudySession } from "@/components/study-session";
import { SharedDeckView } from "@/components/shared-deck-view";
import { ThemeToggle } from "@/components/theme-toggle";
import { decodeDeck } from "@/lib/share";
import type { AnswerResult, CardSRS, Complexity, Deck, RunMode, SessionGoal } from "@/types";

export interface CardPerf {
  attempts: number;
  accuracy: number; // 0–1
  lastResult: AnswerResult | null;
  srs: CardSRS | undefined;
}

type View =
  | { kind: "home" }
  | { kind: "globalStats" }
  | { kind: "deck"; deckId: string }
  | { kind: "study"; deckId: string; runMode: RunMode; complexityFilter: Complexity[] | null; goal?: SessionGoal; shuffle?: boolean }
  | { kind: "stats"; deckId: string }
  | { kind: "shared"; deckData: Deck };

function App() {
  const [view, setView] = useState<View>({ kind: "home" });
  const {
    decks,
    addDeck,
    deleteDeck,
    updateDeck,
    addCard,
    deleteCard,
    editCard,
    importDeck,
    importCards,
    importDeckWithId,
    overwriteDeck,
    mergeDeck,
    reloadFromStorage,
  } = useDecks();
  const { runs, addRun, deleteRunsForDeck, getRunsForDeck } = useRuns();
  const srs = useSRS();
  const { settings, updateDailyGoal } = useSettings();

  // Parse share URL on mount
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#/share/")) {
      const encoded = hash.slice("#/share/".length);
      decodeDeck(encoded)
        .then((deck) => setView({ kind: "shared", deckData: deck }))
        .catch(() => {
          // Invalid share URL, go home
          window.location.hash = "";
        });
    }
  }, []);

  const currentDeck =
    view.kind !== "home" && view.kind !== "globalStats" && view.kind !== "shared"
      ? decks.find((d) => d.id === view.deckId)
      : undefined;

  // Per-card performance for the current deck view
  const deckCardPerf = useMemo((): Map<string, CardPerf> => {
    if (!currentDeck) return new Map();
    const deckSrs = srs.getSRSForDeck(currentDeck.id);
    const deckRuns = getRunsForDeck(currentDeck.id);

    // Aggregate attempts across all runs for this deck
    const attemptsMap = new Map<string, { total: number; weighted: number }>();
    for (const run of deckRuns) {
      for (const cr of run.results) {
        const cardId = cr.card.id;
        const graded = cr.attempts.filter(
          (a) => a.result === "correct" || a.result === "approximate" || a.result === "wrong"
        );
        if (graded.length === 0) continue;
        // Use last graded attempt per session
        const last = graded[graded.length - 1];
        const score = last.result === "correct" ? 1 : last.result === "approximate" ? 0.5 : 0;
        const prev = attemptsMap.get(cardId) ?? { total: 0, weighted: 0 };
        attemptsMap.set(cardId, { total: prev.total + 1, weighted: prev.weighted + score });
      }
    }

    const result = new Map<string, CardPerf>();
    for (const card of currentDeck.cards) {
      const agg = attemptsMap.get(card.id);
      const srsEntry = deckSrs.get(card.id);
      result.set(card.id, {
        attempts: agg?.total ?? 0,
        accuracy: agg ? agg.weighted / agg.total : 0,
        lastResult: srsEntry?.lastResult ?? null,
        srs: srsEntry,
      });
    }
    return result;
  }, [currentDeck, srs, getRunsForDeck]);

  // Build a filtered deck for study sessions
  const studyDeck = useMemo((): Deck | undefined => {
    if (view.kind !== "study" || !currentDeck) return undefined;

    let cards = currentDeck.cards;

    if (view.runMode === "due") {
      cards = srs.getDueCards(currentDeck);
    } else if (view.runMode === "weak") {
      cards = srs.getWeakCards(currentDeck);
    }

    if (view.complexityFilter) {
      const filterSet = new Set(view.complexityFilter);
      cards = cards.filter((c) => filterSet.has(c.complexity));
    }

    return { ...currentDeck, cards };
  }, [view, currentDeck, srs]);

  function goHome() {
    window.location.hash = "";
    setView({ kind: "home" });
  }

  if (view.kind === "shared") {
    const existingDeck = decks.find((d) => d.id === view.deckData.id);
    return (
      <SharedDeckView
        deck={view.deckData}
        existingDeck={existingDeck}
        onImportNew={() => importDeckWithId(view.deckData)}
        onOverwrite={() => overwriteDeck(view.deckData)}
        onMerge={() => mergeDeck(view.deckData)}
        onGoHome={goHome}
      />
    );
  }

  if (view.kind === "study" && studyDeck && studyDeck.cards.length > 0) {
    return (
      <div className="mx-auto w-[80%] p-4 sm:p-8">
        <StudySession
          deck={studyDeck}
          goal={view.goal}
          shuffle={view.shuffle ?? false}
          onExit={() => setView({ kind: "deck", deckId: studyDeck.id })}
          onRunComplete={(totalTimeMs, results) => {
            addRun(studyDeck.id, totalTimeMs, results);
            srs.updateAfterRun(studyDeck.id, results);
          }}
        />
      </div>
    );
  }

  if (view.kind === "globalStats") {
    return (
      <div className="mx-auto w-full max-w-3xl p-4 sm:p-8">
        <div className="flex justify-end mb-4">
          <ThemeToggle />
        </div>
        <GlobalStats
          decks={decks}
          allRuns={runs}
          srs={srs}
          onBack={goHome}
          onSelectDeck={(id) => setView({ kind: "deck", deckId: id })}
        />
      </div>
    );
  }

  if (view.kind === "stats" && currentDeck) {
    const deckRuns = getRunsForDeck(currentDeck.id);
    return (
      <div className="mx-auto w-full max-w-3xl p-4 sm:p-8">
        <div className="flex justify-end mb-4">
          <ThemeToggle />
        </div>
        <DeckStats
          deck={currentDeck}
          runs={deckRuns}
          srs={srs}
          onBack={() => setView({ kind: "deck", deckId: currentDeck.id })}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl p-4 sm:p-8">
      <div className="flex justify-end mb-4">
        <ThemeToggle />
      </div>

      {view.kind === "deck" && currentDeck ? (
        <DeckDetail
          deck={currentDeck}
          hasRuns={getRunsForDeck(currentDeck.id).length > 0}
          dueCount={srs.getDueCards(currentDeck).length}
          weakCount={srs.getWeakCards(currentDeck).length}
          cardPerf={deckCardPerf}
          onBack={() => setView({ kind: "home" })}
          onStartStudy={(runMode, complexityFilter, goal, shuffle) =>
            setView({ kind: "study", deckId: currentDeck.id, runMode, complexityFilter, goal, shuffle })
          }
          onViewStats={() =>
            setView({ kind: "stats", deckId: currentDeck.id })
          }
          onEditDeck={(title, tags, color, emoji) => updateDeck(currentDeck.id, title, tags, color, emoji)}
          onAddCard={(card) => addCard(currentDeck.id, card)}
          onEditCard={(cardId, card) => editCard(currentDeck.id, cardId, card)}
          onDeleteCard={(cardId) => deleteCard(currentDeck.id, cardId)}
          onDeleteDeck={() => {
            deleteRunsForDeck(currentDeck.id);
            srs.deleteSRSForDeck(currentDeck.id);
            deleteDeck(currentDeck.id);
            setView({ kind: "home" });
          }}
          onImportCards={(cards) => importCards(currentDeck.id, cards)}
        />
      ) : (
        <DeckList
          decks={decks}
          allRuns={runs}
          dailyGoal={settings.dailyCardGoal}
          onUpdateDailyGoal={updateDailyGoal}
          onSelectDeck={(id) => setView({ kind: "deck", deckId: id })}
          onAddDeck={(title, tags, color, emoji) => addDeck(title, tags, color, emoji)}
          onImportDeck={(data) => importDeck(data)}
          onImportApkg={(newDecks, srsEntries) => {
            for (const deck of newDecks) importDeckWithId(deck);
            srs.importSRS(srsEntries);
          }}
          onRestored={reloadFromStorage}
          onViewGlobalStats={() => setView({ kind: "globalStats" })}
        />
      )}
    </div>
  );
}

export default App;
