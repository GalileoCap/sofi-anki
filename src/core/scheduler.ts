import {
  type AnswerResult,
  type Card,
  type CardAttempt,
  type CardDisposition,
  type CardRunResult,
  type CardSchedule,
  DAY_MS,
  type Deck,
  type Millis,
  type RunRecord,
  answerResults,
  millis,
} from "@/core/model";

/** The ease of a card never studied. */
export const DEFAULT_EASE = 2.5;
/** The ease never drops below this. */
export const MIN_EASE = 1.3;

/** A card's spacing: days until it is due again, and how fast that grows. */
export type Spacing = { readonly intervalDays: number; readonly easeFactor: number };
export const NEW_SPACING: Spacing = { intervalDays: 0, easeFactor: DEFAULT_EASE };

/** No interval runs past a year: a card comes back at least once a year. */
export const MAX_INTERVAL_DAYS = 365;

/**
 * The spacing after an answer given `daysSince` days after the card's last answer (`Infinity`
 * for its first). Correct grows the interval by the ease (one day the first time) and raises
 * the ease. Answered before it was due, the card grows only from the days that passed, keeps at
 * least its interval, and keeps its ease. Approximate keeps the interval, at least a day. Wrong
 * starts over and lowers the ease. No interval passes `MAX_INTERVAL_DAYS`.
 */
export function nextSpacing(spacing: Spacing, result: AnswerResult, daysSince: number): Spacing {
  const { intervalDays, easeFactor } = spacing;
  const capped = (days: number): number => Math.min(MAX_INTERVAL_DAYS, days);
  switch (result) {
    case "correct": {
      if (intervalDays === 0) return { intervalDays: 1, easeFactor: easeFactor + 0.1 };
      const early = daysSince < intervalDays;
      const grown = Math.round(Math.min(intervalDays, daysSince) * easeFactor);
      return {
        intervalDays: capped(Math.max(1, intervalDays, grown)),
        easeFactor: early ? easeFactor : easeFactor + 0.1,
      };
    }
    case "approximate":
      return { intervalDays: capped(Math.max(1, intervalDays)), easeFactor };
    case "wrong":
      return { intervalDays: 0, easeFactor: Math.max(MIN_EASE, easeFactor - 0.2) };
  }
}

/** When the card was last answered: its due moment less its interval. */
const lastAnsweredAt = (schedule: CardSchedule): number => schedule.dueAt - schedule.intervalDays * DAY_MS;

/**
 * When a card is due. A schedule stored before the ceiling may lie decades out, so it counts as
 * due at most `MAX_INTERVAL_DAYS` after its last answer. The stored value is left as it is.
 */
export const dueTime = (schedule: CardSchedule): Millis =>
  millis(Math.min(schedule.dueAt, lastAnsweredAt(schedule) + MAX_INTERVAL_DAYS * DAY_MS));

/** Whether a disposition is an answer, as against a skip or a postponement. */
export const isAnswer = (result: CardDisposition): result is AnswerResult =>
  (answerResults as readonly string[]).includes(result);

const isGraded = (attempt: CardAttempt): attempt is CardAttempt & { result: AnswerResult } => isAnswer(attempt.result);

/** The last answer given in a run's attempts at one card, skips and postponements aside. */
export function lastAnswer(attempts: readonly CardAttempt[]): AnswerResult | null {
  const graded = attempts.filter(isGraded);
  return graded.at(-1)?.result ?? null;
}

/** Whether any attempt was answered. */
export const wasAnswered = (attempts: readonly CardAttempt[]): boolean => attempts.some(isGraded);

/** The key a schedule is found by: a card id is unique only within its deck. */
export const scheduleKey = (deckId: string, cardId: string): string => `${deckId}:${cardId}`;

export type Schedules = ReadonlyMap<string, CardSchedule>;

export function indexSchedules(list: readonly CardSchedule[]): Schedules {
  return new Map(list.map((schedule) => [scheduleKey(schedule.deckId, schedule.cardId), schedule]));
}

/** The schedules after a run of `deckId` that ended at `now`: each answered card moves on. */
export function scheduleRun(
  schedules: Schedules,
  deckId: string,
  results: readonly CardRunResult[],
  now: Millis,
): Map<string, CardSchedule> {
  const next = new Map(schedules);
  for (const { card, attempts } of results) {
    const answer = lastAnswer(attempts);
    if (answer === null) continue;
    const key = scheduleKey(deckId, card.id);
    const previous = next.get(key);
    const daysSince = previous === undefined ? Infinity : (now - lastAnsweredAt(previous)) / DAY_MS;
    const spacing = nextSpacing(previous ?? NEW_SPACING, answer, daysSince);
    next.set(key, {
      cardId: card.id,
      deckId,
      ...spacing,
      dueAt: millis(now + spacing.intervalDays * DAY_MS),
      lastResult: answer,
    });
  }
  return next;
}

/** The days until a card comes back if `result` is its answer at `now`: 0 is again today. */
export function intervalAfter(schedule: CardSchedule | undefined, result: AnswerResult, now: Millis): number {
  const daysSince = schedule === undefined ? Infinity : (now - lastAnsweredAt(schedule)) / DAY_MS;
  return nextSpacing(schedule ?? NEW_SPACING, result, daysSince).intervalDays;
}

/** Cards due at `now`. A card never studied is due. */
export const dueCards = (deck: Deck, schedules: Schedules, now: Millis): Card[] =>
  deck.cards.filter((card) => {
    const schedule = schedules.get(scheduleKey(deck.id, card.id));
    return schedule === undefined || dueTime(schedule) <= now;
  });

/** Cards whose last answer was wrong or approximate. */
export const weakCards = (deck: Deck, schedules: Schedules): Card[] =>
  deck.cards.filter((card) => {
    const last = schedules.get(scheduleKey(deck.id, card.id))?.lastResult;
    return last === "wrong" || last === "approximate";
  });

/** Cards no run of the deck has reached. */
export function newCards(deck: Deck, runs: readonly RunRecord[]): Card[] {
  const studied = new Set(
    runs
      .filter((run) => run.deckId === deck.id)
      .flatMap((run) => run.results.filter((result) => wasAnswered(result.attempts)))
      .map((result) => result.card.id),
  );
  return deck.cards.filter((card) => !studied.has(card.id));
}

/** The schedules of one deck, by card id. */
export function deckSchedules(schedules: Schedules, deckId: string): Map<string, CardSchedule> {
  return new Map(
    [...schedules.values()].filter((s) => s.deckId === deckId).map((s) => [s.cardId, s]),
  );
}

/** The schedules of every deck but `deckId`. */
export const withoutDeck = (schedules: Schedules, deckId: string): Map<string, CardSchedule> =>
  new Map([...schedules].filter(([, schedule]) => schedule.deckId !== deckId));
