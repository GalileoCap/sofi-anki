import { describe, expect, test } from "vitest";

import { type Card, type CardSchedule, DAY_MS, type Deck, millis } from "@/core/model";
import { type Schedules, dueCards, indexSchedules, scheduleKey, scheduleRun } from "@/core/scheduler";

/**
 * O3 (cards come back around when they would be forgotten): a card answered before it is due
 * must not be pushed out by years, and no interval runs past a year. A card that is never due
 * again is lost to study without a word, so these stay.
 */

const card: Card = { id: "c", type: "standard", title: "c", response: "", complexity: "medium", tags: [] };
const deck: Deck = { id: "d", title: "d", tags: [], cards: [card], createdAt: millis(0) };

const answerCorrect = (schedules: Schedules, day: number): Schedules =>
  scheduleRun(schedules, deck.id, [{ card, attempts: [{ result: "correct", durationMs: 1 }] }], millis(day * DAY_MS));

const intervalOf = (schedules: Schedules): number => schedules.get(scheduleKey(deck.id, card.id))?.intervalDays ?? 0;

describe("early answers and the interval ceiling", () => {
  test("a card answered correctly every day keeps a short interval", () => {
    let schedules: Schedules = indexSchedules([]);
    for (let day = 0; day < 12; day++) schedules = answerCorrect(schedules, day);
    expect(intervalOf(schedules)).toBeLessThanOrEqual(3);
  });

  test("answered each time it falls due, a card's interval stops at a year", () => {
    let schedules: Schedules = indexSchedules([]);
    let day = 0;
    for (let i = 0; i < 12; i++) {
      schedules = answerCorrect(schedules, day);
      day += intervalOf(schedules);
    }
    expect(intervalOf(schedules)).toBe(365);
  });

  test("a stored schedule decades long is due a year after its last answer", () => {
    const lastAnswer = 1_000 * DAY_MS;
    const stored: CardSchedule = {
      cardId: card.id,
      deckId: deck.id,
      intervalDays: 74_766,
      easeFactor: 3.6,
      dueAt: millis(lastAnswer + 74_766 * DAY_MS),
      lastResult: "correct",
    };
    const schedules = indexSchedules([stored]);
    expect(dueCards(deck, schedules, millis(lastAnswer + 364 * DAY_MS))).toEqual([]);
    expect(dueCards(deck, schedules, millis(lastAnswer + 365 * DAY_MS))).toEqual([card]);
  });
});
