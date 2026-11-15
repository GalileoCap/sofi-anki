---
id: A3
from: [O1]
source: session
status: decided 2026-11-15
kind: behaviour
implemented_by: [src/core/backup.ts, src/lib/storage.ts]
proven_by: [tests/backup-restore.test.ts, tests/stored.test.ts]
supersedes: []
---

# A3 A restore refuses a file that is not a backup, and changes nothing

A restore reads the file's outer shape first (`version` 1, the `decks`, `runs` and `srs` lists and the `settings` object) and refuses the file whole when any is missing.

## Context

Found in the review of 2026-11-15: the restore read a missing list as an empty one, so restoring any JSON file that was not a backup (a deck export, a shared deck) in replace mode emptied every deck, run and schedule, and reported success.

## Consequences

The records inside a backup are not checked here; the rewrite decodes them. Undone only if a backup format without one of the four lists is ever written, which no version of the app has done.
