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

- The study timer and its estimate leave the study screen. The run's time shows at its end. Overruled by the owner on 2026-11-15 ("The timer is missing"): the run's time is back, above the spots on a phone and in the laptop's side panel, and the estimate stays out. The estimate came back with the rest ([restore.md](restore.md)).
- The redo-later checkbox goes. A wrong or almost grade asks for the card again in the run, as the default was. Overruled by the owner on 2026-11-15 with every dropped capability: it is back as a choice under the stamps ([restore.md](restore.md)).
- Leaving a run keeps the cards answered without asking first, since nothing is lost. Overruled the same way: Leave and Esc ask first, saying what is kept.
- The run's end lists the cards to look at again without each card's tries. "Study these again" studies those cards, and the others are done.
- Home drops the tag filter. A search field shows once there are more than eight decks.
- The deck page filters its cards by status (all, due, weak, new) in place of complexity and tag chips. Choosing cards to study other than the due ones (all, weak, new, shuffled, with a goal) stays in the deck's menu as "Choose cards to study".
- The theme and language toggles move to home's More menu.
- The daily goal is changed from home's More menu.
- The confetti goes. The sheet filling is the feedback for the daily goal.
- Stats measure accuracy as right on the first try, as the run's end does, and rank the decks by it, the lowest first. The stat tiles (decks, cards, sessions, total time) go (`data-2`).
- A deck's stats are its line of runs, average time and first tries, its month, its chart, and its runs, each opening to its cards' tries. Each card's accuracy, time and interval history go, since the deck page's table shows each card's last grade, how often it was right and when it comes back.

## Step 10: T4 and T5 on the app

On 2026-11-15, `pnpm design:audit <url> --walk scripts/app-screens.mjs` audited 16 screens of the running app (home and its five dialogs, stats, the deck page and its three dialogs, deck stats, study before and after the answer, the run's end, a shared link), each at 375 and 1280 px, light and dark. It found no contrast failure. It found these, now fixed:

- No main landmark.
- A cut question with no ellipsis, since inline Markdown rendered a block.
- Truncated deck names without their full text.
- Study's topbar 14 px wider than the column.
- Pills of 41 px and a tag field of 27 px.
- Dialog text under 16 px on a phone.
- Scrolling JSON blocks that took no focus.

It now finds nothing.

A fresh subagent answered the checklist from those screenshots. Fixed from its answers:

- The new-deck form opened from home's menu left the menu open behind it. It now closes the menu and opens on its own.
- `sp-6`: the decks in a run, on the laptop's study aside, were names alone. They carry their stickers.
- `data-4`, `type-6`, `sp-6`: a deck's runs read as absolute dates and clock faces ("Nov 14, 07:12 PM 03:02"). They read "Yesterday, 07:12 PM" or the weekday within a week, with the full date on hover, and the time in units ("3m 2s") aligned right. The run's end and the deck's average use the same units.
- `data-2`: the chart repeated the run count shown above it. It names a count only when it shows the last 20 of more.
- `data-2`, `col-6`: the sheet's spots on a phone in study had no label. They carry "Today's sheet: n of 20" for a screen reader.
- Driving the dialogs found that the Anki import, JSON import and backup dialogs reopened on their last file. Their state now lives inside the dialog, which closing unmounts.

Kept, each for the owner to overrule:

- `type-4`: form labels are bold over regular values, as the mock's fields are.
- `pro-5`, `col-2`, `hi-5`: the first-tries chart is the loudest thing on stats, in the grades' full colours, as in the mock.
- `sp-5`: the card as it will study inside the card form, the option buttons of "Choose cards to study", the drop zone, the code blocks, and the decks as rows.
- `sp-6`: a deck's line under its name says what matters on each screen (last studied, due, tags).
- `data-3`: the run's end is one bar of proportions with its counts beneath, as in the mock.
- `dec-3`: the stamps' dashed inner ring, the mock's rubber stamp.
- `data-1`: the deck's cards keep their written order, and difficulty stays quiet text.
- The rest of the mock's "Kept" list in [audit.md](../../mocks/sticker-chart/audit.md) stands.

`hi-4` and `st-4` could not be answered from stills. Driven by hand, every error shown says what happened, and the Anki import's also says what to do. The backup's says nothing changed but not which file to choose.

## After the owner's review

On 2026-11-15 the owner found dark mode hard to read, the More menus too full, the laptop's study side panel of little use, and the timer missing. Changed:

- Dark mode's neutrals keep about a third of their tint, so the page and its surfaces read as a near-neutral dark and only the decks and grades carry colour.
- Home shows New deck at every width and the language switch in its top bar. Its More menu keeps bringing decks in, backup, the daily goal and the theme.
- The deck page shows Stats in its top bar and Choose cards and Share a link beside Add a card. Its More menu keeps the exports, bringing cards in, the cover and deletion.
- Study shows Pause in the phone's top bar, with Undo, Skip and Save for later in its More menu. On a laptop the side panel holds the sheet, the run's time, its first tries so far, and each action as a button with its key, in place of the run's decks.
- The card form's hint is a text box again, so a hint of several lines keeps its lines.
