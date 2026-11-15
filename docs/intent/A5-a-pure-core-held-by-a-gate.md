---
id: A5
from: [O5]
source: session
status: decided 2026-11-15
kind: structure
implemented_by: [src/core, .claude/claude-kit.json, lint/ast-grep, scripts/check.sh]
proven_by: [lint/ast-grep/tests]
supersedes: []
---

# A5 The app's rules live in a pure core, held by the layers gate

Scheduling, the run's queue, stats, deck import and export, backup, share links and the `.apkg` tables are functions in `src/core` that take the time, ids and random numbers as arguments. Effects (`localStorage`, the clock, files, SQLite, the DOM) live in `src/effects`, each function naming them in an `@effects` tag. `session-codeintel layers` writes the ast-grep rules from the `layers` block of `.claude/claude-kit.json`, and `scripts/check.sh` runs them.

## Context

The first version read the clock and storage inside components and hooks, so the rules that can lose data had no test that did not need a browser.

## Consequences

A session changes a rule by changing a core function and its test, with no screen open. A new library the core must not use goes in the block's `outside` list.
