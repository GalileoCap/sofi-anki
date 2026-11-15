---
id: A12
from: [O6]
source: owner
status: decided 2026-11-15
kind: behaviour
implemented_by: [mocks/directions/4-sticker-chart.html, mocks/sticker-chart/index.html]
proven_by: [unproven]
supersedes: []
---

# A12 The app takes the sticker-chart direction

Of four directions drawn under T7 (`mocks/directions/`), the owner picked the sticker chart on 2026-11-15. Home opens on today's sticker sheet: the daily goal as one row of spots, each filled after a card is studied by a sticker in that card's deck's colour, with the week's stickers as the streak. A line under the title says what is due today and what comes tomorrow and later this week. Studying is one button from home, across every deck with cards due. Decks are a list ranked by due, each row a notebook with its spine in the deck's colour and its emoji as a sticker. Grades are round rubber stamps, each with a teacher's mark (cross, half tick, tick) and a line saying where the card goes next. On a laptop each step has a key. Neutrals are tinted from pink sticker-sheet paper, text and accent are berry ink, and the family is M PLUS Rounded 1c. The full mock in `mocks/sticker-chart/` carries it to every screen before the app changes.

## Context

The owner asked for a "cute, cozy, study" restyle, and found the first mocks machine-made. The brief (`A9`) set the constraints. The direction keeps the cuteness in the person's own data (the goal, the streak, the decks' colours and emoji) and adds no mascot, prop or emoji of the app's own.

## Options

The Leitner box (the schedule as a box), the index card (the app opens on the next card) and the reading room (a keyboard ledger for the laptop) were drawn beside it, each a different structure. The owner chose this one after seeing home and study for all four side by side. After the review of all four full mocks (`mocks/review.md`), the owner asked for the sticker chart to take the good things of the others. From the Leitner box it took what comes after today, and grades that say where the card goes. From the index card it took grades carried by the shape of a mark. From the reading room it took decks as a list ranked by due, and keys on the laptop. The same pass fixed the review's faults in the sticker chart: the grid of covers, the empty sheet filling home, and the caution colour under AA contrast.

## Consequences

- A filled spot after each grade replaces the confetti, since the sheet filling is the feedback for the goal.
- Studying across decks is new: a run today belongs to one deck (`deckId` on each stored run). The app keeps that shape by storing one run per deck when a run across decks ends, so backups and old runs read as before, under the stored-data rule.
- The tokens in `src/index.css` take the direction's values when the app changes, with the roles of `A10` unchanged.
- The action is undone if the full mock, or the app restyled from it, reads to the owner as machine-made or gets in the way of studying.
