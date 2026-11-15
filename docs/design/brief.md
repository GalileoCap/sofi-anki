# Design brief

The first tool of the design trial (T1 in [design-research.md](../design-research.md)), serving `O6`. Written 2026-11-15 from the owner's answers of the same day and from the app as it runs on `dev`. Every later design step (tokens, directions, mocks, audits) is checked against it. **Status: waiting for the owner's approval.**

## Register

**Personal.** A few friends who know each other, studying their own decks. It is judged by how it feels to come back to every day, so it may have one strong voice. Everything else follows the tool rules, since studying is repeated, focused work: neutrals carry the screen, colour means something, states are complete.

## The people

- The owner and their friends. They make their own decks, and pass decks to each other by link or file.
- **Laptop first.** Decks and cards are made, edited, imported and shared on a laptop, with a keyboard.
- **Phone for studying.** On a phone they study and rarely create. A phone session is short, often one-handed, often in a spare moment.
- Each person studies in English or Spanish, so every label has to fit both.

## Tasks

Each design step is walked against these, on the device named.

1. **Phone:** open the app and study what is due today, across decks, in a few minutes.
2. **Laptop:** make a deck and write cards with Markdown and code in them.
3. **Laptop:** bring in a deck made in Anki, or pasted from a file.
4. **Laptop, then the friend's phone or laptop:** share a deck by link; the friend opens it, keeps it and studies it.
5. **Either:** see how studying is going: today against the daily goal, the streak, which deck is slipping.
6. **Laptop, rarely:** back up everything and restore it.

## The data each screen shows

The shape of each piece of data decides its form (Kole Jain's first rule, research section 3).

| Screen | Data | Shape | What follows |
|---|---|---|---|
| Home | Decks: a handful to a few dozen, each with a title, a colour, an emoji, a card count, tags, and how many cards are due | A short list, ranked by what needs studying | A list ordered by due cards, with studying one step from each deck, rather than a grid of equal covers |
| Home | Cards studied today, the daily goal, the streak | One figure against a target, and a count | One line of text with a bar; no stat tiles |
| Home, stats | Study activity per day, over weeks | A time series | A calendar of days, or a chart |
| Deck | Cards: tens to hundreds, each with a question in Markdown, a complexity of three values, a type of two, tags, and a schedule state (due, weak, new, learned) with the next date | A table with three fixed-value columns and one date | Fixed values as quiet chips or icons with a tooltip; the date as relative text; rare actions in one menu per row |
| Study | One card: question and answer in Markdown, often code; three grades; the run's progress | One object at a time | The card is the screen; code reads left-aligned at full width; grading is one step |
| Stats | Totals, accuracy over runs, each deck's accuracy and last study | A time series and a ranking | A chart of accuracy, and decks ranked by need |

## What is wrong now

Seen on 2026-11-15 in the running app, at 1280 × 800 and at 375 × 812, with the demo decks.

**Studying is far from the first screen.** Home opens on the streak and the heatmap; on a phone they fill the whole first screen. Nothing on home says what is due. Studying takes four steps: open a deck, pick "Due", confirm a dialog of two checkboxes, then start. Task 1, the phone's only job, is the longest path in the app.

**Every action weighs the same.** The deck screen puts Add card, Import cards, Export JSON, Export Anki, Share link and Delete deck in one row of equal buttons, with deletion among them. Each card row repeats its own Edit and Delete, twelve times on the demo deck.

**Colour and marks without meaning.** Card rows carry green, yellow and red complexity chips, an orange "Due" chip, and coloured dots with no label or tooltip. The filter row mixes complexity, card type and tags as one set of chips. Figures are set in monospace ("11 days", "20 cards").

**Card text shows its Markdown.** Questions in the card list show raw `**new**` and backticks.

**Studying a card takes two steps.** After revealing, the person grades it and then presses Next. At 800 px tall the Next button is below the fold. The answer, code included, is centred. The toolbar shows keyboard hints (Esc, ⌘Z, P) on a phone too.

**Phone layout.** The page column is 80 % of the width at every size, so a phone loses a fifth of its width; the title "Your Decks" breaks over two lines beside its buttons.

**The look.** shadcn's grey defaults on near-black, with saturated deck covers as the only colour. It reads as unfinished, which matches the owner's word: "functional but ugly".

## References

The owner has none in mind, so these are the session's proposals. They come from the world of studying itself. Each is a named thing; strike any that feel wrong, and say if one feels right.

- **The index card.** Ruled card stock, a coloured head rule, handwriting in pencil. The study card as a real object, with the size and proportion of a 5 × 3 card.
- **The Leitner box.** The wooden box of spaced repetition: cards move forward a compartment when known and back to the first when missed. It does by hand what the app's scheduler does (`O3`), so it can show due, weak and new as places, which colour alone does not.
- **A teacher's marking.** A tick, a half-tick and a cross in the margin, in red pencil. Grades with a meaning older than any app.
- **School notebook covers.** One plain colour per subject with a label block for the name. Each deck already has its own colour and emoji, chosen by its maker.
- **A library reading room.** Quiet surfaces, warm light, nothing that moves unless you move it.

Shipped apps to look at, as a swipe file to keep or strike:

- **Anki**: what friends move from; its density and its ugliness are both the baseline.
- **Mochi**: Markdown flashcards, a calm personal app close to this one.
- **Things 3**: a personal tool with restraint; one accent, quiet lists, careful states.
- **Apple Reminders**: Kole Jain's example of swipe actions that reveal what is secondary.
- **Duolingo**: probably the feel to avoid (loud rewards, a mascot), named so the owner can say.

## The default check

For each decision, the choice a model makes by default, written out so a direction can be checked against it. The directions (T7) fill in the right-hand column.

| Decision | The generic choice | Constraint from this brief |
|---|---|---|
| Colour | Grey shadcn neutrals with one saturated accent; for "cozy", cream with terracotta | Neutrals tinted from one subject material (card stock, wood, paper). The only saturated colours are the decks' own and the three grades. |
| Type | Inter or Figtree; for "cozy", Fraunces or Fredoka with Nunito | One family picked for reading card text and code at length, with full Spanish accents. A second face only for the one strong voice, if a direction needs it. |
| Layout | A grid of deck covers and a row of stat tiles | Home is a list ranked by what is due; studying is one step from it on a phone. |
| Shape | One radius and one soft shadow on every box | Containers only where grouping needs them; a shadow only on what is lifted, such as the card in study. |
| Decoration | Emoji, gradients, props for the mood | None of the app's own. The decks' emoji and colours are the people's own, and they stay. |
| Motion | Fades and lifts on every element | Only the card turning, and feedback after an answer. |

## Not in scope

The scheduler, the stored data, share links and import formats stay as they are (`O1` to `O4`). A restyle changes how things look and where they are; any change to what is stored follows the stored-data rule in `CLAUDE.md`.
