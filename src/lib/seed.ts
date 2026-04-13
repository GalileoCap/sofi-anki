/**
 * Demo seed — loaded once on first launch when localStorage is empty.
 * Provides two sample decks with realistic run history to showcase all features.
 */
import type { AnswerResult, Card, CardSRS, Deck, RunRecord } from "@/types";
import { loadDecks, saveDecks, saveRuns, saveSRS } from "@/lib/storage";

const JS_DECK_ID   = "demo-js-v1";
const APP_DECK_ID  = "demo-app-guide-v1";
const DAY = 86_400_000;

// ─── Card IDs ────────────────────────────────────────────────────────────────

// JavaScript Fundamentals deck
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

// sofi-anki Guide deck
const GID = {
  cardTypes:    "demo-g01",
  studyModes:   "demo-g02",
  revealKey:    "demo-g03",
  srsHow:       "demo-g04",
  saveForLater: "demo-g05",
  undo:         "demo-g06",
  markdown:     "demo-g07",
  hints:        "demo-g08",
  complexity:   "demo-g09",
  dailyGoal:    "demo-g10",
  overflow:     "demo-g11",
  sharing:      "demo-g12",
};

// ─── Deck definitions ─────────────────────────────────────────────────────────

function buildJsDeck(now: number): Deck {
  return {
    id: JS_DECK_ID,
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

function buildAppDeck(now: number): Deck {
  return {
    id: APP_DECK_ID,
    title: "sofi-anki Guide",
    emoji: "📖",
    color: "#863bff",
    tags: ["guide"],
    createdAt: now - 12 * DAY,
    cards: [
      {
        id: GID.cardTypes,
        type: "standard",
        title: "What are the two card types?",
        response:
          "**Standard** — a question on the front, answer on the back. You self-grade as Correct, Approximate, or Wrong.\n\n" +
          "**Choice** — multiple-choice options that are auto-graded. Mark one or more correct options; the app handles single-select vs multi-select automatically.",
        complexity: "easy",
        tags: ["cards"],
      },
      {
        id: GID.studyModes,
        type: "standard",
        title: "What do the three study modes do?",
        response:
          "- **All Cards** — full deck, shuffled\n" +
          "- **Due** — only cards whose SRS interval has elapsed (or never studied)\n" +
          "- **Weak** — cards whose last result was Wrong or Approximate\n\n" +
          "On mobile, tap **Start** to pick a mode. On desktop, the three buttons are always visible.",
        complexity: "easy",
        tags: ["study"],
      },
      {
        id: GID.revealKey,
        type: "choice",
        title: "Which key reveals the answer on a standard card?",
        complexity: "easy",
        tags: ["study"],
        multiSelect: false,
        options: [
          { id: "rk-a", text: "**Space** or **Enter**", correct: true  },
          { id: "rk-b", text: "**R**",                  correct: false },
          { id: "rk-c", text: "**A**",                  correct: false },
          { id: "rk-d", text: "**Tab**",                correct: false },
        ],
      },
      {
        id: GID.srsHow,
        type: "standard",
        title: "How does spaced repetition (SRS) work in this app?",
        response:
          "Each card tracks an **interval** (days until next review) and an **ease factor** (how fast the interval grows).\n\n" +
          "After grading:\n" +
          "- **Correct** → interval × ease factor (grows fast)\n" +
          "- **Approximate** → interval stays the same\n" +
          "- **Wrong** → interval resets to 0 (due immediately), ease drops\n\n" +
          "Cards you know well come back in weeks; cards you struggle with come back tomorrow.",
        hint: "Think of it as the app \"forgetting\" harder cards faster so it can remind you more often.",
        complexity: "medium",
        tags: ["SRS"],
      },
      {
        id: GID.saveForLater,
        type: "standard",
        title: "What does **Save For Later** do during a session?",
        response:
          "Moves the card to a random position **later in the same session** — it will come back before the session ends.\n\n" +
          "Useful when you want to revisit a card with fresh eyes after seeing other cards.\n\n" +
          "> Different from **Skip**, which just records a skip and moves on permanently.",
        hint: "Keyboard shortcut: **L**",
        complexity: "easy",
        tags: ["study"],
      },
      {
        id: GID.undo,
        type: "standard",
        title: "How do you undo an action during a study session?",
        response:
          "Press **Ctrl+Z** (or **Cmd+Z** on Mac), or tap the **Undo** button in the session header.\n\n" +
          "Undo reverts the last Skip, Save For Later, or grade. Up to **20 undos** are kept per session. The stack clears on restart.",
        complexity: "easy",
        tags: ["study"],
      },
      {
        id: GID.markdown,
        type: "choice",
        title: "Which of these markdown features work in card content? (select all)",
        complexity: "easy",
        tags: ["cards"],
        multiSelect: true,
        options: [
          { id: "md-a", text: "`**bold**` and `*italic*`",   correct: true  },
          { id: "md-b", text: "Fenced code blocks",          correct: true  },
          { id: "md-c", text: "Tables",                      correct: true  },
          { id: "md-d", text: "Embedded video",              correct: false },
        ],
      },
      {
        id: GID.hints,
        type: "standard",
        title: "What are card hints and how do you show one?",
        response:
          "An optional clue shown **before** you reveal the answer — useful for nudging your memory without giving it away.\n\n" +
          "To add a hint: open the card form → tap **+ Add hint**.\n\n" +
          "During study: tap **Show Hint** (or press **H**) on the front of the card.",
        complexity: "easy",
        tags: ["cards"],
      },
      {
        id: GID.complexity,
        type: "standard",
        title: "What is card **complexity** used for?",
        response:
          "A self-assessed label (**Easy**, **Medium**, **Hard**) per card. It's used to:\n\n" +
          "- **Filter** the card list in the deck detail view\n" +
          "- **Filter** cards before starting a session (study only Hard cards, for example)\n" +
          "- Show in the run summary so you can spot patterns",
        complexity: "easy",
        tags: ["cards"],
      },
      {
        id: GID.dailyGoal,
        type: "standard",
        title: "How does the daily goal work?",
        response:
          "Set a target number of cards to study each day. The home screen shows **X / N cards** with a progress bar.\n\n" +
          "During a session you can also set a **session goal** (cards or minutes) — a banner appears when you hit it.\n\n" +
          "Tap the goal number on the home screen to edit it inline.",
        complexity: "easy",
        tags: ["stats"],
      },
      {
        id: GID.overflow,
        type: "choice",
        title: "Which actions live in the **⋮** menu on the home screen?",
        complexity: "easy",
        tags: ["decks"],
        multiSelect: true,
        options: [
          { id: "ov-a", text: "Import Deck",        correct: true  },
          { id: "ov-b", text: "Backup & Restore",   correct: true  },
          { id: "ov-c", text: "New Deck",            correct: false },
          { id: "ov-d", text: "Global Stats",        correct: false },
        ],
      },
      {
        id: GID.sharing,
        type: "standard",
        title: "How do you share a deck with someone else?",
        response:
          "Open the deck → **Export JSON** (desktop) or **Share & Export** (mobile ⋮ menu).\n\n" +
          "The export dialog includes a **Share Link** — a URL that encodes the entire deck. Anyone with the link can open it and import it, no account needed.\n\n" +
          "> Very large decks may exceed URL length limits; use the JSON export instead.",
        complexity: "medium",
        tags: ["decks"],
      },
    ],
  };
}

// ─── Run schedule & results ───────────────────────────────────────────────────

type R = AnswerResult;
const CR: R = "correct";
const AP: R = "approximate";
const WR: R = "wrong";

// ── JavaScript Fundamentals runs ─────────────────────────────────────────────
// 11 runs; last 7 consecutive → streak of 7.
const JS_RUN_OFFSETS = [21, 16, 12, 9, 7, 6, 5, 4, 3, 2, 1];

const JS_RESULTS: Record<string, R[]> = {
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

const JS_DURATION: Record<string, number> = {
  [ID.letConst]:   8_000, [ID.exponent]:   7_000, [ID.equality]:  9_000,
  [ID.typeofNull]: 10_000,[ID.optional]:   8_000, [ID.newArray]:  12_000,
  [ID.closure]:    18_000,[ID.promiseAll]: 15_000, [ID.mutating]: 14_000,
  [ID.bubbling]:   16_000,[ID.arrayFrom]:  22_000, [ID.symbol]:   25_000,
};

// ── sofi-anki Guide runs ──────────────────────────────────────────────────────
// 6 runs over 10 days — newer deck the user has just started.
const APP_RUN_OFFSETS = [10, 8, 6, 4, 2, 1];

const APP_RESULTS: Record<string, R[]> = {
  //                [10,  8,  6,  4,  2,  1]  days ago
  [GID.cardTypes]:  [WR, CR, CR, CR, CR, CR],
  [GID.studyModes]: [WR, AP, CR, CR, CR, CR],
  [GID.revealKey]:  [CR, CR, CR, CR, CR, CR],
  [GID.srsHow]:     [WR, WR, WR, AP, AP, AP],
  [GID.saveForLater]:[WR,AP, CR, CR, CR, CR],
  [GID.undo]:       [WR, CR, CR, CR, CR, CR],
  [GID.markdown]:   [WR, WR, AP, CR, AP, CR],
  [GID.hints]:      [WR, AP, CR, CR, CR, CR],
  [GID.complexity]: [CR, CR, CR, CR, CR, CR],
  [GID.dailyGoal]:  [WR, AP, CR, CR, AP, CR],
  [GID.overflow]:   [WR, AP, AP, CR, CR, CR],
  [GID.sharing]:    [WR, WR, AP, AP, CR, AP],
};

const APP_DURATION: Record<string, number> = {
  [GID.cardTypes]:   9_000, [GID.studyModes]: 11_000, [GID.revealKey]:    7_000,
  [GID.srsHow]:     20_000, [GID.saveForLater]: 9_000, [GID.undo]:         8_000,
  [GID.markdown]:   12_000, [GID.hints]:        9_000, [GID.complexity]:   8_000,
  [GID.dailyGoal]:  10_000, [GID.overflow]:     9_000, [GID.sharing]:     14_000,
};

// ── Generic run builder ───────────────────────────────────────────────────────

function buildRuns(
  deckId: string,
  idPrefix: string,
  offsets: number[],
  results: Record<string, R[]>,
  durations: Record<string, number>,
  cards: Card[],
  now: number,
): RunRecord[] {
  return offsets.map((daysAgo, runIdx) => {
    const completedAt = now - daysAgo * DAY;
    const runResults = cards.map((card) => {
      const result = results[card.id]?.[runIdx] ?? "correct";
      const durationMs = (durations[card.id] ?? 10_000) + (runIdx % 3) * 1_500;
      return { card, attempts: [{ result, durationMs }] };
    });
    const totalTimeMs = runResults.reduce((s, r) => s + r.attempts[0].durationMs, 0);
    return {
      id: `${idPrefix}-run-${String(runIdx).padStart(2, "0")}`,
      deckId,
      completedAt,
      totalTimeMs,
      results: runResults,
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

      const existing = state.get(`${run.deckId}:${cardId}`);
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

      state.set(`${run.deckId}:${cardId}`, {
        cardId,
        deckId: run.deckId,
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

  const jsDeck  = buildJsDeck(now);
  const appDeck = buildAppDeck(now);

  const jsRuns  = buildRuns(JS_DECK_ID,  "js",  JS_RUN_OFFSETS,  JS_RESULTS,  JS_DURATION,  jsDeck.cards,  now);
  const appRuns = buildRuns(APP_DECK_ID, "app", APP_RUN_OFFSETS, APP_RESULTS, APP_DURATION, appDeck.cards, now);

  const allRuns = [...jsRuns, ...appRuns];
  const srs = buildSRS(allRuns);

  saveDecks([jsDeck, appDeck]);
  saveRuns(allRuns);
  saveSRS(srs);
}
