import type { AnswerResult, Card, CardAttempt, CardRunResult, ChoiceCard, SessionGoal } from "@/core/model";
import { wasAnswered } from "@/core/scheduler";

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
