---
id: A2
from: [O5]
source: session
status: decided 2026-11-15
kind: check
implemented_by: [scripts/check.sh, .github/workflows/deploy.yml]
proven_by: [scripts/check.sh]
supersedes: []
---

# A2 Every static gate runs from one script, at zero warnings

`pnpm check:static` runs `scripts/check.sh`: the type check, ESLint with `--max-warnings 0`, ast-grep and the session-kit gates. `pnpm check` adds the build. CI runs lint and the build before every deploy.

## Context

The project had `pnpm lint` and `pnpm build` and nothing tying them together, and the lint was red.

## Consequences

The session-kit gates run on the owner's machine only, since the kit is not installed on the CI runner. Undone if CI ever installs the kit.
