---
id: A15
from: [O8]
source: session
status: decided 2026-11-15
kind: behaviour
implemented_by: [src/core/model.ts, src/core/deck-json.ts, src/components/card-form.tsx, src/components/card-face.tsx, src/pages/study-card.tsx]
proven_by: [tests/share-and-anki.test.ts]
supersedes: []
---

# A15 A card lists its sources, one a line, under the answer once turned

A card has an optional `sources` list of strings, each a line of Markdown: a reference such as "Atlas, p. 3", a bare URL that becomes a link, or a Markdown link. The card editor takes them in one box, one a line, blank lines dropped, and its preview shows them. A run shows them under the answer, in quiet words, once the card is turned. Both kinds of card carry them. The owner chose the line of text over a title and link pair, and the run alone over the deck's card list too.

A card without sources stores no field, so stored data, backups, share links and deck JSON from before read as they did, and a share link grows only by the sources written. The deck's JSON format and the prompt that asks a model for one name the field.

## Options

- A line of text a source (taken): one box, and Markdown covers links.
- A title and an optional link a source: more structure, more clicks each.

## Consequences

An app still running an earlier version drops the field when it reads a deck that has it, so a friend on a stale installed copy sees no sources until it updates.
