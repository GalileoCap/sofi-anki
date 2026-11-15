import type {
  AnswerResult,
  Card,
  CardAttempt,
  CardDisposition,
  CardRunResult,
  ChoiceCard,
  Complexity,
  Deck,
  Millis,
  RunMode,
  RunRecord,
  SessionGoal,
  Store,
} from "@/core/model";
import {
  type Schedules,
  dueCards,
  indexSchedules,
  newCards,
  scheduleKey,
  scheduleRun,
  wasAnswered,
  weakCards,
} from "@/core/scheduler";

/** `items` reordered by a Fisher-Yates shuffle driven by `randoms`, one number in [0, 1) per item. */
export function shuffled<T>(items: readonly T[], randoms: readonly number[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor((randoms[i] ?? 0) * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** The grade of a choice: every correct option and no other is correct, some correct is approximate. */
export function gradeChoice(card: ChoiceCard, selected: ReadonlySet<string>): AnswerResult {
  const correct = new Set(card.options.filter((o) => o.correct).map((o) => o.id));
  const picked = [...selected];
  if ([...correct].every((id) => selected.has(id)) && picked.every((id) => correct.has(id))) return "correct";
  return picked.some((id) => correct.has(id)) ? "approximate" : "wrong";
}

/** A run under way: the cards in order, the one shown, and what was done with each. */
export type RunState = {
  readonly queue: readonly Card[];
  readonly index: number;
  readonly results: ReadonlyMap<string, CardRunResult>;
  /** Cards done with, for a goal counted in cards. */
  readonly completed: number;
  /** Cards answered and asked for again later in this run. */
  readonly redoLater: ReadonlySet<string>;
  readonly undo: readonly RunState[];
};

/** How many steps back undo reaches. */
export const UNDO_DEPTH = 20;

export const startRun = (queue: readonly Card[]): RunState => ({
  queue,
  index: 0,
  results: new Map(),
  completed: 0,
  redoLater: new Set(),
  undo: [],
});

export const currentCard = (state: RunState): Card | undefined => state.queue[state.index];
export const isFinished = (state: RunState): boolean => state.index >= state.queue.length;

export type RunAction =
  | { readonly kind: "skip"; readonly durationMs: number }
  /** Shown again 2 to 10 cards later, at the place `random` picks. */
  | { readonly kind: "postpone"; readonly durationMs: number; readonly random: number }
  | {
      readonly kind: "answer";
      readonly result: AnswerResult;
      readonly durationMs: number;
      /** Ask again in this run: 5 cards later when wrong, 10 when approximate, at the end when correct. */
      readonly redoLater: boolean;
      readonly selectedOptionIds?: readonly string[];
    }
  | { readonly kind: "undo" }
  | { readonly kind: "finish" };

function record(results: ReadonlyMap<string, CardRunResult>, card: Card, attempt: CardAttempt) {
  const next = new Map(results);
  const attempts = next.get(card.id)?.attempts ?? [];
  next.set(card.id, { card, attempts: [...attempts, attempt] });
  return next;
}

/** `queue` with the card at `from` moved `offset` places later, or to the end when fewer remain. */
function moveLater(queue: readonly Card[], from: number, offset: number): Card[] {
  const next = [...queue];
  const [card] = next.splice(from, 1);
  next.splice(from + Math.min(offset, next.length - from), 0, card);
  return next;
}

function postponeOffset(queue: readonly Card[], index: number, random: number): number {
  const after = queue.length - index - 1;
  const least = Math.min(2, after);
  const most = Math.min(10, after);
  return least + Math.floor(random * (most - least + 1));
}

const without = (set: ReadonlySet<string>, id: string): Set<string> =>
  new Set([...set].filter((item) => item !== id));

/** The run after `action`. An action on a finished run changes nothing but undo. */
export function stepRun(state: RunState, action: RunAction): RunState {
  if (action.kind === "undo") return state.undo.at(-1) ?? state;
  const card = currentCard(state);
  if (card === undefined) return state;
  const saved = { ...state, undo: [...state.undo, state].slice(-UNDO_DEPTH) };
  switch (action.kind) {
    case "finish":
      return { ...state, index: state.queue.length };
    case "skip":
      return {
        ...saved,
        results: record(state.results, card, { result: "skip", durationMs: action.durationMs }),
        redoLater: without(state.redoLater, card.id),
        index: state.index + 1,
        completed: state.completed + 1,
      };
    case "postpone":
      return {
        ...saved,
        results: record(state.results, card, { result: "save_for_later", durationMs: action.durationMs }),
        queue: moveLater(state.queue, state.index, postponeOffset(state.queue, state.index, action.random)),
      };
    case "answer": {
      const attempt: CardAttempt = {
        result: action.result,
        durationMs: action.durationMs,
        ...(action.selectedOptionIds ? { selectedOptionIds: [...action.selectedOptionIds] } : {}),
      };
      const results = record(state.results, card, attempt);
      if (!action.redoLater) {
        return {
          ...saved,
          results,
          redoLater: without(state.redoLater, card.id),
          index: state.index + 1,
          completed: state.completed + 1,
        };
      }
      const offset = action.result === "correct" ? state.queue.length : action.result === "wrong" ? 5 : 10;
      return {
        ...saved,
        results,
        redoLater: new Set([...state.redoLater, card.id]),
        queue: moveLater(state.queue, state.index, offset),
      };
    }
  }
}

/** The results worth keeping when a run is left early: the cards answered at least once. */
export const answeredResults = (state: RunState): CardRunResult[] =>
  [...state.results.values()].filter((result) => wasAnswered(result.attempts));

/** Whether the run has met its goal, given the time studied so far. */
export const goalReached = (goal: SessionGoal, state: RunState, elapsedMs: number): boolean =>
  goal.type === "cards" ? state.completed >= goal.value : elapsedMs >= goal.value * 60_000;

/** The store with `run` kept and the schedules of the cards it answered moved on. */
export const withRun = (store: Store, run: RunRecord): Store => ({
  ...store,
  runs: [...store.runs, run],
  schedules: [...scheduleRun(indexSchedules(store.schedules), run.deckId, run.results, run.completedAt).values()],
});

/** A card in a run, with the deck it comes from. */
export type RunItem = { readonly deckId: string; readonly card: Card };

/** A run's queue: each card under its schedule key, since a card id is unique only within its deck. */
export const runQueue = (items: readonly RunItem[]): Card[] =>
  items.map(({ deckId, card }) => ({ ...card, id: scheduleKey(deckId, card.id) }));

/**
 * The runs a run is kept as, one per deck it studied, so each stored run belongs to one deck as
 * every run before did. Each card is back under its own id, and each deck takes the share of
 * `totalTimeMs` its cards took.
 */
export function runsByDeck(
  results: readonly CardRunResult[],
  items: readonly RunItem[],
  completedAt: Millis,
  totalTimeMs: number,
  newId: () => string,
): RunRecord[] {
  const byKey = new Map(items.map((item) => [scheduleKey(item.deckId, item.card.id), item]));
  const groups = new Map<string, CardRunResult[]>();
  for (const result of results) {
    const item = byKey.get(result.card.id);
    if (item === undefined) continue;
    groups.set(item.deckId, [...(groups.get(item.deckId) ?? []), { card: item.card, attempts: result.attempts }]);
  }
  const spent = (list: readonly CardRunResult[]) => list.reduce((sum, r) => sum + r.attempts.reduce((s, a) => s + a.durationMs, 0), 0);
  const whole = spent([...groups.values()].flat());
  return [...groups].map(([deckId, list]) => ({
    id: newId(),
    deckId,
    completedAt,
    totalTimeMs: Math.round(whole > 0 ? (totalTimeMs * spent(list)) / whole : totalTimeMs / groups.size),
    results: list,
  }));
}

/** The store with each of `runs` kept. */
export const withRuns = (store: Store, runs: readonly RunRecord[]): Store => runs.reduce(withRun, store);

/** The cards due at `now` across `decks`, deck by deck in the order given. */
export const dueItems = (decks: readonly Deck[], schedules: Schedules, now: Millis): RunItem[] =>
  decks.flatMap((deck) => dueCards(deck, schedules, now).map((card) => ({ deckId: deck.id, card })));

/** `cards` of `deck` as a run's items. */
export const deckItems = (deck: Deck, cards: readonly Card[]): RunItem[] => cards.map((card) => ({ deckId: deck.id, card }));

/** The cards behind, put off to later in the run, and still ahead. */
export function progress(state: RunState): { done: number; redo: number; pending: number; total: number } {
  const total = state.queue.length;
  return { done: state.index, redo: state.redoLater.size, pending: total - state.index - state.redoLater.size, total };
}

/** The run's whole time at the pace so far, or null before any card is done. */
export const estimatedTotal = (state: RunState, elapsedMs: number): number | null =>
  state.completed === 0 ? null : elapsedMs + (elapsedMs / state.completed) * (state.queue.length - state.index);

/** The results grouped by what was done with each card the first time. */
export function byFirstTry(results: readonly CardRunResult[]): Map<CardDisposition, CardRunResult[]> {
  const groups = new Map<CardDisposition, CardRunResult[]>();
  for (const result of results) {
    const first = result.attempts[0]?.result ?? "skip";
    groups.set(first, [...(groups.get(first) ?? []), result]);
  }
  return groups;
}

/** Whether every card was right the first time. */
export const isPerfect = (results: readonly CardRunResult[]): boolean =>
  results.length > 0 && results.every((result) => result.attempts[0]?.result === "correct");

/** What a run studies: the mode's cards of `deck`, kept to `complexities` when given. */
export type RunChoice = { readonly mode: RunMode; readonly complexities: readonly Complexity[] | null };

/** The cards a run of `deck` studies, in the deck's order. */
export function runCards(
  deck: Deck,
  choice: RunChoice,
  schedules: Schedules,
  runs: readonly RunRecord[],
  now: Millis,
): Card[] {
  const byMode = {
    all: () => deck.cards,
    due: () => dueCards(deck, schedules, now),
    weak: () => weakCards(deck, schedules),
    new: () => newCards(deck, runs),
  }[choice.mode]();
  const kept = choice.complexities === null ? null : new Set(choice.complexities);
  return kept === null ? [...byMode] : byMode.filter((card) => kept.has(card.complexity));
}
