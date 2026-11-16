---
id: A16
from: [O9]
source: session
status: decided 2026-11-15
kind: behaviour
implemented_by: [src/components/markdown.tsx, src/core/dollars.ts, src/components/mermaid-diagram.tsx, src/effects/diagram.ts, vite.config.ts, scripts/chunk-sizes.mjs]
proven_by: [tests/dollars.test.ts]
supersedes: []
---

# A16 LaTeX between dollars and Mermaid in fenced blocks, wherever Markdown renders

Every text the app renders as Markdown (questions, answers, hints, options, sources) takes LaTeX between `$` inline or `$$` on its own, through remark-math and KaTeX, and draws a ```` ```mermaid ```` block as a diagram.

- KaTeX writes MathML, which the browser lays out, so no KaTeX stylesheet or font enters the build or the design census. It sits in its own eager chunk, about 80 kB gzipped.
- A lone `$` is math only by Pandoc's rule (`guardDollars`): the opening one has a non-space after it, the closing one a non-space before and no digit after. Any other `$` is escaped, so a card that already reads "it costs $5 and $10" reads the same.
- A line holding only `$$…$$` is shown as a formula of its own, centred, as people and models write it, though remark-math reads `$$` as display only on lines of their own.
- A formula wider than its room scrolls within itself and a diagram shrinks to fit, so a phone's page keeps its width.
- Mermaid loads only when a card holds a diagram. Its chunks are named `diagram-*`, left out of the install-time precache and cached on first use. Its `strict` security level escapes HTML in labels and turns off click handlers, since a shared deck's diagrams are another person's text. A diagram is drawn in the page's light or dark and redrawn when the theme changes. One that does not parse shows its source and Mermaid's error.
- The deck-writing prompt tells a model to write formulas and diagrams this way, with a worked card and how to escape them in JSON. The guide deck a first visit seeds has a card on formulas and diagrams and one on sources, both new to study.

## Options

- Mermaid bundled, with a check of its own on chunk sizes (taken, the owner's choice): elkjs and Mermaid's parser are single modules over Vite's 500 kB warning. Vite's limit sits above Mermaid's largest chunk, and `scripts/chunk-sizes.mjs`, run by `pnpm check`, holds every other chunk to 500 kB.
- Mermaid from a CDN: no build changes, but a third party serves code and sees the visit.
- `$` math without the Pandoc rule: simpler, and turns prices already in cards into formulas.

## Consequences

The eager download grows by about 140 kB gzipped (KaTeX and the HTML parser rehype-katex needs). A diagram needs the network the first time this browser shows one.
