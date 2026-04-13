/**
 * Demo seed — loaded once on first launch when localStorage is empty.
 * Provides a JavaScript Fundamentals deck with 3 weeks of realistic run history.
 */
import type { AnswerResult, Card, CardSRS, Deck, RunRecord } from "@/types";
import { loadDecks, saveDecks, saveRuns, saveSRS } from "@/lib/storage";

const DECK_ID = "demo-js-v1";
const DAY = 86_400_000;

// ─── Card IDs ────────────────────────────────────────────────────────────────

const ID = {
  letConst:   "demo-c01",
  exponent:   "demo-c02",
  equality:   "demo-c03",
  typeofNull: "demo-c04",
  optional:   "demo-c05",
  newArray:   "demo-c06",
  closure:    "demo-c07",
  promiseAll: "demo-c08",
  mutating:   "demo-c09",
  bubbling:   "demo-c10",
  arrayFrom:  "demo-c11",
  symbol:     "demo-c12",
};

// ─── Deck definition ─────────────────────────────────────────────────────────

function buildDeck(now: number): Deck {
  return {
    id: DECK_ID,
    title: "JavaScript Fundamentals",
    emoji: "⚡",
    color: "#f59e0b",
    tags: ["javascript", "web"],
    createdAt: now - 25 * DAY,
    cards: [
      // ── Easy ──────────────────────────────────────────────────────────────
      {
        id: ID.letConst,
        type: "standard",
        title: "What's the difference between `let` and `const`?",
        response:
          "`let` allows reassignment; `const` does not. Both are **block-scoped**.\n\n" +
          "```js\nlet x = 1;\nx = 2; // ✓\n\nconst y = 1;\ny = 2; // ✗ TypeError\n```\n\n" +
          "> `const` prevents **rebinding**, but object/array contents can still be mutated.",
        complexity: "easy",
        tags: ["basics"],
      },
      {
        id: ID.exponent,
        type: "standard",
        title: "What does the `**` operator do?",
        response:
          "The **exponentiation operator** raises the left operand to the power of the right.\n\n" +
          "```js\n2 ** 10  // 1024\n3 ** 3   // 27\n```\n\n" +
          "Equivalent to `Math.pow(a, b)` but more concise.",
        hint: 'Think "to the power of" — `2 ** 3` is "2 to the 3rd power".',
        complexity: "easy",
        tags: ["operators"],
      },
      {
        id: ID.equality,
        type: "standard",
        title: "What is the difference between `==` and `===`?",
        response:
          "`===` (strict) checks **value AND type** — no coercion.\n\n" +
          "`==` (loose) coerces types before comparing.\n\n" +
          "```js\n1 == '1'   // true  (coercion)\n1 === '1'  // false\n\n" +
          "null == undefined   // true\nnull === undefined  // false\n```\n\n" +
          "**Always prefer `===`** unless you explicitly need type coercion.",
        complexity: "easy",
        tags: ["basics"],
      },
      {
        id: ID.typeofNull,
        type: "choice",
        title: "What does `typeof null` return?",
        hint: "One of JavaScript's most famous bugs — unfixable for backwards-compatibility reasons.",
        complexity: "easy",
        tags: ["quirks"],
        multiSelect: false,
        options: [
          { id: "tn-a", text: "`\"object\"`", correct: true },
          { id: "tn-b", text: "`\"null\"`",   correct: false },
          { id: "tn-c", text: "`\"undefined\"`", correct: false },
          { id: "tn-d", text: "`\"number\"`",  correct: false },
        ],
      },
      {
        id: ID.optional,
        type: "standard",
        title: "What does optional chaining (`?.`) do?",
        response:
          "Safely accesses nested properties. Returns `undefined` instead of throwing if an intermediate value is `null` or `undefined`.\n\n" +
          "```js\nconst city = user?.address?.city;\n// undefined if user or address is nullish\n\n" +
          "const len = arr?.length;\nconst val = fn?.();\n```",
        complexity: "easy",
        tags: ["syntax"],
      },
      {
        id: ID.newArray,
        type: "choice",
        title: "Which of these return a **new** array? (select all that apply)",
        complexity: "easy",
        tags: ["arrays"],
        multiSelect: true,
        options: [
          { id: "na-a", text: "`.map()`",     correct: true  },
          { id: "na-b", text: "`.forEach()`", correct: false },
          { id: "na-c", text: "`.filter()`",  correct: true  },
          { id: "na-d", text: "`.push()`",    correct: false },
        ],
      },

      // ── Medium ────────────────────────────────────────────────────────────
      {
        id: ID.closure,
        type: "standard",
        title: "What is a closure?",
        response:
          "A function that **retains access** to its enclosing scope's variables even after the outer function has returned.\n\n" +
          "```js\nfunction makeCounter() {\n  let count = 0;\n  return () => ++count;\n}\n\n" +
          "const inc = makeCounter();\ninc(); // 1\ninc(); // 2\n```\n\n" +
          "Closures power data privacy, partial application, and memoization.",
        hint: 'Think of a function "closing over" variables from its surrounding scope — it takes them with it.',
        complexity: "medium",
        tags: ["functions"],
      },
      {
        id: ID.promiseAll,
        type: "standard",
        title: "What does `Promise.all()` do?",
        response:
          "Runs multiple promises **in parallel** and resolves with an array of results when ALL resolve. Rejects immediately if **any** promise rejects.\n\n" +
          "```js\nconst [user, posts] = await Promise.all([\n  fetchUser(id),\n  fetchPosts(id),\n]);\n```\n\n" +
          "Use `Promise.allSettled()` if you want all results even when some fail.",
        complexity: "medium",
        tags: ["async"],
      },
      {
        id: ID.mutating,
        type: "choice",
        title: "Which Array methods **mutate** the original array? (select all)",
        complexity: "medium",
        tags: ["arrays"],
        multiSelect: true,
        options: [
          { id: "mu-a", text: "`.push()`",    correct: true  },
          { id: "mu-b", text: "`.map()`",     correct: false },
          { id: "mu-c", text: "`.sort()`",    correct: true  },
          { id: "mu-d", text: "`.splice()`",  correct: true  },
          { id: "mu-e", text: "`.filter()`",  correct: false },
          { id: "mu-f", text: "`.reverse()`", correct: true  },
        ],
      },
      {
        id: ID.bubbling,
        type: "standard",
        title: "What is event bubbling?",
        response:
          "When an event fires on an element, it **propagates upward** through ancestor elements in the DOM.\n\n" +
          "```js\n// Listener on #parent fires after #child's listener\n" +
          "child.addEventListener('click', e => { /* fires first */ });\n" +
          "parent.addEventListener('click', e => { /* fires second */ });\n```\n\n" +
          "- `event.stopPropagation()` — stops bubbling\n" +
          "- `event.target` — the element originally clicked\n" +
          "- `event.currentTarget` — the element the listener is on",
        hint: 'Events "bubble up" from child to parent, like bubbles rising in water.',
        complexity: "medium",
        tags: ["DOM"],
      },

      // ── Hard ──────────────────────────────────────────────────────────────
      {
        id: ID.arrayFrom,
        type: "choice",
        title: "What does `Array.from({length: 3}, (_, i) => i)` return?",
        hint: "The second argument is a map function — `_` is the (undefined) element value, `i` is the index.",
        complexity: "hard",
        tags: ["arrays"],
        multiSelect: false,
        options: [
          { id: "af-a", text: "`[0, 1, 2]`",                      correct: true  },
          { id: "af-b", text: "`[1, 2, 3]`",                      correct: false },
          { id: "af-c", text: "`[undefined, undefined, undefined]`", correct: false },
          { id: "af-d", text: "Throws a TypeError",                correct: false },
        ],
      },
      {
        id: ID.symbol,
        type: "standard",
        title: "What is a `Symbol` and when would you use one?",
        response:
          "A **unique, immutable primitive** — no two symbols are ever equal, even with the same description.\n\n" +
          "```js\nSymbol('x') === Symbol('x') // false!\n```\n\n" +
          "**Use cases:**\n" +
          "- **Unique property keys** that won't clash with other code or libraries\n" +
          "- **Well-known symbols** (`Symbol.iterator`, `Symbol.toPrimitive`) to hook into built-in behaviour\n\n" +
          "```js\nconst KEY = Symbol('myKey');\nobj[KEY] = 'value'; // won't clash with any string key\n```",
        hint: 'Think "guaranteed unique key" — perfect when a property name must never accidentally collide.',
        complexity: "hard",
        tags: ["types"],
      },
    ],
  };
}

// ─── Run schedule & results ───────────────────────────────────────────────────

// Days ago for each of the 11 mock runs.
// Last 7 are consecutive → streak of 7.
const RUN_OFFSETS = [21, 16, 12, 9, 7, 6, 5, 4, 3, 2, 1];

type R = AnswerResult;
const CR: R = "correct";
const AP: R = "approximate";
const WR: R = "wrong";

// Results per card, one entry per run in RUN_OFFSETS order.
const CARD_RESULTS: Record<string, R[]> = {
  //              [21, 16, 12,  9,  7,  6,  5,  4,  3,  2,  1]  days ago
  [ID.letConst]:  [WR, CR, CR, CR, CR, CR, CR, CR, CR, CR, CR],
  [ID.exponent]:  [CR, CR, CR, CR, CR, CR, CR, CR, CR, CR, CR],
  [ID.equality]:  [WR, AP, CR, CR, CR, CR, CR, CR, CR, CR, CR],
  [ID.typeofNull]:[WR, WR, CR, CR, CR, CR, CR, CR, CR, CR, CR],
  [ID.optional]:  [CR, CR, CR, CR, CR, CR, CR, CR, CR, CR, CR],
  [ID.newArray]:  [WR, WR, AP, CR, CR, AP, CR, CR, CR, CR, AP],
  [ID.closure]:   [WR, WR, AP, WR, AP, CR, AP, CR, AP, WR, AP],
  [ID.promiseAll]:[WR, AP, WR, AP, CR, AP, CR, AP, CR, CR, CR],
  [ID.mutating]:  [WR, WR, WR, AP, AP, WR, AP, AP, WR, AP, AP],
  [ID.bubbling]:  [WR, WR, WR, AP, WR, AP, WR, AP, WR, AP, WR],
  [ID.arrayFrom]: [WR, WR, WR, WR, AP, WR, WR, AP, WR, WR, WR],
  [ID.symbol]:    [WR, WR, WR, WR, WR, WR, AP, WR, WR, WR, WR],
};

// Rough per-card durations (ms) — varied slightly by run index.
const BASE_DURATION: Record<string, number> = {
  [ID.letConst]:   8_000, [ID.exponent]:   7_000, [ID.equality]:  9_000,
  [ID.typeofNull]: 10_000,[ID.optional]:   8_000, [ID.newArray]:  12_000,
  [ID.closure]:    18_000,[ID.promiseAll]: 15_000, [ID.mutating]: 14_000,
  [ID.bubbling]:   16_000,[ID.arrayFrom]:  22_000, [ID.symbol]:   25_000,
};

function cardDuration(cardId: string, runIdx: number): number {
  return (BASE_DURATION[cardId] ?? 10_000) + (runIdx % 3) * 1_500;
}

function buildRuns(now: number, cards: Card[]): RunRecord[] {
  return RUN_OFFSETS.map((daysAgo, runIdx) => {
    const completedAt = now - daysAgo * DAY;
    const results = cards.map((card) => {
      const result = CARD_RESULTS[card.id]?.[runIdx] ?? "correct";
      const durationMs = cardDuration(card.id, runIdx);
      return {
        card,
        attempts: [{ result, durationMs }],
      };
    });
    const totalTimeMs = results.reduce((s, r) => s + r.attempts[0].durationMs, 0);
    return {
      id: `demo-run-${String(runIdx).padStart(2, "0")}`,
      deckId: DECK_ID,
      completedAt,
      totalTimeMs,
      results,
    };
  });
}

// ─── SRS computation (mirrors the algorithm in use-srs.ts) ───────────────────

const DEFAULT_EASE = 2.5;
const MIN_EASE = 1.3;

function buildSRS(runs: RunRecord[]): CardSRS[] {
  const state = new Map<string, CardSRS>();

  for (const run of runs) {
    for (const cr of run.results) {
      const cardId = cr.card.id;
      const lastGraded = [...cr.attempts]
        .reverse()
        .find((a) => a.result === "correct" || a.result === "approximate" || a.result === "wrong");
      if (!lastGraded) continue;

      const existing = state.get(cardId);
      let intervalDays = existing?.intervalDays ?? 0;
      let easeFactor = existing?.easeFactor ?? DEFAULT_EASE;

      if (lastGraded.result === "correct") {
        intervalDays = Math.max(1, Math.round(intervalDays === 0 ? 1 : intervalDays * easeFactor));
        easeFactor += 0.1;
      } else if (lastGraded.result === "approximate") {
        intervalDays = Math.max(1, intervalDays);
      } else {
        intervalDays = 0;
        easeFactor = Math.max(MIN_EASE, easeFactor - 0.2);
      }

      state.set(cardId, {
        cardId,
        deckId: DECK_ID,
        intervalDays,
        easeFactor,
        dueAt: intervalDays === 0 ? run.completedAt : run.completedAt + intervalDays * DAY,
        lastResult: lastGraded.result as AnswerResult,
      });
    }
  }

  return Array.from(state.values());
}

// ─── Public entry point ───────────────────────────────────────────────────────

export function seedIfEmpty(): void {
  if (loadDecks().length > 0) return;

  const now = Date.now();
  const deck = buildDeck(now);
  const runs = buildRuns(now, deck.cards);
  const srs = buildSRS(runs);

  saveDecks([deck]);
  saveRuns(runs);
  saveSRS(srs);
}
