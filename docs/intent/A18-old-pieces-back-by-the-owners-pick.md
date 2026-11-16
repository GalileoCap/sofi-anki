---
id: A18
from: [O6]
source: owner
status: decided 2026-11-16
kind: behaviour
implemented_by: [src/pages/home.tsx, src/hooks/use-deck-view.ts, src/pages/study.tsx, src/pages/stats.tsx, src/pages/deck.tsx, src/pages/run-start-dialog.tsx, src/lib/translations/en.ts, src/lib/translations/es.ts]
proven_by: [tests/stored.test.ts]
supersedes: []
---

# A18 Pieces of the app before the sticker chart come back as the owner picks them

The owner's girlfriend disliked the restyle (`A12`, the sticker-chart direction) in its colours, font, layout and flow. The owner compared the screens before and after ([old-new.md](../design/old-new.md)) and on 2026-11-16 picked these to bring back, for both looks:

- Home shows the decks as a grid of cards under a cover in the deck's colour, or as rows. The switch sits beside "Decks". The classic look (`A14`, the classic look chosen from home's More menu) opens on the grid and the sticker chart on the rows, until a person picks one, kept under `anki-deck-view`.
- A button that shows something is named by what it shows: Hint, Answer, Difficulty, Time. The owner reads "Show the X" as machine-made wording.
- On a phone, Undo, Skip and Save for later sit in view under the run's progress.
- Stats opens on tiles: decks, cards, runs, time, right first try, the streak.
- Home's tags sit in view under the search as chips, unfolded (P3, picked the same day).
- A deck's page offers All, Due, Weak and New under its Study button, each with its count, in place of "Choose cards to study". Each opens the start dialog on its cards, for shuffle, difficulty and a goal, and one with no cards is disabled (P5).

## Options

The owner was offered the classic look alone, a classic look closer to the old app, old pieces back one by one, and a new default taken from both. They chose old pieces one by one, and will pick more from the table in old-new.md.

## Consequences

- `anki-deck-view` is a stored key that reads `cards`, `rows`, or nothing. The hand-over from the old address does not carry it, since that address never held it.
- Each piece belongs to the app in both looks, so no screen has two versions.
