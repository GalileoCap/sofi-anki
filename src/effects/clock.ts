import { type Millis, millis } from "@/core/model";

/**
 * The moment now.
 *
 * @effects clock
 */
export const now = (): Millis => millis(Date.now());

/**
 * A fresh id for a deck, a card, an option or a run.
 *
 * @effects randomness
 */
export const newId = (): string => crypto.randomUUID();

/**
 * A number in [0, 1).
 *
 * @effects randomness
 */
export const random = (): number => Math.random();

/**
 * `count` numbers in [0, 1), for a shuffle.
 *
 * @effects randomness
 */
export const randoms = (count: number): number[] => Array.from({ length: count }, () => Math.random());
