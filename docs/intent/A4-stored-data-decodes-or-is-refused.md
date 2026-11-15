---
id: A4
from: [O1]
source: session
status: decided 2026-11-15
kind: behaviour
implemented_by: [src/core/model.ts, src/core/stored.ts, src/core/decode.ts]
proven_by: [tests/stored.test.ts]
supersedes: []
---

# A4 Stored data decodes in every shape it was written in, or is refused

Every value the app reads from `localStorage`, a backup or a share link goes through a zod schema. A field an older version did not write gets a default named in `src/core/model.ts` (a card without `type` is standard, without `complexity` medium, without `tags` untagged). A value that still does not decode is an error naming its key, and the app does not write over that key.

## Context

The first version cast `JSON.parse` to its types. A stored value it could not read became an empty list, and the next save wrote the empty list over the person's data.

## Consequences

`tests/stored.test.ts` holds the shapes from the history of `src/types.ts` and what the last version's demo seed wrote (`tests/fixtures/old-seed-storage.json`). A new field takes a default in the schema; a change to a field's meaning needs a decoder for the old meaning and an `OWED.md` entry.
