import {
  type Card,
  type CardDisposition,
  type CardRunResult,
  type CardSchedule,
  DAY_MS,
  type Deck,
  type Millis,
  type RunRecord,
  millis,
} from "@/core/model";
import { NEW_SPACING, type Schedules, dueCards, dueTime, isAnswer, lastAnswer, nextSpacing, scheduleKey } from "@/core/scheduler";

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

export type DispositionCounts = Record<CardDisposition, number>;

/** How each card of a run went the first time it came up. */
export function firstTries(run: Pick<RunRecord, "results">): DispositionCounts {
  const counts: DispositionCounts = { correct: 0, approximate: 0, wrong: 0, skip: 0, save_for_later: 0 };
  for (const result of run.results) {
    const first = result.attempts[0];
    if (first !== undefined) counts[first.result]++;
  }
  return counts;
}

export const newestFirst = (runs: readonly RunRecord[]): RunRecord[] =>
  [...runs].sort((a, b) => b.completedAt - a.completedAt);

/** The time spent over `runs` and the cards they went through. */
export const totals = (runs: readonly RunRecord[]): { timeMs: number; cards: number } => ({
  timeMs: runs.reduce((sum, run) => sum + run.totalTimeMs, 0),
  cards: runs.reduce((sum, run) => sum + run.results.length, 0),
});

export type Timing = { readonly average: number; readonly fastest: number; readonly slowest: number; readonly perCard: number };

/** How long `runs` took: on average, the fastest and the slowest, and the mean time of a try. Null without runs. */
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
  readonly card: CardRunResult["card"];
  /** Runs that reached the card. */
  readonly timesStudied: number;
  /** Percent right of the answers, or null when never answered. */
  readonly accuracy: number | null;
  /** Mean time spent on the card in a run. */
  readonly averageMs: number;
  readonly schedule: CardSchedule | undefined;
};

/**
 * One row per card of the deck, and per card studied in a run and since removed, with what the
 * deck's runs say of it: cards never studied first, then never answered, then by accuracy, lowest
 * first. `schedules` is the deck's, by card id.
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
  const rows = [...seen.values()].map(({ card, results }): CardStat => {
    const answers = results.flatMap((r) => r.attempts).filter((a) => isAnswer(a.result));
    const times = results.map((r) => r.attempts.reduce((sum, a) => sum + a.durationMs, 0));
    return {
      card,
      timesStudied: results.length,
      accuracy: answers.length > 0 ? Math.round((answers.filter((a) => a.result === "correct").length / answers.length) * 100) : null,
      averageMs: times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0,
      schedule: schedules.get(card.id),
    };
  });
  const rank = (stat: CardStat): number => (stat.timesStudied === 0 ? -2 : (stat.accuracy ?? -1));
  return rows.sort((a, b) => rank(a) - rank(b));
}

export type TimelineEntry = { readonly at: Millis; readonly result: CardDisposition; readonly intervalAfter: number };

/** Each run that reached a card, oldest first, with the interval in days the scheduler gave after it. */
export function cardTimeline(cardId: string, runs: readonly RunRecord[]): TimelineEntry[] {
  const entries = runs
    .flatMap((run) =>
      run.results
        .filter((result) => result.card.id === cardId)
        .map((result) => ({ at: run.completedAt, result: lastAnswer(result.attempts) ?? result.attempts[0]?.result ?? "skip" })),
    )
    .sort((a, b) => a.at - b.at);
  let spacing = NEW_SPACING;
  let answeredAt: Millis | null = null;
  return entries.map((entry) => {
    if (isAnswer(entry.result)) {
      spacing = nextSpacing(spacing, entry.result, answeredAt === null ? Infinity : (entry.at - answeredAt) / DAY_MS);
      answeredAt = entry.at;
    }
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
  const due = record.schedule !== undefined && dueTime(record.schedule) <= now;
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
  /** Percent right on the first try, or null when nothing was answered. */
  readonly firstRight: number | null;
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
      firstRight: firstTryRight(own),
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

/** Cards that fall due after today: tomorrow, and on the five days after it. */
export function comingUp(decks: readonly Deck[], schedules: Schedules, now: Millis): { tomorrow: number; laterThisWeek: number } {
  const today = new Date(now);
  const dayStart = (offset: number) => new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset).getTime();
  const count = (from: number, to: number) =>
    decks.reduce(
      (sum, deck) =>
        sum +
        deck.cards.filter((card) => {
          const schedule = schedules.get(scheduleKey(deck.id, card.id));
          if (schedule === undefined) return false;
          const due = dueTime(schedule);
          return due >= from && due < to;
        }).length,
      0,
    );
  return { tomorrow: count(dayStart(1), dayStart(2)), laterThisWeek: count(dayStart(2), dayStart(7)) };
}

/** The deck of each card studied on the day of `moment`, in the order studied: the day's stickers. */
export const stickersOn = (runs: readonly RunRecord[], moment: Millis): string[] =>
  [...runs]
    .filter((run) => dayKey(run.completedAt) === dayKey(moment))
    .sort((a, b) => a.completedAt - b.completedAt)
    .flatMap((run) => run.results.map(() => run.deckId));

/** Percent of the cards answered on their first try that were right, rounded, or null when none was answered. */
export function firstTryRight(runs: readonly RunRecord[]): number | null {
  const firsts = runs.flatMap((run) => run.results.flatMap((result) => result.attempts[0]?.result ?? [])).filter(isAnswer);
  if (firsts.length === 0) return null;
  return Math.round((firsts.filter((result) => result === "correct").length / firsts.length) * 100);
}

/** `rows` with the deck that most needs study first: the fewest right the first time, then decks never answered. */
export const neediestFirst = (rows: readonly DeckRow[]): DeckRow[] =>
  [...rows].sort((a, b) => (a.firstRight ?? Infinity) - (b.firstRight ?? Infinity));

/** Each day of the month `back` months before that of `now`, from the first, with the decks studied on it, each deck once, and its count of cards. */
export function monthDays(runs: readonly RunRecord[], now: Millis, back = 0): { day: Date; decks: string[]; cards: number }[] {
  const today = new Date(now);
  const first = new Date(today.getFullYear(), today.getMonth() - back, 1);
  const length = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  return Array.from({ length }, (_, i) => {
    const day = new Date(first.getFullYear(), first.getMonth(), i + 1);
    const stickers = stickersOn(runs, millis(day.getTime()));
    return { day, decks: [...new Set(stickers)], cards: stickers.length };
  });
}

/** How many months before that of `now` the earliest run is, or 0 without runs. */
export function monthsBack(runs: readonly RunRecord[], now: Millis): number {
  if (runs.length === 0) return 0;
  const today = new Date(now);
  const first = new Date(Math.min(...runs.map((run) => run.completedAt)));
  return Math.max(0, (today.getFullYear() - first.getFullYear()) * 12 + today.getMonth() - first.getMonth());
}

/** The last seven days to today, each with the decks studied on it, each deck once. */
export function lastWeek(runs: readonly RunRecord[], now: Millis): { day: Date; decks: string[] }[] {
  const today = new Date(now);
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6 + i);
    return { day, decks: [...new Set(stickersOn(runs, millis(day.getTime())))] };
  });
}
