# Design rules

T8 of the design trial in [design-research.md](../design-research.md), serving `O6` (the app looks made for its people, the same on every screen, and is easy to use). It holds the rules of sections 2 and 3 of that document, sorted by topic, so each rule is written once. The static gate (T3) and the critique checklist (T5) are drawn from it, and a session reads only the topics its work touches.

Each rule has an id, the registers it applies to, its source, and what holds it:

- Registers: `all`, or any of tool, personal and showcase (research section 4).
- Held by: `gate` (the static design gate, T3), `audit` (the rendered audit, T4), `check` (a yes-or-no question in the critique checklist, T5), `walk` (the task walkthrough, T6), or `owner` (a matter of taste).
- Sources: KJ is Kole Jain's videos, RUI is Refactoring UI, PUI is Practical UI, NN is Nielsen's heuristics, AFD is Anthropic's frontend-design skill, PS is the pixelslop catalog, UXS is the ux-skill guide. Links are in the research.

Where two sources conflict, the rule says which side this register takes, and a project's brief can override it with a reason.

## Process

| Id | Rule | Registers | Source | Held by |
|---|---|---|---|---|
| pro-1 | An approved brief exists before any mock, token or restyle. | all | AFD, A9 | owner |
| pro-2 | Each choice of colour, type, layout, shape, decoration and motion names its reason in the brief's subject. A choice whose only reason is that it is common is replaced. | all | AFD | check |
| pro-3 | The flow is drawn before the screens: where the person came from, what they need next, and every exit. | all | KJ | walk |
| pro-4 | Variants differ in structure (layout, density, disclosure, how the main object behaves). Palette and font alone make one variant. | all | KJ, research T7 | owner |
| pro-5 | One bold element per design, drawn from the subject. The rest is plain. | personal, showcase | AFD | check |
| pro-6 | A model never rates a design or picks between variants. It answers narrow questions about a region against a written rule. | all | NN, UIClip | owner |

## Colour

| Id | Rule | Registers | Source | Held by |
|---|---|---|---|---|
| col-1 | Only the project's tokens exist as colours. No default palette, no hex or arbitrary colour in markup. | all | research T2 | gate |
| col-2 | Neutrals carry the screen: about four background layers, one or two stroke colours, three text tones (heading, body, secondary). | all | KJ | gate, check |
| col-3 | One accent, as a ramp: a main step, a darker step for hover and pressed, a lighter step for links and tints. | all | KJ | gate |
| col-4 | Semantic colour wins over the brand: red is failure and destruction even when the accent is red-orange. | all | KJ | check |
| col-5 | A colour in a product means something: a state, a category from the data, a person. Colour added for mood is removed. | tool, personal | KJ | check |
| col-6 | Meaning is never colour alone: a label, an icon or a position carries it too. | all | UXS, WCAG 1.4.1 | check |
| col-7 | Neutrals are tinted from the subject's material (paper, wood, stone), in OKLCH, with low chroma. Pure grey is a choice to justify. | personal, showcase | KJ | owner |
| col-8 | Chart series step around the hue wheel at equal OKLCH lightness. | all | KJ | check |
| col-9 | Gradients stay within one hue, and are rare. No gradient on text, bars or buttons. | all | KJ, AFD | gate |
| col-10 | Named stock palettes are avoided: cream with terracotta, purple to blue, neon on near-black. | all | AFD | check |

## Dark mode

| Id | Rule | Registers | Source | Held by |
|---|---|---|---|---|
| dark-1 | Dark mode is its own palette, built step by step. An inverted light mode is the tell. | all | KJ | owner |
| dark-2 | Surfaces lighten as they rise, borders brighten, and body text dims below pure white. | all | KJ | audit |
| dark-3 | The accent and the semantic colours move to a lighter step and keep their contrast. | all | KJ | audit |

## Type

| Id | Rule | Registers | Source | Held by |
|---|---|---|---|---|
| type-1 | One family for a product. A second face only for the strong voice, with its role written down. | tool, personal | KJ (one sans-serif), AFD (a display face) | gate |
| type-2 | Sizes come from a named scale of at most six steps. No arbitrary sizes. | all | RUI, PUI | gate |
| type-3 | Hierarchy comes from weight and colour before size. | all | RUI | check |
| type-4 | Labels are quieter than the values they name. | all | RUI | check |
| type-5 | Body text is at least 16 px on a phone, and no text is under 12 px. | all | PUI, UXS | audit |
| type-6 | Figures in a column use tabular figures and align right. Monospace is for code. | all | KJ | check |
| type-7 | The family covers every language the interface speaks, accents included. | all | brief | owner |
| type-8 | Headings in a product rarely pass 24 px, and large headings tighten their tracking slightly. | tool, personal | KJ | check |

## Space and shape

| Id | Rule | Registers | Source | Held by |
|---|---|---|---|---|
| sp-1 | Spacing comes from one scale of multiples of four. | all | KJ, PUI | gate |
| sp-2 | Related things sit closer than unrelated ones. | all | Laws of UX (proximity) | check |
| sp-3 | At most three radii, plus the pill, by size of the thing. | all | KJ, PS | gate |
| sp-4 | At most two shadow depths, only on what is lifted above the page (a menu, a dialog, the object in focus). | all | KJ, PS | gate |
| sp-5 | A container appears only where grouping needs it. No card sits inside a card, and no border where space already separates. | all | KJ, AFD, PS | audit, check |
| sp-6 | A layout is the same shape for the same data on every screen. | all | NN (consistency) | check |
| sp-7 | A phone gets the full width less its margins. | all | brief | audit |

## Hierarchy and disclosure

| Id | Rule | Registers | Source | Held by |
|---|---|---|---|---|
| hi-1 | Each action sits as high on the spectrum of explicitness as its frequency and importance earn. One primary action per screen. | all | KJ | check |
| hi-2 | Destructive and rare actions go in a menu, away from the frequent ones. | all | KJ, NN (error prevention) | check |
| hi-3 | A row's actions sit in one menu. | tool, personal | KJ | check |
| hi-4 | A secondary action revealed on hover also has a touch and keyboard path: a menu, a long press, a swipe or focus. | all | KJ, UXS | check, walk |
| hi-5 | Emphasise by quieting the rest. | all | RUI | check |
| hi-6 | Every icon that is not universal has a tooltip and an accessible name. | all | KJ | audit |
| hi-7 | Onboarding points at one action at a time, in place. A modal of instructions is out. | all | KJ | walk |

## Data display

| Id | Rule | Registers | Source | Held by |
|---|---|---|---|---|
| data-1 | The data's shape decides its form: a fixed set of values is a chip or an icon, a time series is a chart or a calendar, a ranking is an ordered list, free text truncates. | all | KJ | check |
| data-2 | A number shown is a number the person came for. No repeated KPIs and no row of equal stat tiles. | tool, personal | KJ, AFD | check |
| data-3 | Charts show their scale: an axis or a scale, flat bar ends, one bar per data point. | all | KJ | check |
| data-4 | Dates near now read as relative text ("in 3 days"), with the date on hover or focus. | tool, personal | brief | check |
| data-5 | Content the person wrote renders as they meant it: Markdown shows as formatted text wherever it appears. | all | brief | walk |

## States and feedback

| Id | Rule | Registers | Source | Held by |
|---|---|---|---|---|
| st-1 | Every control has default, hover, pressed, focus and disabled. Every input has focus and error. | all | KJ | audit, check |
| st-2 | Every screen has its empty, loading, error and success states, and an empty state says what to do next. | all | KJ, UXS | walk |
| st-3 | Every action answers: a pressed state at once, a loading state for anything slow, a changed state after. | all | KJ, NN (status) | walk |
| st-4 | An error says what happened and how to recover, in the person's words. | all | NN | check |
| st-5 | The states of each component and screen are listed in `docs/design/states.md`, each drawn or ruled out with a reason. | all | KJ, research T6 | walk |

## Copy

| Id | Rule | Registers | Source | Held by |
|---|---|---|---|---|
| copy-1 | A button's label matches what it does and the message it brings up. | all | AFD | check |
| copy-2 | Labels use the person's words for the task ("Study") over the system's ("Start run"). | all | NN (match) | check |
| copy-3 | No middle-dot meta strings, no arrows ending links, no eyebrow labels in tracked capitals, no 01/02/03 on what is not a sequence. | all | AFD | gate |
| copy-4 | A mock invents no figures or names. It uses the app's real data or the demo decks. | all | UXS | check |
| copy-5 | Every label fits in every language of the interface at phone width. | all | brief | audit |

## Decoration and motion

| Id | Rule | Registers | Source | Held by |
|---|---|---|---|---|
| dec-1 | No emoji as icons or decoration. Emoji the person chose (a deck's) are their data and stay. | all | KJ, AFD | gate |
| dec-2 | One icon library, icons as tall as the text's line. | all | KJ | check |
| dec-3 | No props for mood (cups, stars, tape, sparkles). | personal, showcase | research section 1 | check |
| dec-4 | No `backdrop-blur` glass, no glow. | tool, personal | AFD, PS | gate |
| mo-1 | Motion only where it explains a change: the object that turns, moves or arrives. No entrance animation on every section. | all | AFD | check |
| mo-2 | Transitions name the properties they animate (`transition-colors`, `transition-transform`). `transition-all` is out. | all | PS | gate |
| mo-3 | Reduced motion is honoured: the change happens without the movement. | all | UXS, WCAG 2.3.3 | audit |

## The floor

These hold in every register and are never traded for taste.

| Id | Rule | Registers | Source | Held by |
|---|---|---|---|---|
| fl-1 | Contrast meets WCAG AA: 4.5:1 for text, and 3:1 for large text and controls. | all | WCAG | audit |
| fl-2 | Focus is visible on every control. | all | WCAG, UXS | audit |
| fl-3 | Touch targets are at least 44 px on a phone. | all | Apple HIG, UXS | audit |
| fl-4 | Every control has a name and a role. | all | WCAG | audit |
| fl-5 | No text overflows or is cut off unannounced at 375 px wide. | all | UXS | audit |
