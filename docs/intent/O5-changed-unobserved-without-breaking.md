---
id: O5
from: [G1]
source: inferred
status: approved 2026-11-15
---

# O5 A session can change the app unobserved without breaking what people rely on

Inferred on 2026-11-15 from the owner's "I expect you to work on this project largely unobserved, don't ask me for technical decisions, only product ones". Approved by the owner on 2026-11-15: "Approve all five".

## Changes

How the work is checked: by gates and tests a session runs, instead of the owner looking.

## Known by

Every commit is green on `pnpm check` and the tests, and no regression reaches the deployed site.
