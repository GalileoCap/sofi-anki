# The sticker chart: rendered audit and critique

The sticker-chart mock (`A12`, the app takes the sticker-chart direction) went through T4 and T5 of [design-research.md](../../docs/design-research.md) on 2026-11-15, before the app is restyled to it.

## T4, the rendered audit

`pnpm design:audit mocks/sticker-chart/index.html` renders the 17 screens (11 phone, 6 laptop) in light and dark mode. The first run found:

- Key hints at 3.16 to 1 (`fl-1`), from an opacity on top of the quiet text colour. They now take the text's colour.
- The calendar's days to come at 1.91 to 1 in light mode and 2.61 to 1 in dark mode (`fl-1`), from an opacity. They are now quiet text at AA.
- Headings that skip from h1 to h3 on five screens (axe `heading-order`). Sections are now h2, drawn at the h3 size.
- An input whose value is longer than its box. That was a false positive: a field scrolls its own text, and the script counts neither a field nor an ellipsis with a tooltip as overflow.

The audit now passes: no axe violation, no touch target under 44 px on a phone, no text under 12 px, and no overflow, in either mode. A planted run, with every screen counted as a phone, finds the 36 px row menus of the laptop deck page, so the target check works.

## T5, the critique

A fresh subagent answered the 29 questions of [checklist.md](../../docs/design/checklist.md) from the screenshots, the brief and the rules alone. Its raw answers are kept outside the repository with the screenshots. Below, each problem it reported and what was done.

### Fixed in the mock

- `pro-2`, `col-2`: the accent was a saturated berry, beyond the brief's rule that only the decks and the grades are saturated. It is now an ink of low chroma (oklch 0.38 0.08 352 light, 0.84 0.05 355 dark).
- `pro-5`, `col-2`, `sp-5`, `hi-5`, `sp-6`: the deck page and the shared deck drew the deck as a solid cover with a label box inside. They now use the same notebook row as home, larger. The decks in a run (laptop study) and on stats are the same row too.
- `col-5`, `sp-5`: the hint sat in a box with the Almost fill. It is now a paragraph under a dashed rule.
- `col-6`: the chart's legend said "Dot: the deck". It now names each deck beside its dot.
- `col-8`: in dark mode the three grades now share one lightness (0.77).
- `type-4`: the sheet's labels ("Today's sheet", "November") were louder than their values. Labels are now quiet and values bold.
- `sp-2`: the calendar hid a day's number under its stickers. Every day now keeps its number.
- `sp-2`: on the laptop home, Stats and More sat beside "New deck". They now sit in a top bar of their own.
- `sp-5`: stats stacked two boxed sections. The chart is now unboxed.
- `sp-6`, `col-6`: grade chips were words alone. They now carry the stamp's mark.
- `sp-6`, `copy-4`: the same questions were worded two ways, and the closure answer was cut short while a card was being written. Both now match the demo data.
- `data-1`: long questions in the deck's rows now stay on one line, ending in an ellipsis with the full text in a tooltip.
- `data-2`, `copy-2`: the run's end showed three equal tiles under "12 stickers". It is now "12 cards studied", one bar, and one line of counts.
- `data-2`: the kept deck's home said 12 four times. It now says it twice, on the chip and the button.
- `copy-1`: "Choose a file" for a restore that replaces everything is now "Restore from a file".
- `copy-2`: the column "Back" is now "Comes back".
- Outside the checklist: the backup dialog's scrim now fills the screen.

### Kept, for the owner to overrule

- `pro-2`, shape: the critic saw one large radius on every box. The mock uses three radii and the pill, by size (`sp-3`), and the large one is on the sheet, the card and the dialogs.
- `col-5`: the goal met and a deck kept use the Right grade's green. `system.md` gives that colour the role of a good result and the daily goal.
- `copy-4`: the critic read "In 3 days" after an Almost as invented. The scheduler keeps an Almost card's interval (`src/core/seed.ts`), so the date is right, and the data handed to the critic was too coarse.
- `sp-5`: the drop zone inside the import dialog stays, since a drop target needs a visible edge.
- `data-2`: "Study 6 cards" repeats the count on home, and "Study 5 due" the due chips on the deck page. The count says what the tap will do.
- `data-1`: difficulty and card type stay quiet text under the question, and no row shows a weak or new card, since the demo decks have none.
- `pro-5`: the week strip above the Study button, which the critic called a mild rival.
- `type-8`: titles are 27 px, the scale's top step at the 18 px root. To be measured again in the app.

### For the restyle and T6

- `col-6`: a sticker's deck shows by colour alone on the sheet. In the app each sticker takes its deck's name as its accessible name and tooltip.
- `hi-4` and `st-4` could not be answered from still screens. The walkthrough (T6) covers them.
