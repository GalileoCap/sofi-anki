---
id: A10
from: [O6]
source: session
status: decided 2026-11-15
kind: structure
implemented_by: [src/index.css, docs/design/system.md]
proven_by: [eslint.config.js]
supersedes: []
---

# A10 The design's values exist only as tokens, and Tailwind knows no others

`src/index.css` resets Tailwind's palette, radii, shadows, type sizes and families, and declares the project's tokens by role: four surfaces, two strokes, three text tones, one accent, three meanings (positive, caution, negative) with a soft step each, deletion, a type scale, three radii and two shadow depths. A colour or a size outside them is a class that does not exist. `docs/design/system.md` names each token's role. It is T2 of the trial in `docs/design-research.md`.

## Context

The first mocks set spacing and colour ad hoc, and the app mixed Tailwind's greens, yellows, ambers and reds with a light and a dark shade written beside every use. The research found that a system written down and left unchecked drifts.

## Options

A token list in a document alone was weighed and set aside: nothing holds code to it. The full reset (`--*: initial`) would also remove spacing, breakpoints and weights, which shadcn's components rely on and which do not drift here.

## Consequences

A new colour or size is a token first, with its role in `system.md`. The direction chosen under T7 changes the values and keeps the roles. The action is undone if a restyle keeps needing values the roles cannot name.
