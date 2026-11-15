# sofi-anki

A flashcard study app in the spirit of Anki, for the owner and their friends. It runs wholly in the browser and is served from GitHub Pages: each person's decks, runs and schedule live in their own browser's `localStorage`, and decks travel between people by share link or file. There is no server, no account and no sync.

The working rules are session-kit's (`~/.claude/CLAUDE.md`), and the shape of the code is `CODE.md`'s:

@~/.claude/plugins/marketplaces/galileo-kit/global/CODE.md

This file adds the project's own. `.claude/settings.json` declares the plugin, and `.claude/claude-kit.json` points `session-tells` at the TypeScript comments and `session-codeintel looks` at `src/`. Its `layers` block names `src/core` and `src/effects`, and `session-codeintel layers` writes the ast-grep rules under `lint/ast-grep/` from it, again after each change to the block. Comments, documents and replies are in English. The interface is in English and Spanish.

## Intent

The owner's goals, the objectives and the constraints in force. Each entry is a file in [docs/intent/](docs/intent/INDEX.md), whose `INDEX.md` is written by `session-intent index`, and `session-intent check` holds this list to the record.

- `G1` An Anki-like study app for the owner and their friends.
- `C1` Keep it simple: no accounts, no server.
- `O1` Nobody loses their decks or their study history to the app (approved).
- `O2` A friend can study a deck someone else made (approved).
- `O3` Cards come back for study around when they would be forgotten (approved).
- `O4` A deck made in Anki can be studied here (approved).
- `O5` A session can change the app unobserved without breaking what people rely on (approved).
- `O6` The app looks made for its people, the same on every screen, and is easy to use (approved).

## Environment

`nix develop` (or direnv, with an untracked `.envrc` holding `use flake`) gives Node 22, pnpm, ast-grep and python3, and puts the session-kit commands on PATH. `packageManager` in `package.json` pins pnpm.

## Commands

- `pnpm dev`: the dev server with HMR.
- `pnpm check:static`: every static gate (`scripts/check.sh`), at zero warnings.
- `pnpm test`: the tests (Vitest, under `tests/`, 2 s a test).
- `pnpm check`: the static gates, the tests and the production build.
- `pnpm build`: type-check, then bundle to `dist/`.
- `pnpm design:audit <page>`: the rendered audit (T4): axe, touch targets, small text, overflow and a census per screen, light and dark, with screenshots in a new temporary directory.
- `pnpm preview`: serve the production build.

Before calling a change done: `pnpm check`, the tests, and the flows it touches driven in the browser, saying which ran.

## Stored data

The deployed site holds people's real decks. Whatever the app stores (the `localStorage` keys `anki-decks`, `anki-runs`, `anki-srs`, `anki-settings`, `lang`, `anki-theme`), a backup file, a share link and an `.apkg` must keep reading as before. A change to what is stored reads the old shape, and its step is written in `OWED.md`.

## UI

- Tailwind CSS for all styling.
- shadcn/ui for components. Do not write a shadcn component by hand: it is added with `pnpm dlx shadcn@latest add <component>`.

## Documents

- [docs/session-kit-adoption.md](docs/session-kit-adoption.md): the review against the session-kit rules and `CODE.md`, and the order of work.
- [docs/rewrite-plan.md](docs/rewrite-plan.md): the design and order of the rewrite onto the pure-core shape.
- [docs/design-research.md](docs/design-research.md): why the first restyle mocks read as machine-made, the research and working designers' patterns for avoiding it, and the design tools proposed for trial here and for session-kit after (`O6`).
- [docs/design/brief.md](docs/design/brief.md): the design brief (`A9`): register, people, tasks, the data's shapes, what is wrong now, references, and the generic choices to avoid.
- [docs/design/rules.md](docs/design/rules.md): the design rules by topic (T8), each with its registers, its source and what holds it. The gate's messages and the critique's questions name them.
- [docs/design/system.md](docs/design/system.md): the design tokens by role (`A10`), the scales, and the census budgets the static design gate (`A11`) holds.
- [docs/design/checklist.md](docs/design/checklist.md): the critique's yes-or-no questions (T5), drawn from the rules held by `check`, answered by a fresh reader from the rendered audit's screenshots.
- [docs/suppressions.md](docs/suppressions.md): every suppression and type escape with its reason, written by `session-suppressions index`.
