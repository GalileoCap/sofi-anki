import {
  type Card,
  type CardDisposition,
  type CardRunResult,
  type CardSchedule,
  type Complexity,
  DAY_MS,
  type Deck,
  type Millis,
  type RunRecord,
} from "@/core/model";
import { NEW_SPACING, type Schedules, dueCards, isAnswer, lastAnswer, nextSpacing } from "@/core/scheduler";

/** A calendar day in the browser's time zone, as `YYYY-MM-DD`. */
export type DayKey = string;

export function dayKey(moment: Millis | Date): DayKey {
  const d = new Date(moment);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const dayBefore = (d: Date): Date => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);

/** Days in a row with a run, ending today, or yesterday when today has none yet. */
export function streak(runs: readonly RunRecord[], now: Millis): number {
  const days = new Set(runs.map((run) => dayKey(run.completedAt)));
  const today = new Date(now);
  let cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (!days.has(dayKey(cursor))) cursor = dayBefore(cursor);
  let count = 0;
  while (days.has(dayKey(cursor))) {
    count++;
    cursor = dayBefore(cursor);
  }
  return count;
}

/** Cards studied on each day that has a run. */
export function cardsByDay(runs: readonly RunRecord[]): Map<DayKey, number> {
  const out = new Map<DayKey, number>();
  for (const run of runs) {
    const key = dayKey(run.completedAt);
    out.set(key, (out.get(key) ?? 0) + run.results.length);
  }
  return out;
}

/** Cards studied today. */
export const cardsToday = (runs: readonly RunRecord[], now: Millis): number =>
  cardsByDay(runs).get(dayKey(now)) ?? 0;

/**
 * The heatmap's weeks: the last `days` days to today, starting on a Monday, as columns of
 * up to seven days from Monday.
 */
export function heatmapWeeks(now: Millis, days: number): Date[][] {
  const today = new Date(now);
  const first = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (days - 1));
  const fromMonday = (first.getDay() + 6) % 7;
  const weeks: Date[][] = [];
  for (
    let d = new Date(first.getFullYear(), first.getMonth(), first.getDate() - fromMonday);
    d <= today;
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
  ) {
    if (d.getDay() === 1 || weeks.length === 0) weeks.push([]);
    weeks[weeks.length - 1].push(d);
  }
  return weeks;
}

/** Percent of answers that were correct, rounded, or null when nothing was answered. */
export function accuracy(runs: readonly RunRecord[]): number | null {
  const answers = runs.flatMap((run) => run.results.flatMap((r) => r.attempts)).filter((a) => isAnswer(a.result));
  if (answers.length === 0) return null;
  return Math.round((answers.filter((a) => a.result === "correct").length / answers.length) * 100);
}

export type DispositionCounts = Record<CardDisposition, number>;

/** How each card of a run went the first time it came up. */
export function firstTries(run: RunRecord): DispositionCounts {
  const counts: DispositionCounts = { correct: 0, approximate: 0, wrong: 0, skip: 0, save_for_later: 0 };
  for (const result of run.results) {
    const first = result.attempts[0];
    if (first !== undefined) counts[first.result]++;
  }
  return counts;
}

export const newestFirst = (runs: readonly RunRecord[]): RunRecord[] =>
  [...runs].sort((a, b) => b.completedAt - a.completedAt);

export type Timing = { readonly average: number; readonly fastest: number; readonly slowest: number; readonly perCard: number };

/** Run lengths and the mean time an attempt took, or null with no runs. */
export function timing(runs: readonly RunRecord[]): Timing | null {
  if (runs.length === 0) return null;
  const times = runs.map((run) => run.totalTimeMs);
  const attempts = runs.flatMap((run) => run.results.flatMap((r) => r.attempts));
  return {
    average: times.reduce((a, b) => a + b, 0) / times.length,
    fastest: Math.min(...times),
    slowest: Math.max(...times),
    perCard: attempts.length > 0 ? attempts.reduce((sum, a) => sum + a.durationMs, 0) / attempts.length : 0,
  };
}

export type CardStat = {
  readonly cardId: string;
  readonly title: string;
  readonly complexity: Complexity;
  readonly timesStudied: number;
  readonly correct: number;
  readonly approximate: number;
  readonly wrong: number;
  /** Percent correct of the answers, or null when never answered. */
  readonly accuracy: number | null;
  /** Mean time spent on the card in a run. */
  readonly averageMs: number;
  readonly schedule: CardSchedule | undefined;
};

/**
 * One row per card of the deck, then per card studied in a run and since removed, with what
 * the deck's runs say of it.
 */
export function cardStats(deck: Deck, runs: readonly RunRecord[], schedules: ReadonlyMap<string, CardSchedule>): CardStat[] {
  const seen = new Map<string, { card: CardRunResult["card"]; results: CardRunResult[] }>();
  for (const card of deck.cards) seen.set(card.id, { card, results: [] });
  for (const run of runs) {
    for (const result of run.results) {
      const entry = seen.get(result.card.id) ?? { card: result.card, results: [] };
      seen.set(result.card.id, { ...entry, results: [...entry.results, result] });
    }
  }
  return [...seen.values()].map(({ card, results }) => {
    const attempts = results.flatMap((r) => r.attempts);
    const count = (kind: CardDisposition) => attempts.filter((a) => a.result === kind).length;
    const answered = attempts.filter((a) => isAnswer(a.result)).length;
    const times = results.map((r) => r.attempts.reduce((sum, a) => sum + a.durationMs, 0));
    return {
      cardId: card.id,
      title: card.title,
      complexity: card.complexity,
      timesStudied: results.length,
      correct: count("correct"),
      approximate: count("approximate"),
      wrong: count("wrong"),
      accuracy: answered > 0 ? Math.round((count("correct") / answered) * 100) : null,
      averageMs: times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0,
      schedule: schedules.get(card.id),
    };
  });
}

export type TimelineEntry = { readonly at: Millis; readonly result: CardDisposition; readonly intervalAfter: number };

/** Each run that reached a card, oldest first, with the interval the scheduler gave after it. */
export function cardTimeline(cardId: string, runs: readonly RunRecord[]): TimelineEntry[] {
  const entries = runs
    .flatMap((run) =>
      run.results
        .filter((result) => result.card.id === cardId)
        .map((result) => ({ at: run.completedAt, result: lastAnswer(result.attempts) ?? result.attempts[0]?.result ?? "skip" })),
    )
    .sort((a, b) => a.at - b.at);
  let spacing = NEW_SPACING;
  return entries.map((entry) => {
    if (isAnswer(entry.result)) spacing = nextSpacing(spacing, entry.result);
    return { ...entry, intervalAfter: spacing.intervalDays };
  });
}

export type CardPerformance = {
  /** Runs in which the card was answered. */
  readonly runs: number;
  /** Mean score of the last answer in each, correct 1, approximate 0.5, wrong 0. */
  readonly score: number;
  readonly schedule: CardSchedule | undefined;
};

const answerScore = { correct: 1, approximate: 0.5, wrong: 0 } as const;

/** Each card of `deck` by id, with how it went over the deck's runs. */
export function cardPerformance(
  deck: Deck,
  runs: readonly RunRecord[],
  schedules: ReadonlyMap<string, CardSchedule>,
): Map<string, CardPerformance> {
  const scores = new Map<string, number[]>();
  for (const run of runs.filter((r) => r.deckId === deck.id)) {
    for (const result of run.results) {
      const answer = lastAnswer(result.attempts);
      if (answer !== null) scores.set(result.card.id, [...(scores.get(result.card.id) ?? []), answerScore[answer]]);
    }
  }
  return new Map(
    deck.cards.map((card) => {
      const list = scores.get(card.id) ?? [];
      const score = list.length > 0 ? list.reduce((a, b) => a + b, 0) / list.length : 0;
      return [card.id, { runs: list.length, score, schedule: schedules.get(card.id) }];
    }),
  );
}

/**
 * Where a card comes in a deck's list. Due cards whose last answer was wrong come first, then
 * the other due cards, the cards with no answer yet, and the rest by last answer from wrong to correct.
 */
function listRank(record: CardPerformance | undefined, now: Millis): number {
  if (record === undefined || record.runs === 0) return 2;
  const last = record.schedule?.lastResult;
  const due = record.schedule !== undefined && record.schedule.dueAt <= now;
  if (due) return last === "wrong" ? 0 : 1;
  return last === "wrong" ? 3 : last === "approximate" ? 4 : 5;
}

/** `cards` in the order a deck lists them, the ones most in need of study first. */
export const studyOrder = (cards: readonly Card[], byCard: ReadonlyMap<string, CardPerformance>, now: Millis): Card[] =>
  [...cards].sort((a, b) => listRank(byCard.get(a.id), now) - listRank(byCard.get(b.id), now));

export type DeckRow = {
  readonly deck: Deck;
  readonly runs: number;
  readonly lastRun: Millis | null;
  readonly accuracy: number | null;
  readonly due: number;
};

/** Each deck with its runs and due cards: decks with cards due first, then the most recently studied. */
export function deckRows(decks: readonly Deck[], runs: readonly RunRecord[], schedules: Schedules, now: Millis): DeckRow[] {
  const rows = decks.map((deck): DeckRow => {
    const own = runs.filter((run) => run.deckId === deck.id);
    return {
      deck,
      runs: own.length,
      lastRun: own.length > 0 ? newestFirst(own)[0].completedAt : null,
      accuracy: accuracy(own),
      due: dueCards(deck, schedules, now).length,
    };
  });
  const order = (row: DeckRow): [number, number] => [row.due > 0 ? 0 : 1, -(row.lastRun ?? -Infinity)];
  return rows.sort((a, b) => {
    const [ad, al] = order(a);
    const [bd, bl] = order(b);
    return ad - bd || al - bl || 0;
  });
}

/** Whole days from `now` until `moment`, rounded up. */
export const daysUntil = (moment: Millis, now: Millis): number => Math.ceil((moment - now) / DAY_MS);

/** Whole days from `moment` to `now`, rounded down. */
export const daysSince = (moment: Millis, now: Millis): number => Math.floor((now - moment) / DAY_MS);
