---
id: A8
from: [O4]
source: session
status: decided 2026-11-15
kind: behaviour
implemented_by: [src/core/anki.ts, src/core/anki-collection.ts, src/effects/anki-file.ts, src/components/import-apkg-dialog.tsx]
proven_by: [tests/share-and-anki.test.ts]
supersedes: []
---

# A8 An Anki file imports as decks, its cards' fronts and backs in Markdown, with their schedule

The `.apkg` is read in the browser with SQLite (`sql.js`, loaded when needed). Standard and reversed notes become cards, their templates filled from the fields and the HTML turned into Markdown. Cloze notes are left out, and the dialog tells the person before they import. Each card keeps Anki's interval, ease and due date. A file that is not a collection is refused with its reason.

## Context

Friends who used Anki bring decks with months of study in them, and losing the schedule would start them over.

## Consequences

Anki's own scheduling fields map onto this app's simpler one, so the finer state (learning steps, lapses beyond the complexity they set) does not survive. Cloze cards need a card type this app does not have.
