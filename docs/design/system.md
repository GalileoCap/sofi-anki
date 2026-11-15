# Design system

T2 of the design trial in [design-research.md](../design-research.md), serving `O6` (the app looks made for its people, the same on every screen, and is easy to use). The source of truth is [src/index.css](../../src/index.css). This page names each token's role, and the static design gate (T3) holds the code to them.

The values are those of the sticker chart (`A12`, the app takes the sticker-chart direction), taken from its mock in `mocks/sticker-chart/sticker.css` on 2026-11-15: neutrals tinted from pink sticker-sheet paper, text and accent in berry ink of low chroma, so the only saturated colours are the decks' and the three grades'. The roles and their number are those the app had before.

## How it is held

- `src/index.css` resets Tailwind's palette, radii, shadows, type sizes and families (`--color-*: initial` and the like), then declares the project's own. A class for anything else does not exist.
- ESLint's `better-tailwindcss` rules report a class that does not exist, two classes that fight, and the restricted forms in `eslint.config.js`: arbitrary colours, sizes, radii and shadows, gradients, glass, `transition-all`, tracked capitals.
- ast-grep rules in `lint/design/` report emoji in the app's own markup, fixed values in an inline style, and middle dots or arrows in the copy.
- `scripts/design-census.mjs` counts what the built stylesheet can paint, against the budgets in the `design` block of `.claude/claude-kit.json`, after `pnpm build` in `pnpm check`.
- Tailwind reads classes from `src/` alone, so a class named in a document or a mock is never built.

The rule ids in each message (`col-1`, `type-2`) are those of [rules.md](rules.md).

## Colour

Each role has a light value and a dark one, declared in `:root` and `.dark`. The dark set is its own palette, under `dark-1` to `dark-3`.

| Role | Tokens | Used for |
|---|---|---|
| Surfaces | `background`, `card`, `popover`, `muted` (with `secondary` and `accent`, the same value) | The page, a card on it, what floats over it, a quiet fill for a hovered row or a track |
| Strokes | `border`, `input` | Dividers and outlines, a field's edge |
| Text | `foreground` (with `card-` and `popover-foreground`), `secondary-foreground`, `muted-foreground` | Headings and body, text on a quiet fill, labels and secondary text |
| Accent | `primary`, `primary-foreground`, `ring` | The primary action of a screen, focus |
| Meaning | `positive`, `caution`, `negative`, each with `-soft` | A right, almost or wrong answer, an accuracy that is good, middling or poor, the daily goal, what is due. `-soft` is the tinted fill behind the strong step, and the strong step at 40 % is its border |
| Deletion | `destructive` | Delete and its confirmation |
| Scrim | `black` | shadcn's dialog overlay, its only use |

The decks' own colours (`src/lib/deck-colors.ts`) are the people's data and sit outside the system. They appear only as each deck's mark.

## Type

One family, M PLUS Rounded 1c in its Latin set (weights 400, 500, 700 and 800), set for both `sans` and `heading`. `mono` is the system's monospace, for code only.

| Token | Size at the 18 px root | Used for |
|---|---|---|
| `text-xs` | 13.5 px | Fine print, counts beside a label, chart keys |
| `text-sm` | 15.75 px | Labels, list lines, buttons |
| `text-base` | 18 px | Card text and body |
| `text-lg` | 20.25 px | A section's title |
| `text-xl` | 22.5 px | A dialog's title |
| `text-2xl` | 27 px | A screen's title |
| `text-code` | 0.82 em | Code inside running text, sized to the text around it |
| `text-emoji` | 26 px | A deck's emoji on its large sticker, at the top of the deck's page |

## Space and shape

- Space is Tailwind's single `--spacing` unit and its multiples, so every gap is a step of the same scale (`sp-1`). The shared gaps are named in `src/lib/ui-looks.ts`.
- Radii: `sm` (8 px) for menu entries and small marks, `md` and `lg` (12 px) for fields, rows and menus, `xl` and `2xl` (22 px) for the sheet, the study card and dialogs, `4xl` (999 px), which makes a pill of a button, and `full` for a round sticker or chip. shadcn's components name all of these, so the names share three values and the pill.
- Shadows: `shadow-sm` for a sticker stuck on the sheet, `shadow-md` for the study card and what floats over the page (a menu, a dialog). Each mode has its own pair, `--lift-sm` and `--lift-md`.

## Motion

Colour changes on hover and press, and nothing else moves. The sheet filling with a sticker after each grade is the feedback for the daily goal. Each transition names its property (`mo-2`).

## Budgets

The census on 2026-11-15, after the restyle to the sticker chart. Each budget is the count now, so any growth is a decision. A count that drops fails too, and the budget is lowered to keep the gain.

| Dimension | Count | What it holds |
|---|---|---|
| Colours | 41 | The light and dark tokens, each mode's two shadow colours, and Tailwind's own transparent, current colour and ring defaults. The tinted neutrals of each mode share fewer values than shadcn's greys did |
| Type sizes | 12 | The eight tokens, the 18 px root, and the browser defaults Tailwind's reset keeps (`1em`, `75 %`, `80 %`) |
| Families | 3 | M PLUS Rounded 1c, the monospace, and Tailwind's fallback stack |
| Radii | 6 | None, the three radii, the round one, and the pill |
| Shadows | 3 | None, and the two depths |
