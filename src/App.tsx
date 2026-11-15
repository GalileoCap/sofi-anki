import { useState } from "react";

import { DeckDetail } from "@/components/deck-detail";
import { DeckStats } from "@/components/deck-stats";
import { GlobalStats } from "@/components/global-stats";
import { Page } from "@/components/page";
import { SharedDeckView } from "@/components/shared-deck-view";
import { StudySession } from "@/components/study-session";
import { useLanguage } from "@/contexts/language-context";
import { cardFromJson } from "@/core/deck-json";
import {
  type CardDraft,
  addCards,
  cardFromDraft,
  receiveDeck,
  removeCard,
  removeDeck,
  replaceCard,
  restyleDeck,
} from "@/core/decks";
import type { AnswerResult, CardRunResult, CardSchedule, Deck, SessionGoal, Store } from "@/core/model";
import { type RunChoice, runCards } from "@/core/run";
import { deckSchedules, indexSchedules, newCards, scheduleRun, weakCards, dueCards, withoutDeck } from "@/core/scheduler";
import { decodeDeck, sharedPart } from "@/core/share";
import { cardPerformance } from "@/core/stats";
import { newId, now } from "@/effects/clock";
import { clearHash, pageHash } from "@/effects/page";
import { useStore } from "@/hooks/use-store";
import { looks } from "@/lib/looks";
import { Home } from "@/pages/home";

/** A card's record over its deck's runs, as the deck screen shows it. */
export interface CardPerf {
  attempts: number;
  /** The mean score of its answers, from 0 to 1. */
  accuracy: number;
  lastResult: AnswerResult | null;
  srs: CardSchedule | undefined;
}

type View =
  | { kind: "home" }
  | { kind: "globalStats" }
  | { kind: "deck"; deckId: string }
  | { kind: "study"; deckId: string; choice: RunChoice; goal?: SessionGoal; shuffle?: boolean }
  | { kind: "stats"; deckId: string }
  | { kind: "shared"; deck: Deck };

/** The view a page opens on: the shared deck its link carries, else the home screen. */
function openingView(): View {
  const encoded = sharedPart(pageHash());
  if (encoded === null) return { kind: "home" };
  return decodeDeck(encoded).match(
    (deck): View => ({ kind: "shared", deck }),
    (): View => {
      clearHash();
      return { kind: "home" };
    },
  );
}

const withDecks = (change: (decks: readonly Deck[]) => Deck[]) => (store: Store): Store => ({ ...store, decks: change(store.decks) });

export default function App({ initial }: { initial: Store }) {
  const { store, update, saveError } = useStore(initial);
  const [view, setView] = useState<View>(openingView);
  const [openedAt] = useState(now);
  const { t } = useLanguage();
  const { decks, runs } = store;
  const schedules = indexSchedules(store.schedules);

  const draftCard = (draft: CardDraft, id: string) => cardFromDraft(draft, id, newId);

  function finishRun(deckId: string, totalTimeMs: number, results: CardRunResult[]) {
    const at = now();
    const run = { id: newId(), deckId, completedAt: at, totalTimeMs, results };
    update((s) => ({
      ...s,
      runs: [...s.runs, run],
      schedules: [...scheduleRun(indexSchedules(s.schedules), deckId, results, at).values()],
    }));
  }

  function deleteDeck(deckId: string) {
    update((s) => ({
      ...s,
      decks: removeDeck(s.decks, deckId),
      runs: s.runs.filter((run) => run.deckId !== deckId),
      schedules: [...withoutDeck(indexSchedules(s.schedules), deckId).values()],
    }));
    setView({ kind: "home" });
  }

  function goHome() {
    clearHash();
    setView({ kind: "home" });
  }

  const banner = saveError && <p className="bg-destructive/10 p-2 text-center text-sm text-destructive">{t("store.saveRefused")}</p>;
  const deck = "deckId" in view ? decks.find((d) => d.id === view.deckId) : undefined;

  if (view.kind === "shared") {
    const shared = view.deck;
    return (
      <>
        {banner}
        <SharedDeckView
          deck={shared}
          existingDeck={decks.find((d) => d.id === shared.id)}
          onImportNew={() => update(withDecks((d) => receiveDeck(d, shared, "merge")))}
          onOverwrite={() => update(withDecks((d) => receiveDeck(d, shared, "overwrite")))}
          onMerge={() => update(withDecks((d) => receiveDeck(d, shared, "merge")))}
          onGoHome={goHome}
        />
      </>
    );
  }

  if (view.kind === "study" && deck) {
    const studied = { ...deck, cards: runCards(deck, view.choice, schedules, runs, openedAt) };
    if (studied.cards.length > 0) {
      return (
        <div className={looks.page}>
          {banner}
          <StudySession
            deck={studied}
            goal={view.goal}
            shuffle={view.shuffle ?? false}
            onExit={() => setView({ kind: "deck", deckId: deck.id })}
            onRunComplete={(totalTimeMs, results) => finishRun(deck.id, totalTimeMs, results)}
          />
        </div>
      );
    }
  }

  if (view.kind === "globalStats") {
    return (
      <Page>
        {banner}
        <GlobalStats
          decks={[...decks]}
          allRuns={[...runs]}
          schedules={schedules}
          onBack={goHome}
          onSelectDeck={(id) => setView({ kind: "deck", deckId: id })}
        />
      </Page>
    );
  }

  if (view.kind === "stats" && deck) {
    return (
      <Page>
        {banner}
        <DeckStats
          deck={deck}
          runs={runs.filter((run) => run.deckId === deck.id)}
          schedules={schedules}
          onBack={() => setView({ kind: "deck", deckId: deck.id })}
        />
      </Page>
    );
  }

  if (view.kind === "deck" && deck) {
    const performance = cardPerformance(deck, runs, deckSchedules(schedules, deck.id));
    const cardPerf = new Map(
      [...performance].map(([id, p]): [string, CardPerf] => [
        id,
        { attempts: p.runs, accuracy: p.score, lastResult: p.schedule?.lastResult ?? null, srs: p.schedule },
      ]),
    );
    return (
      <Page>
        {banner}
        <DeckDetail
          deck={deck}
          hasRuns={runs.some((run) => run.deckId === deck.id)}
          dueCount={dueCards(deck, schedules, openedAt).length}
          weakCount={weakCards(deck, schedules).length}
          newCount={newCards(deck, runs).length}
          cardPerf={cardPerf}
          schedules={schedules}
          onBack={() => setView({ kind: "home" })}
          onStartStudy={(mode, complexities, goal, shuffle) =>
            setView({ kind: "study", deckId: deck.id, choice: { mode, complexities }, goal, shuffle })
          }
          onViewStats={() => setView({ kind: "stats", deckId: deck.id })}
          onEditDeck={(title, tags, color, emoji) => update(withDecks((d) => restyleDeck(d, deck.id, { title, tags, color, emoji })))}
          onAddCard={(draft) => update(withDecks((d) => addCards(d, deck.id, [draftCard(draft, newId())])))}
          onEditCard={(cardId, draft) => update(withDecks((d) => replaceCard(d, deck.id, draftCard(draft, cardId))))}
          onDeleteCard={(cardId) => update(withDecks((d) => removeCard(d, deck.id, cardId)))}
          onDeleteDeck={() => deleteDeck(deck.id)}
          onImportCards={(cards) => update(withDecks((d) => addCards(d, deck.id, cards.map((c) => cardFromJson(c, newId)))))}
        />
      </Page>
    );
  }

  return (
    <Page>
      {banner}
      <Home
        store={store}
        update={update}
        now={openedAt}
        onOpenDeck={(id) => setView({ kind: "deck", deckId: id })}
        onOpenStats={() => setView({ kind: "globalStats" })}
      />
    </Page>
  );
}
