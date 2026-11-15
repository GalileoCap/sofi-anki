# The rewrite onto the pure-core shape

The owner chose on 2026-11-15 to take `CODE.md` with a full rewrite, using `neverthrow` and `zod`. This document is the design and the order of the work. `docs/session-kit-adoption.md` is the review it follows from.

## What does not change

- Every feature the app has today, screen by screen, in English and Spanish.
- What is stored and how it reads: the `localStorage` keys and their JSON, the backup file, the share link, `.apkg` import. Data written by any earlier version decodes (`O1`). Decks from before choice cards have no `type`, and other fields were added over time (`git log -p src/types.ts` shows each). A decoder accepts every shape the history shows, and fills a field it lacks with a declared default.
- The deploy: GitHub Pages under `/sofi-anki/`, as a PWA.

## Layers

- `src/core`: pure. The model types with `Millis` for moments, the zod schemas that decode stored and imported data, the scheduler, the choice of a run's cards, the run's progress, the stats and heatmap arithmetic, deck import from JSON, `.apkg` rows to cards, backup merge, share encoding. No `localStorage`, `window`, `document`, clock or randomness. A function that needs the time or an id takes it as an argument.
- `src/effects`: every effect, each function with an `@effects` JSDoc line. Storage (`localStorage`), the clock and ids, file reading and download, the SQLite reader for `.apkg` (`sql.js`, loaded lazily), HTML to Markdown (`turndown`, which needs the DOM), the share link's URL, the theme's media query.
- `src/hooks`: React state over the core and the effects.
- `src/pages`: one file per screen. `src/components`: the parts shown in more than one place, named for what they show. `src/lib/looks.ts`: the shared class strings.
- `session-codeintel layers` writes the gate from the `layers` block in `.claude/claude-kit.json`.

## Failures

A function that can fail returns a `Result` from `neverthrow`, with its errors as a union of tagged objects. The boundaries are the event handlers in pages and dialogs, which show the error's message from the translations. No `throw` outside a boundary. `JSON.parse` goes through `Result.fromThrowable` and a zod schema.

## Tests

Kept: the restore regression (`A3`), the decoding of every stored shape the history shows, backup merge and replace, `.apkg` rows to cards, share encode and decode (`O1`, `O2`, `O4`). Scaffolding while the code moves, deleted at the end: the scheduler and the run's card choice.

## Order

1. Dependencies to current (ESLint 10, `vite-plugin-pwa` 2 for Vite 8, browserslist data), gates green.
2. Core: types, schemas, decoders with tests over old shapes, scheduler, run logic, stats, import, backup, share.
3. Effects and hooks.
4. Pages and components rebuilt on them, one screen at a time, with the looks file. The old `src/lib`, `src/hooks` and `src/components` files go as each screen moves.
5. The layers gate, looks at zero, tells and lengths at zero, build without warnings (code-split the `.apkg` import).
6. Every flow driven in the browser against data written by the old version. Done 2026-11-15: the old app (76f454b) ran a study run and wrote a backup, a deck JSON, a share link and an `.apkg`, then the new code was served on the same origin. It opened the old store without writing to it, studied on it, restored the old backup by merge and by replace to the same content, restored its own backup, opened the old share link and overwrote with it keeping the schedules, and imported the old JSON (as a deck and as cards) and the old `.apkg`. Nothing broke.

## Later

- A share link pasted into a tab that already has the app open changes only the hash, and the app reads the link at load, so nothing happens until a reload. The first version did the same.
- The study heatmap's weekday letters are English (`M`, `W`, `F`) in the Spanish interface too. The first version did the same.
- Sync between people. The owner, 2026-11-15: "we'll consider sync later". It would need a server, which `C1` (keep it simple) puts to the owner first.
