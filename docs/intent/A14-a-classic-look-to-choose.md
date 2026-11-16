---
id: A14
from: [O6]
source: owner
status: decided 2026-11-15
kind: behaviour
implemented_by: [src/index.css, src/hooks/use-look.ts, src/pages/home.tsx]
proven_by: [unproven]
supersedes: []
---

# A14 A person can choose the classic look from home's More menu

From the owner on 2026-11-15, after a friend who studies here disliked the sticker chart because she was used to the app before it: "Classic look option, in 'More' so it's hidden for any other users". The classic look is the colours, font (Figtree), corners and shadows the app had before `A12` (the app takes the sticker-chart direction), in light and dark. It changes the tokens alone: every screen keeps the sticker chart's layout, stamps and stickers. The choice is kept in this browser under `anki-look`, and the page opens in it before the app renders.

## Options

- Wait for the new look to become familiar: costs nothing, and was the session's first suggestion.
- The classic look as a choice of tokens (taken): the familiar colours and font, at the cost of a second palette that every later design change is checked in.
- The old screens back as well: two versions of every screen to keep, against `C1`.

## Consequences

The census budgets count both looks together, so growth in either palette fails the gate, but neither is held to a budget of its own. Retired if nobody keeps the classic look.
