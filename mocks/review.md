# The four full mocks: three good and three bad things in each

Asked by the owner on 2026-11-15. Each point names the screen it is seen on and the rule or brief line it is measured against (ids from `docs/design/rules.md`), so it can be checked. The research warns that a model's verdict on a design it drew is close to worthless (`pro-6`), and these four were drawn in this session. So no point here says which is better or prettier. That choice stays the owner's. The critique by a fresh reader (T5) and the rendered audit (T4) have not run.

## Shared by all four

- "Almost" fails contrast in light mode. The caution text on its tinted fill measures 4.15 to 4.29 to 1, under the 4.5 of `fl-1`. It shows on grade chips and on the "Almost" buttons. The fix is one step darker for `--caution`, in whichever direction goes forward. Every other text pair measured passes: quiet text on the page (4.7 to 5.6), on the accent (7.7 to 12.9), and all of dark mode.
- Studying across decks is new in all four (`A12`, Consequences). Each stores one run per deck to keep the stored data reading as before.

## 1. The Leitner box

Good:
1. The schedule is visible and true. Home shows where every card is and when it comes back, which is the data's real shape (`data-1`), and it matches what the scheduler does (`O3`). No other direction shows "what is coming tomorrow" at all.
2. Each grade says what it does. "Wrong, back to today", "Almost, tomorrow", "Right, in 2 days" match the label to the result (`copy-1`) and teach the scheduler without a help page (`hi-7`).
3. The most restrained. One container on home, neutrals carry the screen, colour only in the decks' edges and the grades (`col-2`, `col-5`, `sp-5`).

Bad:
1. The edges do not scale. One edge per card works for 24 cards. The brief's decks hold tens to hundreds, so "This week" with 300 cards becomes a solid bar (`data-1`, the brief's data table). The edges would need to become proportional bars, which loses the "each card is a thing" idea.
2. On a phone the decks are below the fold. Five stacked compartments, two of them empty ("Later", "New"), fill the first screen. Reaching a deck to edit or check it always means scrolling past empty boxes (`hi-1`).
3. The figures look like code. Atkinson Hyperlegible draws a slash through zero, so "0 of 20" and "10 days" read as monospace (`type-6`). The beech and walnut browns also sit close to the "cozy cream and brown" cliché (`col-10`) more than the other three.

## 2. The index card

Good:
1. The shortest path to studying. The phone opens on the next due card. Task 1 has no steps before the first card (the brief's first task, and "What is wrong now").
2. Card text reads like a page. The writing sits on the ruled lines, the reading serif suits long answers, and code is left-aligned at full width (`data-5`, the brief's study row).
3. Grades carry meaning by shape. Tick, half tick and cross mean wrong, almost and right without the colour (`col-6`), from a mark everyone already knows.

Bad:
1. Long answers push the grades off the phone screen. The 32 px line of the ruled card makes code airy, so the closure card's answer already fills the screen. A longer answer hides the marks below the fold, the same fault the brief names for today's Next button.
2. Opening on a card hides everything else. Today's goal, the streak and which deck is slipping (task 5) are a tap away on every visit. Someone opening the app to add a card lands mid-study. When nothing is due, the first screen needs its own state.
3. The card idiom is stretched. Stats, the run's end and backup are drawn as ruled cards too, so the bold element repeats until it is wallpaper (`pro-5`, one bold element). The ruled lines are a CSS gradient, which the gate forbids (`col-9`), so they need a named exception.

## 3. The reading room

Good:
1. The laptop tasks happen in place. A new deck is a new row, a card is edited in its row with a preview, the share link sits under the deck's row, and keys drive each frequent step. Tasks 2 to 4 never leave the page (`hi-1`, the brief's "Laptop first").
2. The due stamps rank before they are read. Solid for due, outlined for soon, quiet for later, as relative text (`data-1`, `data-4`).
3. The most exact tables. Figures in columns use tabular figures and align right, and the last grade, share right and due date are separate columns (`type-6`, `data-1`).

Bad:
1. Studying on a phone inside a table row is cramped. The brief says the card is the screen on a phone. Here it is a row among rows, with the next cards competing below it (`hi-5`, the brief's study row).
2. The grade buttons sit close to other rows. Three small buttons inside a row, with tappable rows just under them, invite a wrong tap on a phone (`fl-3`, and `hi-4` for the keys that do not exist on a phone).
3. It is the least cozy. The register is personal, which allows one strong voice. The stamp is that voice, and it is small. The rest reads as a tool or an admin screen, which is far from the owner's first ask, "cute, cozy, study".

## 4. The sticker chart (`A12`, the owner's pick so far)

Good:
1. The cute part is the data. The stickers are today's goal, the streak and each deck's colour, so nothing on the screen is a prop (`dec-3`, `pro-5`). This is the direction closest to the owner's words.
2. Feedback after each grade. A sticker going onto the sheet is the "feedback after an answer" the brief allows for motion, and it replaces the confetti (`mo-1`, `st-3`).
3. The deck page puts actions at their height. Study is the primary action, rare and destructive actions sit in one menu with delete set apart, each card row has one menu, and due dates read as relative text (`hi-1`, `hi-2`, `hi-3`, `data-4`).

Bad:
1. The covers are a grid of equal tiles. The brief's layout row says home is "a list ranked by what is due" and names "a grid of deck covers" as the generic choice to avoid. Two covers look fine, but a few dozen decks become a wall of saturated blocks. The decks' colours then take far more than their mark (`system.md`, "only as each deck's mark").
2. An empty sheet greets every morning. Before studying, twenty dotted empty spots are the largest thing on home. A goal can read as a debt, and the sheet holds no information until the first card is studied (`data-2`).
3. Its type is the riskiest choice. M PLUS Rounded is a fine face, but rounded type is the first association models have for "cute" (research section 2, `pro-2`). It sits one step from the Fredoka and Nunito the brief lists as generic. Of the four, its look relies most on the type's character.
