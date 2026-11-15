# The restyle to the sticker chart

The plan for carrying `A12` (the app takes the sticker-chart direction) from the mock in [mocks/sticker-chart/](../../mocks/sticker-chart/index.html) to the app, serving `O6` (the app looks made for its people, the same on every screen, and is easy to use). Written 2026-11-15. The mock is the reference for every screen, and [audit.md](../../mocks/sticker-chart/audit.md) lists what its critique changed and kept.

## Order

Each step is a commit, with `pnpm check` green and the screens it touches driven in the browser.

1. Tokens and font. `src/index.css` takes the mock's values by the roles of [system.md](system.md): pink paper neutrals, ink accent, the grades, two shadow depths, radii of 8, 12 and 22 px and the pill. The family is M PLUS Rounded 1c from `@fontsource/m-plus-rounded-1c`, weights 400, 500, 700 and 800. The page column takes the full width of a phone less its margins (`sp-7`). The census budgets and `system.md` follow.
2. Shared parts, each written once and used on every screen it appears on (`sp-6`): the notebook row of a deck, the sticker, the sheet of spots, the grade mark (cross, half tick, tick) in a stamp and in a chip, the key hint, and the date a card comes back.
3. The cross-deck run. `src/core/run.ts` takes a queue of cards from any number of decks, each card's id made unique by its deck's. When the run ends or is left, it is kept as one run per deck, each with the deck's id, its own cards under their own ids, and its share of the time. `anki-runs` keeps its shape, so backups and old runs read as before, and nothing is owed in `OWED.md`.
4. Home: the topbar (Stats, More), "Today" and the line of what is due today, tomorrow and later this week, the sheet with today's stickers and the week, "Study N cards" across every deck with cards due, and the decks ranked by due. The empty home, the goal met, and the deck just kept.
5. Study: Leave, "1 of N" and More (save for later, skip, pause, undo) on top, the sheet's row, the card with the deck it comes from, the hint behind a button, the answer, and the three stamps, each saying where the card goes. A stamp grades and moves on in one step. On a laptop each step has a key.
6. The run's end: "N cards studied", one bar of first tries with a line of counts, the cards to look at again, and "Study these N again".
7. The deck page: the deck's notebook row, "Study N due", "Add a card" and one menu for the rest, then the cards as a table with a status filter, each row with one menu.
8. Stats: the month as a sticker calendar, first tries run by run as a chart, and the decks ranked by accuracy. The shared deck: the notebook row, its cards, "Keep this deck" and "Not now".
9. The dialogs and forms take the new tokens through shadcn's components, with the mock's words ("Bring in cards", "Restore from a file").
10. T4 and T5 on the running app, then T6.

## What changes beyond the look

The owner approved the mock, which leaves these out of the screens. Each is recorded here so it is a decision.

- The study timer and its estimate leave the study screen. The run's time shows at its end.
- The redo-later checkbox goes. A wrong or almost grade asks for the card again in the run, as the default was.
- Leaving a run keeps the cards answered without asking first, since nothing is lost.
- The run's end lists the cards to look at again without each card's tries. "Study these again" studies those cards, and the others are done.
- Home drops the tag filter. A search field shows once there are more than eight decks.
- The deck page filters its cards by status (all, due, weak, new) in place of complexity and tag chips. Choosing cards to study other than the due ones (all, weak, new, shuffled, with a goal) stays in the deck's menu as "Choose cards to study".
- The theme and language toggles move to home's More menu.
- The daily goal is changed from home's More menu.
- The confetti goes. The sheet filling is the feedback for the daily goal.
