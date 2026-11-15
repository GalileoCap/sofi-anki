---
id: A11
from: [O6]
source: session
status: decided 2026-11-15
kind: check
implemented_by: [eslint.config.js, lint/design/sgconfig.yml, scripts/design-census.mjs, scripts/check.sh]
proven_by: [lint/design/tests]
supersedes: []
---

# A11 A static design gate holds the code to the tokens and the rules

Three parts, each named after the rules in `docs/design/rules.md`. ESLint's `better-tailwindcss` rules report unknown and conflicting classes and the restricted forms (arbitrary colours, sizes, radii and shadows, gradients, glass, `transition-all`, tracked capitals). ast-grep rules in `lint/design/`, each tested on planted cases, report emoji in the app's own markup, fixed values in inline styles, and middle dots or arrows in the copy. A census of the built stylesheet holds the distinct colours, type sizes, families, radii and shadows to budgets in `.claude/claude-kit.json`. The first two run in `pnpm check:static`, the census after the build in `pnpm check`. It is T3 of the trial in `docs/design-research.md`.

## Context

The first mocks were never counted, and the catalogs of machine-made design list tells that can be seen in source. The gate makes the inconsistency and those tells fail before any review.

## Options

A rendered audit alone (T4) was weighed: it finds more, but runs a browser and comes later. The static gate is cheap and holds every later mock and change.

## Consequences

An exception carries its reason in place and is listed by `session-suppressions`. The action is undone if, over the trial, the gate catches nothing a review would have missed, or blocks changes the brief calls for.
