# Restoring what the restyle dropped

The owner, 2026-11-15, after reviewing the restyled app: "Functionally restore everything, visually/UX can be different." This is the plan. Each capability the app had at e03ee17, before the restyle (`A12`, the app takes the sticker-chart direction), comes back in the sticker chart's look, serving `O6` (the app looks made for its people, the same on every screen, and is easy to use). The old code is read with `git show e03ee17:<path>`. A subagent's inventory of e03ee17 against a3b12c8 is the source of this list.

Each screen is a commit, with `pnpm check` green, the audit walk clean, and the screen driven in the browser. Tick an item here in the commit that restores it.

## Already back

- [x] The study timer (672cde0).
- [x] Pause and Undo outside a menu: the laptop's side panel, and Pause in the phone's top bar (672cde0).
- [x] New deck at every width, Stats on the deck page, Share a link as a button (672cde0).
- [x] The card form's hint as a text box (672cde0).

## Study

- [x] The estimate of the run's whole time at the pace so far, on hover of the timer (old `Timer`, `estimatedTotal` in `src/core/run.ts`), and a way to hide the timer. The estimate shows beside the time on a phone and under it on a laptop, since a phone has no hover.
- [x] A confirmation before leaving the run, with Esc opening it.
- [x] The run's progress: done, to ask again, still to go (old `RunProgress`, `progress` in `src/core/run.ts`).
- [x] The run goal's progress as a bar, with "Goal reached" (old `GoalProgress`).
- [x] The card's difficulty: the C key, and shown after the answer (old `study-card.tsx:95, 109-120`).
- [x] Redo later: whether a wrong or almost card is asked again in this run, with the R key (old `study-card.tsx:191-195`). It is now a choice under the stamps: if not right (the default), yes, or no.
- Changing a grade before moving on is served by Undo, now outside the menu on a laptop. No change.

## The run's end

- [x] Every card of the run, each under its outcome: right, almost, wrong, skipped, saved for later (old `run-summary.tsx:52-74`).
- [x] Each card's tries, and the time of its first try (old `run-summary.tsx:110-135`).
- [x] For a choice card, what was picked, what was missed, and the wrong picks (old `run-summary.tsx:143-173`).
- [x] The saved-for-later count.
- [x] Studying every card of the run again, beside studying the misses again (old `run-summary.tsx:79`).
- [x] Confetti on a run with every card right the first time (old `run-summary.tsx:41`). It is now stickers in the run's decks' colours, and nothing where motion is reduced.

## Deck page and its cards

- [x] Studying one difficulty: easy, medium or hard, in "Choose cards to study" (runs pass `complexities: null` today, `deck.tsx`).
- [x] Filtering the card list by difficulty and by tag, beside the status filter (old `deck.tsx:269-297`). They sit folded under "Difficulty and tags", since a deck's tags fill a phone's screen.
- [x] Expand all and collapse all in the card list (old `deck.tsx:299-301`).
- [x] An opened card shows its hint (old `deck-card-list.tsx:219-226`).
- [x] An opened card shows its accuracy, sessions, interval, due date and ease, and its last grade, on a phone too (old `deck-card-list.tsx:149-154, 228-261`).
- [x] Choice cards labelled single or multiple choice (old `card-heading.tsx:26-30`), and their right options marked with the tick (old `deck-card-list.tsx:208-211`).
- The rest of the old deck buttons (edit the cover, bring in, the exports) stay in the deck's menu. Each is one menu away. No change.

## Forms

- [x] The card form says whether a choice card is single or multiple answer (old `card-form.tsx:277-283`), under its options as they are ticked.
- [x] The deck form's emoji field shows a preview and example placeholders (old `deck-form.tsx`). The preview is the deck's sticker, in the colour picked.

## Stats and deck stats

- [x] The totals in one line: decks, cards, runs, total time (old `stats.tsx:38-53`), above the streak's line.
- [x] History before this month, with the cards studied each day: the month calendar steps back through earlier months, and each day names its count (old `study-heatmap.tsx`, 13 weeks). This serves home's last week too. A studied day is a button: picking it names its count under the calendar, and hovering shows it too. The arrows stop at the month of the first run and at this month.
- [x] The empty stats screen says there are no decks yet (old `stats.tsx:62-63`). Home hides Stats while there are no decks, so home's own empty state says it first.
- [x] Deck stats: total runs, total time, cards studied, due and weak. Also the average, fastest and slowest run, and the time per card (old `deck-stats.tsx:44-73`). They read as two sentences under the deck (`data-2`).
- [x] Deck stats: each card's accuracy, times studied, average time, due date and interval history, those under 50 % marked (old `deck-stats.tsx:88-97, 156-221`). The weakest first, each folding open to its runs with the spacing after each, and those under 50 % marked with the cross in the wrong grade's colour.
- [x] Inside a run: each card's difficulty and first-try time, and the skipped count in the run's line (old `deck-stats.tsx:111, 141, 145`).

## Home, shared deck and imports

- [x] Home's tag filter (old `home.tsx:119-137`), and the deck search whenever there are decks (old `home.tsx:113-118`). The tags sit folded under the search, as the deck page's filters do, through one `FilterFold`.
- [x] Each deck row on home names its tags (old `home.tsx:175-179`).
- [x] The daily goal changed in one step from the sheet (old `home.tsx:242-250`). The sheet's figure opens the goal's dialog, which More also keeps.
- [x] Theme and language reachable from a shared link's page as well as from home (old `page.tsx:11-14`), as two buttons in its top bar.
- [x] The shared deck lists each card's difficulty, kind and tags (old `shared-deck.tsx:65-71`).
- [x] The Anki import names the total cards across its decks, when the file holds more than one.

## Also known and kept out

- The export dialog's share link: the deck page's "Share a link" button does it.
