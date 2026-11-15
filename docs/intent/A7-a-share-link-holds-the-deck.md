---
id: A7
from: [O2]
source: session
status: decided 2026-11-15
kind: behaviour
implemented_by: [src/core/share.ts, src/App.tsx, src/pages/shared-deck.tsx]
proven_by: [tests/share-and-anki.test.ts]
supersedes: []
---

# A7 A share link holds the deck itself, and opens it in any browser

A link holds the deck's JSON after `#/share/`, gzipped, in base64url, so it needs no server. Opened, the link shows the deck and saves it on request, and when a deck with its id is already there the person merges or overwrites. A link the first version made reads the same, and one that does not decode is refused.

## Context

The first version made these links, and friends have sent them to each other. `C1` (keep it simple) rules out a server to hold decks.

## Consequences

A deck's size bounds its link, since every card is in the address. A new link format would have to keep reading this one.
