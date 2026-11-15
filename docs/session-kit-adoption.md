# Bringing sofi-anki under the session-kit rules

A review of the project as of 2026-11-15 (last code change 2026-05-27, 57 commits) against `~/.claude/CLAUDE.md` (session-kit's `global/CLAUDE.md`) and `global/CODE.md`. Section 1 is what was measured. Section 2 is what each rule asks of this project. Section 3 is the order of work, and section 4 lists what only the owner can decide.

## 1. What was measured

| Check | Result |
| --- | --- |
| `pnpm install` (pnpm 11.27) | fails: `ERR_PNPM_IGNORED_BUILDS` on `msw` (pulled in by the `shadcn` package). Every `pnpm <script>` runs this check first, so `pnpm lint` and `pnpm build` fail before they start. |
| `eslint .` | 1 error: `react-refresh/only-export-components` in `src/contexts/language-context.tsx:34` (the `useLanguage` hook exported beside the provider). |
| `tsc -b` | clean. |
| `tsc --strict` | clean, 0 errors. `strict` is off in `tsconfig.app.json` today, so turning it on costs nothing. |
| Tests | none. No runner, no test files. |
| `session-intent check` | no `docs/intent/`. |
| `session-docs check` | passes (no `docs/` before this report). |
| `session-suppressions check` | fails: `docs/suppressions.md` missing. 0 markers found, though `JSON.parse(...) as X` casts out of `any` (storage, apkg, share) are type escapes the rule covers and the tool does not see. |
| `session-tells check` | 11 em dashes in `CLAUDE.md` (removed in this commit). TypeScript comments are not read yet (no `tells.readers`); `src/` holds 39 em dashes. |
| `session-codeintel looks .` | fails: 75 class strings written in more than one place. `text-muted-foreground text-sm` alone is in 25. |
| `session-rulebook` | 1,811 of 7,500 words. |
| `session-codeintel quality` | does not apply: it reads Python only. File length, duplicate bodies and fallbacks have no tool for TypeScript (see 2.3). |
| File length (code lines, rough count) | `deck-detail.tsx` 732, `translations.ts` 582, `deck-stats.tsx` 532, `study-session.tsx` 502, over the 500 cap. `seed.ts` 489. |
| Fallback sites (`??`, `\|\|`) | 126 outside `components/ui`. |
| Effects | the clock (`Date.now`, `new Date`, `Math.random`, `crypto`) at 43 sites, and `localStorage`, `window`, `document` or `FileReader` in 22 of 34 source files, components included. |

### A defect found on the way

`importAllData` in `src/lib/storage.ts` replaces with `data.decks ?? []`, `data.runs ?? []` and `data.srs ?? []`, and `backup-dialog.tsx` checks only that the file is JSON. Restoring any JSON file that is not a backup (a deck export, a shared deck, `{}`) in "replace" mode, after the confirm, empties every deck, every run and every card's schedule, and reports success. This is the "lost data" case the rules keep a test for. It is the first fix in section 3, with a regression test that fails before it.

## 2. What each rule asks of this project

### 2.1 Setup the kit expects

- **`.claude/settings.json`** declaring the plugin, as `checklist` and `gallery` do.
- **`.claude/claude-kit.json`**: `tells.readers: ["typescript"]`, `looks` (`src`, skip `src/components/ui`), `layers.typescript` (core and effects directories), `test_commands`, and `iterate.static` (the static checks `/session-kit:iterate` runs).
- **`CLAUDE.local.md`** from `/session-kit:handoff init`, and the name in `.gitignore` (the `*.local` line does not cover it).
- **`docs/suppressions.md`** from `session-suppressions index`.
- **`OWED.md`** when the first change owes a step outside the code. The likeliest one here: a change to what `localStorage` holds, which the deployed site's existing data has to survive.
- **`CLAUDE.md`**: the `@` line importing `CODE.md` if the owner takes it (4.1), the intent list, the gates by name, the commands and the "before calling it done" list. `README.md` is still the Vite template and should say what the app is.

### 2.2 Gates at zero

- Approve or deny `msw`'s build script in `pnpm-workspace.yaml` (`allowBuilds`), and pin pnpm with `packageManager` in `package.json`: CI installs `version: latest`, which is how the local pnpm drifted to 11. The `shadcn` package stays a dependency, since `src/index.css` imports `shadcn/tailwind.css`, so `msw` comes with it and the answer for it is `false`: the app never runs it.
- Fix the ESLint error by moving `useLanguage` to its own file (no behaviour change).
- `"strict": true` in `tsconfig.app.json`, and `eslint --max-warnings 0`.
- A `check` script that runs every gate in one call: `tsc -b`, `eslint`, `ast-grep scan`, `session-codeintel looks .`, `session-tells check`, `session-suppressions check`, `session-docs check`, `session-intent check`. The same list goes in `iterate.static`.
- CI runs `pnpm build` only. Running `check` and the tests before the deploy keeps a red main from reaching the site.

### 2.3 `CODE.md`, rule by rule

Several rules have nothing to hold here: the app has no server, no authority and no secret. The rest apply.

- **Pure by default, effects named.** The candidates for `src/core`: SRS scheduling (now inside `useSRS`, reading `Date.now`), the backup merge and validation, the `.apkg` and JSON import parsing, the share-link encoding, and the stats and heatmap arithmetic in `deck-stats`, `global-stats` and `study-heatmap`. `src/effects`: `localStorage`, file reading and download, the clock and randomness, `sql.js` loading. Hooks and components call the core with `now` passed in. `session-codeintel layers` writes `ts-core-no-effects`, `ts-core-imports-only-core` and `ts-effects-declared` from the settings, and each `src/effects` function gets an `@effects` JSDoc line.
- **Failures are values.** Three `throw`s (`apkg.ts` twice, the context guard) and `try` blocks in five files. `generic-app` uses `neverthrow`'s `Result` with `zod` decoding at the edges; using the same pair keeps the projects alike and follows "use third-party types directly". The boundaries are the dialogs' handlers, which already catch.
- **A check returns a proof.** Not applicable (no authority).
- **What leaves the server is a view.** Not applicable as written. Its nearest relative here is what enters: every `JSON.parse` of stored or imported data is decoded by a schema instead of cast, which is also what fixes the defect above.
- **A unit is a type.** `createdAt`, `completedAt`, `dueAt` and `exportedAt` are moments and become `Millis`. `durationMs` and `totalTimeMs` are durations and stay `number`. `intervalDays` is a count. The brand is erased at runtime, so stored data is unchanged and nothing is owed.
- **A thing shown twice is a component; a shared look is a looks entry.** 75 repeated strings. Most are one of a few looks (muted small text, a page container, a dialog's column), which go in a `src/lib/looks.ts`; the page container repeated in `App.tsx` is a `Page` component.
- **A default is declared, or a fallback that speaks.** 126 sites. Most are optional fields read with a declared default, which is fine once named (`DEFAULT_SETTINGS` already is). The ones to judge first are in `storage.ts` and the import paths, where a fallback stands in for missing data.
- **A body written twice is one function; a file has a length.** Four files over 500. `deck-detail.tsx` (732) has the clearest seams, its card list and its dialogs. `translations.ts` is data: either one file per language or a named cap with that reason.
- **A structural rule is held by a tested gate.** The kit's `quality` gate reads Python only, so length, duplicates and fallbacks have no tool for TypeScript. Built-in ESLint `max-lines` (with `skipBlankLines` and `skipComments`) holds the length today. Duplicate bodies and fallbacks need either an ast-grep rule here or TypeScript support in `session-codeintel quality`; the second serves `checklist` and `generic-app` too and belongs in the kit.

### 2.4 Tests

There are none. The rules keep three kinds past the change, and this project has two of them: the defect's regression test, and tests of a rule whose failure loses data silently (backup restore in both modes, the stored data's decoding, `.apkg` import). SRS scheduling is pure arithmetic once in the core and is proved by a few pointed cases while it moves, then those go unless the owner wants the schedule pinned. A runner is needed: Vitest fits Vite with no extra config; `checklist` uses `node --test`. Each test gets a timeout of a few seconds.

### 2.5 Intent

`docs/intent/` with the owner's goals in their words, then objectives for the owner's approval, then actions for what is decided in this plan (the layer split, the Result type, the stored-data decoding). Goals are the owner's to state (4.3).

### 2.6 Prose

The rule applies to files as they are touched. Which language comments, docs and replies use here is open (4.4): the sibling sofi projects are in Rioplatense Spanish, this one is in English.

## 3. Order of work

Each step is one or more commits, green on the gates that exist at that point.

1. **Install and gates.** pnpm pin and `allowBuilds`, the ESLint error, `strict`, `--max-warnings 0`. Mechanical, no behaviour change.
2. **Kit setup.** `.claude/settings.json`, `claude-kit.json`, `CLAUDE.local.md` and its ignore line, `docs/suppressions.md`, the `check` script, CI running it.
3. **Test runner, then the defect.** Vitest with a per-test timeout; the regression test for the replace-mode wipe, red; the fix (decode the backup, refuse a file that is not one); the test green.
4. **Intent record.** After the owner states the goals.
5. **Core and effects.** `layers` settings and generated rules; move storage, file and clock code into `src/effects`; move the scheduler, import parsing, backup merge and stats into `src/core`; `Millis`; `Result` and schema decoding at every parse.
6. **Looks and components.** A looks file and `Page`; `looks` to zero.
7. **File lengths.** Split `deck-detail`, `deck-stats` and `study-session` at their seams; decide `translations.ts`.
8. **Fallbacks.** Judge the 126 sites, data paths first.
9. **Drive it.** Run the app in the browser through each flow touched (study, import `.apkg`, backup and restore both ways, share link), and say which ran.

Steps 1 to 3 are small and stand alone. Step 5 is the large one and changes most files; 6 to 8 are easier after it.

## 4. For the owner

1. **Take `CODE.md`?** Recommended, with the rules in 2.3 marked not applicable left out by name in `CLAUDE.md`. The cost is step 5, roughly a third of the source files touched. The gain is a scheduler and an import path that are tested with values alone, which is where this app can lose data.
2. **`neverthrow` and `zod`**, as in `generic-app`, or something else for `Result` and decoding?
3. **The goals.** Why the app exists and for whom, in your words, so the intent record can start.
4. **Language** of comments, docs and replies in this project: English as today, or Rioplatense Spanish as in `checklist` and `gallery`? And the UI, which has both (`translations.ts`)?
5. **The kit.** TypeScript support in `session-codeintel quality` is a change to galileo-kit, done there and not here. Until then `max-lines` holds the length here.
