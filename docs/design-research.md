# Designing without the machine look

Research of 2026-11-15, asked by the owner after the first restyle mocks (`mocks/cozy/`, commit b56eaff) read as "extremely AI-looking". It serves `O6` (the app looks made for its people, the same on every screen, and is easy to use). This project is the trial, and what works moves to session-kit.

Three parts: what went wrong in those mocks, what the research says, and the tools proposed for the trial with their order.

## 1. The mocks, read as a case

Each tell below is in the mocks, and most are named in the catalogs of section 2.

**Process.** No brief came before the pixels. Nothing named who studies, on what device, for how long, or what is wrong with the current screens. "Cute, cozy, study" went straight to the first associations a model has for those words, which are the same associations every model has.

**Four variants that are one variant.** All four share the same layout, the same components and the same copy. They differ in palette, font and ornament. That is one design shown in four skins, so the owner was offered no real choice.

**Cozy as pastiche.** Coziness was spelled out with props: a coffee cup, polka dots, washi tape, stars, a heart after the title, a fleuron in a corner. The props carry no information. The grade buttons in variant A wear a teapot, a biscuit and a croissant, which mean nothing about wrong, almost and right.

**The listed clichés, present.** Anthropic's own frontend-design skill names "a cream background with a terracotta accent (such as #D97757)" as a palette to avoid; variant A is #f7efe3 with #c8754f. Variant D is "dark mode with glowing accents". Every surface is a rounded card with the same soft shadow, a list card sits inside a section card, and the stats screen is a grid of big-number tiles with small labels. Progress bars are gradients. Meta lines are joined with middle dots ("7 of 12 · Spanish Verbs"), and links end in arrows ("Stats →"). The fonts (Fraunces, Fredoka, Quicksand, Caveat, Nunito) are the usual picks for "warm" and "playful".

**Emoji as decoration.** The logo, the streak, the grades and every deck cover are emoji. Deck emoji are the user's own data and stay. The rest is filler.

**Consistency, unchecked.** Inline `style` attributes set spacing ad hoc. Nobody counted the radii, shadows, font sizes and colours a screen uses. The weekday letters of the heatmap are 9.5 px, and no contrast was measured.

**Verification proved the wrong thing.** The check was "does it render", from screenshots scaled down to 800 px wide, judged by the same model that drew them. That shows the page loads. It says nothing about whether the page is good.

## 2. What the research says

### Why model output converges

Asked for a design with no constraints, a model samples the most probable one, which is the average of its training data ([prg.sh](https://prg.sh/ramblings/Why-Your-AI-Keeps-Building-the-Same-Purple-Gradient-Website), [Vandelay](https://www.vandelaydesign.com/?p=61673)). Defaults copied at scale feed that average: one widely shared argument traces the purple look to Tailwind's indigo default ([dev.to](https://dev.to/alanwest/why-every-ai-built-website-looks-the-same-blame-tailwinds-indigo-500-3h2p)). Banning a default shifts the model to the next most probable choice. Anthropic's skill notes that models banned from Inter converge on Space Grotesk. A ban list alone moves the cliché and does not remove it.

### The catalogs of tells

Three catalogs agree closely:

- Anthropic's [frontend-design skill](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md) lists what to avoid. Its list includes the SaaS card kit (identical rounded cards, one radius, one soft shadow, gradient washes), the hero metric, accented words in headlines, tracked all-caps eyebrow labels, 01/02/03 numbering on what is not a sequence, middle-dot meta strings, arrows on links, entrance animation on every section, hover effects on every card, and named stock palettes.
- [pixelslop's catalog](https://cdn.jsdelivr.net/npm/pixelslop@0.3.8/dist/skill/resources/ai-slop-patterns.md) has 26 rendered patterns and 16 source patterns. Each has a detection method: a computed style, a DOM shape, or a source grep. Examples are "8–20 px radius with box-shadow on many containers", "3+ same-size siblings with similar internal structure", "section spacing collapses to one or two values", and "every button is primary".
- The [ux-skill detection guide](https://github.com/Laith0003/ux-skill/wiki/How-to-detect-AI-slop-in-your-design) adds content tells (invented round statistics, decorative emoji, placeholder names) and UX checks: empty, loading, error and zero-data states, actions hidden behind hover, focus outlines, 44 px touch targets, meaning carried by colour alone, and reduced motion.

### What the counter-practice shares

The sources that propose a fix agree on a process more than a style:

1. **Ground the design in its subject before choosing anything.** Anthropic's skill opens with the subject, its audience and its primary job, then "the industry, materials, and vernacular" of the subject. A look borrowed from the real objects of the activity is specific to it. A look borrowed from other apps is the average again.
2. **Plan as tokens and words before code.** A compact system (four to six named colours, typefaces with roles, a layout concept with wireframes, a few principles) is reviewed against the brief before building. The skill's step three asks, for each choice, whether it is "the generic default for any similar page", and revises the ones that are.
3. **Concentrate boldness.** One memorable element; the rest disciplined.
4. **Make structure carry information.** Rules, borders, labels and numbers appear only where they mean something.
5. **Hold a quality floor apart from taste.** Responsive layout, visible focus, reduced motion, contrast, consistent words (a button's label matches the message it triggers), errors that say how to recover, empty states that invite the next step.
6. **Name exceptions.** Every catalog allows a cliché when the brief justifies it, with the reason written down. That is the shape of session-kit's suppressions.

[Impeccable](https://dev.to/ji_ai/impeccable-why-every-ai-generated-ui-looks-the-same-and-17-commands-to-fix-it-3e1a) builds on Anthropic's skill with a short core file, seven references loaded on demand (type, colour, space, motion, interaction, responsive, UX writing), and narrow commands (`/audit`, `/critique`, `/normalize`, `/quieter`). Its author reports that explicit bans beat requests for "good design".

The [DESIGN.md convention](https://betterstack.com/community/guides/ai/design-md-ai/), popularised by Google Stitch, puts a design system in a Markdown file at the root, beside the agent's own instructions. Its known weakness is drift: nothing checks that the code follows it.

### How far a model can judge a design

This is the finding that shapes the tools most:

- Baymard tested GPT-4 on e-commerce screenshots, as [reported by Jakob Nielsen](https://jakobnielsenphd.substack.com/p/ai-ux-evaluation). It found 24 % of the usability problems, 19 % of its advice was sound, and 9 % would have made the page worse. It cannot see problems between screens, which were 43 % of all problems. Nielsen's advice is to use AI for ideas and to keep evaluation with people.
- The UIClip authors found large vision models near chance at rating design quality. One preferred a screenshot with overflowing text to the original, with "realistic-sounding but inaccurate reasoning" ([summary](https://a11y-paradise.onrender.com/reviews/69cf2ab1c1b08d12aa325486)).
- Adobe's [MLLM-as-a-UI-judge](https://arxiv.org/html/2510.08783v1) benchmark finds models within a point of human ratings on some dimensions and far off on others. Pairwise judges show position bias, and the best web-development judge agrees with experts about two times in three.
- Critique still helps when it is specific. The [UICrit](https://arxiv.org/html/2407.08850v3) work ties each comment to a region and a guideline. Amazon's vision-guided refinement work reports better front-end code from render, critique and regenerate loops than from one pass.

So a model's overall verdict on its own design is close to worthless. What it can do is answer narrow, checkable questions about a region of a screen against a written rule. Questions of taste go to the owner.

### Tools that measure consistency

- **Tailwind's theme reset.** In Tailwind v4, `--color-*: initial` inside `@theme` removes the default palette, and `--*: initial` removes every default. Then only the project's tokens exist as utilities ([docs](https://tailwindcss.com/docs/theme)). Arbitrary values (`bg-[#123456]`) still get through, which is a lint's job.
- **[eslint-plugin-better-tailwindcss](https://npmjs.com/eslint-plugin-better-tailwindcss).** `no-unknown-classes` reports classes the project's Tailwind entry does not define, and `no-conflicting-classes` reports classes that fight each other. It reads the v4 CSS entry through its `entryPoint` setting.
- **[Project Wallace's css-analyzer](https://npmjs.com/package/@projectwallace/css-analyzer).** It counts unique colours, font sizes, font families, radii, shadows and units in a stylesheet. The distance between the colours used and the palette meant is "the measurable form of design drift" ([OpenReplay](https://blog.openreplay.com/audit-stylesheet-project-wallace/)).
- **axe-core in a real browser.** Contrast, names, roles and focus, run on the rendered page rather than the source.

## 3. Tools proposed for the trial

Each tool answers a failure from section 1. The ones that decide are deterministic. The model is used where it generates, and its judgement only on narrow questions.

### T1 A design brief before any pixels

A skill (`design-brief`) that writes `docs/design/brief.md` and stops for the owner. Its sections:

- The people: who studies, on which devices, where, and for how long.
- The tasks, five or so, each a sentence ("study today's due cards on a phone on the bus").
- What is wrong with the current screens, from screenshots of the real app at phone and desktop width.
- References from the subject's world: the objects and places of studying. The owner adds or strikes them. Each reference is a picture or a named thing.
- The default check: for each of colour, type, layout, shape and decoration, the generic choice written out, then this project's choice and why it differs.

The owner approves the brief before any mock exists. It answers the missing grounding.

### T2 One design system, as tokens the build enforces

`docs/design/system.md` in the DESIGN.md shape: four to six named colours, a type scale, a spacing scale and at most three radii and two shadow depths, each with its role. The source of truth is `src/index.css`. Its `@theme` resets Tailwind's defaults (`--*: initial`) and declares only the project's tokens, so an off-system colour is not a class that exists. `src/lib/ui-looks.ts` already makes a shared look an entry. This extends the same idea down to the values. The prose file is written from the tokens, so it cannot drift from them.

### T3 A static design gate

A script in `scripts/check.sh`, at zero warnings like every other gate:

- `eslint-plugin-better-tailwindcss` with `no-unknown-classes` and `no-conflicting-classes`, pointed at `src/index.css`.
- ast-grep rules for the source tells (gradient utilities, `backdrop-blur`, arbitrary colour values, `transition-all`, inline `style` with literal values, emoji literals in JSX outside user data, arrows and middle dots in copy). Each is planted and tested like the layer rules.
- A census of the built CSS with css-analyzer, against budgets kept in `.claude/claude-kit.json`: unique colours, font sizes, radii and shadows.
- Exceptions carry their reason in place and are listed by `session-suppressions`, as the catalogs' "documented exceptions" ask.

It answers the inconsistency, and the clichés that can be seen in source.

### T4 A rendered audit

A script that opens each screen in a real browser at 390 px and 1280 px wide, in light and dark. It saves full-resolution screenshots under a scratch directory and reports:

- axe-core violations, contrast first;
- a census of computed styles per screen: distinct font sizes, colours, radii and shadows painted;
- the rendered tells of the pixelslop catalog that a DOM can show (nested cards, every button primary, one spacing value everywhere, same-shaped sibling grids);
- touch targets under 44 px and text that overflows its box.

It fails on axe violations and on budgets. The rest is a report. It answers the 800 px screenshot judged by eye.

### T5 A critique by checklist, from a fresh reader

A subagent that never saw the code or the conversation. It gets the T4 screenshots, the brief and a checklist drawn from the catalogs, each item a yes or no question with the region of the screen. It is never asked whether the design is good, to rate it, or to pick between variants, since section 2 shows those answers are near chance and biased by position. Its findings go to the owner beside the screenshots. It answers the author judging their own work.

### T6 A walkthrough of the brief's tasks

For each task in the brief, the session drives the real app (the browser pane, or Playwright) at phone width. It records each step: what the screen asked, what the person would have to know, and every state met on the way (empty, error, loading, zero data). The record goes in `docs/design/walkthroughs.md`. This is a cognitive walkthrough of named tasks. Heuristic evaluation by a model is ruled out, since it found a quarter of the problems. The real test stays with the friends, and the walkthrough says what to ask them.

### T7 A rule for variants

Variants differ on structure (layout, density, type, how the study card behaves), never on palette alone. Each states its bet in one sentence, names its one bold element, and fills the default check of T1. Directions come before mocks: two or three one-page directions (the bet, the references, a type specimen, the tokens, one screen), and the full mock only for the direction the owner picks.

## 4. Order of the trial

1. T1, the brief. It needs the owner's answers and references first.
2. T2 and T3. Cheap and deterministic, and they hold every later mock.
3. T7 on the new mocks, built inside T2's tokens and against T1's brief.
4. T4 and T5 on those mocks, then on the app once a direction is chosen.
5. T6 on the restyled app.

Each tool that holds up becomes an action under `O6`, with what proved it. Each that adds cost without catching anything is retired with that result. The ones that survive are the candidates for session-kit. T1, T5 and T7 are process and port as skills and rules. T3 and T4 are scripts with a per-project config block, like `session-codeintel layers`.

## 5. What this needs from the owner

- Approval of `O6`, or its rewording.
- For T1, the brief's raw material: who the friends are and what they study on; two or three things (apps, objects, places, books) whose feel you want, and two whose feel you don't; and what bothers you in the current app, if anything specific.
- Whether the dev dependencies T3 and T4 need are acceptable: `eslint-plugin-better-tailwindcss`, `@projectwallace/css-analyzer`, `@axe-core/playwright` and Playwright with one browser.
