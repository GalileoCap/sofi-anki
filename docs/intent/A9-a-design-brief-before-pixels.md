---
id: A9
from: [O6]
source: session
status: decided 2026-11-15
kind: behaviour
implemented_by: [docs/design/brief.md]
proven_by: [unproven]
supersedes: []
---

# A9 A design brief, approved by the owner, comes before any mock

Before a mock, a token or a restyle, the session writes `docs/design/brief.md`: the register, the people and their devices, the tasks, the data each screen shows and the form it calls for, what is wrong with the screens now, references from the subject's world, and the generic choice for each decision written out. The owner approves it, and every later design step is checked against it. It is T1 of the trial in `docs/design-research.md`.

## Context

The first restyle mocks (b56eaff) were drawn with no brief, and the owner found them "extremely AI-looking". The research traces the machine look to choices made because they are probable, with no reason in the subject.

## Options

Starting from reference images alone serves `O6` less well here: the owner has no references in mind, so the brief proposes them from the subject for the owner to strike.

## Consequences

A design change waits on the owner once, at the brief. The action is undone if directions drawn from an approved brief still read as machine-made to the owner.
