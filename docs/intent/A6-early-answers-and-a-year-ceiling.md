---
id: A6
from: [O3]
source: session
status: decided 2026-11-15
kind: behaviour
implemented_by: [src/core/scheduler.ts]
proven_by: [tests/early-answers.test.ts]
supersedes: []
---

# A6 An early answer grows a card only from the days that passed, and no interval passes a year

A correct answer given before the card was due grows its interval from the days since its last answer, keeps at least the interval it had, and leaves its ease alone. Every interval stops at 365 days. A schedule stored before this rule, with an interval of decades, counts as due a year after its last answer, and what is stored is not rewritten.

## Context

The first version grew the interval by the ease on every correct answer, due or not. A deck studied every day with All Cards pushed a card out by hundreds of years, and Due never offered it again.

## Consequences

Studying a deck every day keeps its cards on short intervals, and only answers given when due spread them out. A card a person knows well comes back once a year at the latest. The interval shown for an old schedule is capped at a year to match when it falls due.
