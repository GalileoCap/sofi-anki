# Critique checklist

T5 of the design trial in [design-research.md](../design-research.md), serving `O6` (the app looks made for its people, the same on every screen, and is easy to use). A reader who never saw the code or the conversation answers these questions from the rendered audit's screenshots (T4) and the [brief](brief.md). Each question is a rule of [rules.md](rules.md) held by `check` in the personal register, put as a yes or no about what a screenshot shows.

The reader is never asked whether the design is good, to rate it, or to choose between versions (`pro-6`). A question the screenshots cannot answer is marked "cannot tell", with what would answer it.

## How to answer

For each question: yes or no, the screens it was checked on, and for each "no" the screen, the region ("the topbar", "the second deck row") and what is seen there. The answer quotes what is on the screen, and it does not propose a redesign.

## Questions

### Process

- pro-2: Is any choice of colour, type, layout, shape or decoration one the brief's default check names as the generic choice, without the brief's constraint applied?
- pro-5: Is there more than one bold element competing on a screen, where bold means the thing the eye lands on first?

### Colour

- col-2: Do neutrals carry each screen, with saturated colour only on a few marks?
- col-4: Is red used only for wrong answers, failure and deletion?
- col-5: Is there a colour on any screen that stands for nothing (no state, no deck, no grade)?
- col-6: Is there any place where meaning is carried by colour alone, with no word, mark or position beside it?
- col-8: In any chart, do the series' colours look equally light, so none glows beside another?
- col-10: Does the palette read as one of the named stock palettes (cream with terracotta, purple to blue, neon on near-black)?

### Type

- type-3: Does each screen's hierarchy read from weight and colour before size?
- type-4: Is every label quieter than the value it names?
- type-6: Do figures that sit in a column line up by place, aligned right, and is monospace used only for code?
- type-8: Is any heading much larger than the rest of the screen needs?

### Space and shape

- sp-2: Do related things sit closer together than unrelated ones?
- sp-5: Is there a box inside a box, or a border where space alone already separates?
- sp-6: Is the same data drawn in the same shape on every screen where it appears (a deck, a grade, a due date, a figure)?

### Hierarchy and disclosure

- hi-1: Does each screen have one primary action, and is it the thing the person most often does there?
- hi-2: Are destructive and rare actions apart from the frequent ones?
- hi-3: Does each row carry at most one menu, rather than a set of its own buttons?
- hi-4: Is any action visible only on hover, with no other way to reach it on a phone?
- hi-5: Is the important thing on each screen emphasised by quieting the rest, rather than by making it louder?

### Data display

- data-1: Does each piece of data take the form its shape calls for (the brief's data table): a ranking as an ordered list, a time series as a chart or calendar, a fixed set of values as a chip or mark?
- data-2: Is every number shown one the person came for, with no repeated figures and no row of equal stat tiles?
- data-3: Does each chart show its scale, with one bar per data point?
- data-4: Do dates near now read as relative text ("tomorrow", "in 2 days")?

### States, copy and decoration

- st-4: Does every error or warning shown say what happened and how to recover?
- copy-1: Does every button's label say what it does?
- copy-2: Do labels use the person's words for the task ("Study") rather than the system's ("Start run")?
- copy-4: Is any figure or name on a screen invented, rather than taken from the demo decks the brief describes?
- dec-2: Are all icons from one style, as tall as the text beside them?
- dec-3: Is there any prop for mood (a cup, a star, tape, sparkles) that carries no information?
