# Moving the design tools to session-kit

An analysis of 2026-11-17, asked by the owner, of the rules, records and tools built here for the design trial of [design-research.md](../design-research.md) (`O6`, the app looks made for its people, the same on every screen, and is easy to use). It says what exists, what the trial proved and missed, which parts belong to any project and which to this one, and the shape and open choices for session-kit. Section 7 of the research proposed a shape before the trial. This revises it with what the trial showed.

## 1. What exists

| Tool | Pieces | State |
|---|---|---|
| T1 brief | [brief.md](brief.md) (`A9`, a brief approved before any mock) | Written and approved. `A9` is still `unproven`. |
| T2 tokens | `src/index.css` resets Tailwind's palette, radii, shadows, sizes and families; [system.md](system.md) names each token's role (`A10`) | Held by the gate. |
| T3 static gate | `eslint.config.js` (`better-tailwindcss`: unknown, conflicting and 8 restricted class forms); `lint/design/` (3 ast-grep rules with planted tests); `scripts/design-census.mjs` against `design.budgets` in `.claude/claude-kit.json` (`A11`) | In `pnpm check:static` and `pnpm check`. |
| T4 rendered audit | `scripts/design-audit.mjs`: axe, targets under 44 px, small text, overflow, a census per screen, light and dark, full screenshots. Two modes: mocks (`.device` elements) and `--walk` over the app with `scripts/app-screens.mjs` (21 screens at 375 and 1280 px) | Run by hand (`pnpm design:audit`). No intent entry. |
| T5 critique | [checklist.md](checklist.md): 30 yes-or-no questions; a fresh subagent answers them from T4's screenshots and the brief | Run twice, on the mock and on the app. No script, no intent entry. |
| T6 states and walkthroughs | Planned as `docs/design/states.md` and walkthroughs (rules `st-5`, `pro-3`, `hi-7`) | Never built. |
| T7 variants | `mocks/directions/`, four one-page directions, then full mocks | Used once: the owner picked the sticker chart (`A12`). |
| T8 rules | [rules.md](rules.md): 68 rules by topic, each with registers, source and what holds it (gate 13, audit 14, check 32, walk 7, owner 6) | The gate's messages and the checklist cite its ids. |
| Before and after | [old-new.md](old-new.md) and `old-new/`: the app at two commits side by side per screen, width and mode | Made by hand, no script. |

## 2. What the trial proved

- **The rendered audit found real defects.** On the app (restyle step 10): no main landmark, a cut question without an ellipsis, truncated deck names without their full text, a topbar wider than its column, pills of 41 px, dialog text under 16 px on a phone, scrolling blocks that took no focus. On the mock it made the key hints and calendar days reach AA. Each fix is in 48374eb and d441afd.
- **The fresh-reader critique found real defects the audit cannot see.** A menu left open behind a dialog, decks drawn as names alone on one screen and as stickers on the others (`sp-6`), absolute dates and clock faces where relative dates belong (`data-4`, `type-6`), a chart repeating a count shown above it (`data-2`), unlabelled spots (`col-6`). It never rated anything, as `pro-6` asks, and its answers were specific enough to act on.
- **Tokens with a reset hold.** Since b4c0449 no off-system colour, size, radius or shadow entered the code. The classic look (`A14`) came in as a second set of the same roles, which the reset made a change of values alone.
- **The census works as a ratchet.** A count under its budget fails as well as one over it, so a gain is kept by lowering the budget.
- **T7 gave the owner a real choice.** The four directions differed in structure, and the owner picked one without calling it machine-made.

What is not proven: no commit records the static gate catching a change, since it ran from the start and shaped the code before any review. Whether it caught anything a review would have missed (the undo condition of `A11`) is unknown.

## 3. What the trial missed

These matter more for session-kit than the successes, since each is a gap a new project would fall into too.

1. **The restyle dropped about thirty capabilities.** The run's estimate, the run's progress, the card list's filters, each card's history, the run end's card list and more ([restore.md](restore.md)). Nothing in T1 to T8 asks what the app does before changing how it looks. A subagent's inventory of the old commit found them after the owner did.
2. **The people already using the app rejected it.** A friend who studies here and the owner's partner disliked the new colours, font, layout and flow, and the owner brought back the classic look (`A14`) and old pieces one by one (`A18`). The brief treated the app as a blank page. It had no field for the people already used to it, or for how much change they accept (Jakob's law, which rules.md cites only for proximity).
3. **A control shown twice went unseen.** The deck page shows All, Due, Weak and New twice. The audit has no check for duplicates and the checklist no question for them.
4. **Half the audit's rules are not in the audit.** Of the 14 rules rules.md says the audit holds, it checks six (`fl-1`, `fl-3`, `fl-4`, `fl-5`, `type-5`, part of `hi-6`). The rendered tells T4 proposed (a card in a card, every button primary, one spacing value, left-aligned figures, focus visible, reduced motion, dark surfaces rising) were never written. And it fails on axe alone: a target under 44 px or overflow (`fl-3`, `fl-5`, both "the floor") is reported and passes.
5. **The walk is English only.** `copy-5` (every label fits in every language at phone width) has no check, though the app speaks Spanish.
6. **T6 never happened**, so states (empty, loading, error) are checked by no tool, only when a session happens to drive one.

## 4. What is portable and what is this project's

| Piece | Portable | Bound to this project |
|---|---|---|
| research | The catalogs, Kole Jain's patterns, the canon, the registers, how far a model can judge | Section 1 (the cozy mocks) and section 8 (the owner's answers) |
| rules.md | Every rule, its registers and sources | `type-7` and `data-5` cite this brief; `copy-4` names demo decks |
| checklist.md | Its form, and its content as a filter of rules.md by register and holder | Hand-filtered for the personal register |
| brief.md | Its sections (template) | Its content |
| index.css, system.md | The reset pattern and the roles table | The values |
| restricted classes | All 8 patterns | None, though they assume Tailwind v4 |
| ESLint selectors | The default selectors | The constant-name regex (`looks`, `*Class`, `*Color`) |
| lint/design rules | All 3 rules | Their file globs (`src/components`, `src/pages`, `src/lib/translations`) |
| design-census.mjs | All of it | The shadow count reads `--tw-shadow`, a Tailwind detail |
| design-audit.mjs | `inspect()`, the axe run, the report, the overflow heuristics learnt the hard way (an announced ellipsis, a scrolling parent, text clipped for screen readers) | The theme key `anki-theme`, clipboard permissions, the two widths, the mock selectors |
| app-screens.mjs | The contract: `export const screens = [{ name, go(page) }]` | Every screen |
| old-new | The method: two revisions, same data, every screen, width and mode | The images |

About four fifths of the code moves as it is. What binds it here are values a config block can carry.

## 5. The shape proposed for session-kit

### Rules in the global CLAUDE.md

Four lines, about 120 words of the 3,535 left under the 7,500 budget:

- A design starts from an approved brief that names the people already using the product and the change they accept.
- A restyle keeps every capability: it starts from an inventory of what each screen does, and ends with each one ticked.
- A model never grades a design or picks between versions; it answers checklist questions about a region.
- Design values exist only as tokens, and the gate holds the code to them.

### A skill, `design`

Loaded on demand, so it costs the rules budget nothing. Its steps: the brief (T1, with the existing-people field of section 3), the inventory before a restyle (from the gap of section 3), directions that differ in structure (T7), the audit, the critique by a fresh subagent with a fixed prompt (T5), and a before-and-after of every screen for the owner. Its references: rules.md and the research's sections 2 to 4, as files read by topic. The checklist is generated from rules.md by register, so a rule exists once.

### A command, `session-design`

Configured by the `design` block this project already has in `.claude/claude-kit.json`, grown with the audit's settings:

- `session-design rules` writes the ast-grep rules and the restricted-class list from the block, as `session-codeintel layers` writes the layer rules. The project's `eslint.config.js` imports the list, since ESLint loads plugins from the project.
- `session-design census`: the census, against the budgets.
- `session-design audit <url> --walk <module>`: the audit, failing on the whole floor (`fl-1` to `fl-5`), with the theme's init script, the widths and the languages from the block.
- `session-design compare <rev> <rev>`: the before-and-after of old-new.md, made by a script instead of by hand.
- `session-design checklist`: the checklist for the project's register.

### Records under each project's `docs/design/`

The brief, the system, the walk module and the inventory, held by `session-docs`.

## 6. Choices for the owner

1. **Tailwind v4 only, for now.** The token reset, the class lint and the census's shadow count are Tailwind's. Under "no abstraction before its second use", the kit supports Tailwind alone until a second stack wants the tools. Recommended.
2. **Where the Node tools live.** The kit's commands are Python today. The census and audit need Node packages (css-analyzer, Playwright, axe). Either the kit ships them with a lockfile, installed into `CLAUDE_PLUGIN_DATA` as its Python packages are, or each project keeps them as dev dependencies and the kit ships the scripts. The first keeps projects lighter and the versions in one place. Recommended, with `eslint-plugin-better-tailwindcss` staying in the project.
3. **The two missing guards.** The capability inventory and the existing-people field come from this project's costliest mistake. Recommended as rules every project follows.
4. **T6.** Never built. Either fold the states into the critique's checklist and the walk (an empty, a loading and an error state per screen in the walk module), or retire it with that result. Recommended: fold it.
5. **What fails.** Today the audit fails on axe alone. Recommended: on the whole floor, so `fl-3` and `fl-5` hold like contrast.
6. **The registers.** Tool, personal and showcase were chosen "for now" on 2026-11-15. Only personal was tried.
7. **Where the research lives.** It moves to the kit's `docs/` as the prior art behind the skill. This copy keeps its sections 1 and 8.

## 7. Before the move, fixes owed here

Each is a defect of the tools found by this analysis, for this project's own commits:

- The audit's usage line omits `--walk`.
- The audit fails on axe alone (section 3, point 4).
- The census resolves `var()` for sizes, families and radii but counts colours unresolved.
- A check for a control or label shown twice on one screen, which would have caught the deck page's All, Due, Weak and New.
