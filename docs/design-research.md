# Designing without the machine look

Research of 2026-11-15, asked by the owner after the first restyle mocks (`mocks/cozy/`, commit b56eaff) read as "extremely AI-looking", then widened the same day by the owner to their other projects, unrelated to Anki, some more professional and some more cozy and personal. It serves `O6` (the app looks made for its people, the same on every screen, and is easy to use). This project is the trial, and the tools are written to move to session-kit afterwards.

The parts: what went wrong in those mocks (1), what the research says about the machine look (2), the patterns working designers teach (3), how one method serves a professional tool and a cozy personal app alike (4), the tools proposed (5), the order of the trial (6), the shape they take in session-kit (7), and what this needs from the owner (8).

## 1. The mocks, read as a case

Each tell below is in the mocks, and most are named in the catalogs of section 2.

**Process.** No brief came before the pixels. Nothing named who studies, on what device, for how long, or what is wrong with the current screens. "Cute, cozy, study" went straight to the first associations a model has for those words, which are the same associations every model has.

**Four variants that are one variant.** All four share the same layout, the same components and the same copy. They differ in palette, font and ornament. That is one design shown in four skins, so the owner was offered no real choice.

**Cozy as pastiche.** Coziness was spelled out with props: a coffee cup, polka dots, washi tape, stars, a heart after the title, a fleuron in a corner. The props carry no information. The grade buttons in variant A wear a teapot, a biscuit and a croissant, which mean nothing about wrong, almost and right.

**The listed clichés, present.** Anthropic's own frontend-design skill names "a cream background with a terracotta accent (such as #D97757)" as a palette to avoid; variant A is #f7efe3 with #c8754f. Variant D is "dark mode with glowing accents". Every surface is a rounded card with the same soft shadow, a list card sits inside a section card, and the stats screen is a grid of big-number tiles with small labels. Progress bars are gradients. Meta lines are joined with middle dots ("7 of 12 · Spanish Verbs"), and links end in arrows ("Stats →"). The fonts (Fraunces, Fredoka, Quicksand, Caveat, Nunito) are the usual picks for "warm" and "playful".

**Emoji as decoration.** The logo, the streak, the grades and every deck cover are emoji. Deck emoji are the user's own data and stay. The rest is filler. Kole Jain puts emoji used as icons first among the tells of a vibe-coded product (section 3).

**Consistency, unchecked.** Inline `style` attributes set spacing ad hoc. Nobody counted the radii, shadows, font sizes and colours a screen uses. The weekday letters of the heatmap are 9.5 px, and no contrast was measured.

**The data did not shape anything.** The deck screen lists cards in a uniform table whatever they hold; the stats screen gives six tiles equal weight, whichever figure the person came to see. Colour was chosen for mood, so the grade colours are the only ones that mean something.

**Verification proved the wrong thing.** The check was "does it render", from screenshots scaled down to 800 px wide, judged by the same model that drew them. That shows the page loads. It says nothing about whether the page is good.

## 2. The machine look, and how far a model can judge

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

## 3. Patterns from practice

The catalogs say what to avoid. Working designers teach what to do instead, and their advice is more specific than the catalogs'. The owner pointed to Kole Jain, a product designer whose videos take an amateur or AI-made screen and fix it step by step. His points are below with the video each comes from; the transcripts were read in full for the [dashboard video](https://www.youtube.com/watch?v=Ksx9C2-3yMo) and through [SozAI's transcripts](https://sozai.app/transcript/dashboard-ui-flaws-never-built-one/) for the others. Several of his videos are sponsored by tools (Mobbin, Relume, Builder.io); the advice below stands apart from the sponsors.

### The data shapes the interface

From ["The 3 dashboard UI flaws that give away you've never built one"](https://www.youtube.com/watch?v=Ksx9C2-3yMo), the video the owner linked. Its three tells are the ones a model makes most, because each needs a reason drawn from the content:

1. **Data drives the form.** A column with a fixed set of values becomes chips; numbers are right-aligned so digits line up by place; long text truncates to give other columns room; inactive rows are shaded. Data with a time dimension becomes a timeline or a chart in place of a time-sorted table. Colour in a product comes from the data: a red chip because the action is urgent, an avatar because a face is recognised faster than a name. "Landing pages you can get away with a lot", but a dashboard's colours "shouldn't just be sprinkled in to look nice".
2. **Progressive disclosure.** Hierarchy is also what is shown and what is hidden. He calls the scale the *spectrum of explicitness*: a global share button is high on it, a copy icon that appears over a cell on hover is low. Each action sits as high as its frequency and importance earn. Onboarding is the same idea over time: one tooltip on the most important action, then the next. He contrasts it with a modal of six bullet points at first login, forgotten once dismissed.
3. **The interface you cannot see.** A dense screen works through hover chips, comment markers, tooltips on every icon that is not universal, drawers, popovers and their states. "AI has a hard time" with this, since a screenshot shows none of it. A new feature often needs only a better-placed control inside an existing page.

### Colour as layers, with a job each

From ["Why the 60-30-10 rule is ruining your UI designs"](https://sozai.app/transcript/60-30-10-rule-ruining-ui-designs/index.md) and ["The 7 color mistakes"](https://sozai.app/transcript/7-color-mistakes-ruin-ui-designs/index.md):

- **Neutrals first.** A product needs about four background layers, one or two stroke colours and three text tones (headings darkest, body a little lighter, secondary text lighter again). Borders are soft greys. The more important a button, the darker it is.
- **One accent, as a ramp.** The accent is a scale from light to dark: one step for the main use, a darker one for hover, a lighter one for links. Icons stay colourless unless colour means a state.
- **Semantic colour overrides the brand.** Red for destruction and failure even when the brand is orange. Chart series step around the hue wheel at equal lightness in OKLCH, so no series glows beside another.
- **Dark mode is its own palette.** Neutrals sit further apart than in light mode, borders brighten, text dims, surfaces lighten as they rise, and the accent moves to a lighter step. An inverted light mode is the tell.
- **Theming is a shift of the neutrals.** Convert each neutral to OKLCH, lower lightness slightly, add a little chroma, and rotate the hue to taste.

### Consistency and feedback

From ["7 UI/UX mistakes that scream you're a beginner"](https://sozai.app/transcript/ui-ux-mistakes-beginner/index.md) and ["Every UI/UX concept explained"](https://sozai.app/transcript/ui-ux-concepts-explained-10-minutes/index.md):

- Sketch the user flow on paper before the screens: a missing skip button is a flow error that no styling fixes.
- Effects are few and quiet: a shadow noticed first is overdone; gradients stay within one hue.
- Spacing comes from a scale of multiples of four, and related things sit closer than unrelated ones.
- Repeated components are identical apart from their content: one radius for small components, matching buttons, one search field.
- One icon library, icons as tall as the text's line, tooltips on every icon that is not universal.
- Redundant elements go: an arrow beside a swipe, a border where spacing already separates.
- Every action answers: a pressed state, a loading state for anything slow, a filled icon once saved. Buttons have at least default, hover, pressed and disabled; inputs have focus and error.
- Charts are honest: an axis, flat bar ends, as many bars as there are data points.
- Type: one sans-serif for a product; large headings with slightly tight tracking; a dashboard rarely needs text above 24 px.

### Product thinking over pretty screens

From ["Stop making pretty UIs. Think like a product designer"](https://sozai.app/transcript/stop-making-pretty-uis-think-product-designer/index.md) and ["5 SaaS UI/UX mistakes that scream you vibe code"](https://sozai.app/transcript/saas-ui-ux-mistakes-vibe-code/index.md):

- Design sequences of screens, starting from how the user got here and what they need next.
- Every screen has its empty, loading, success and error states; an empty state carries a message and the next step.
- Commit to a few decisions and reuse them, rather than building a component for each screen.
- The vibe-code tells he lists: emoji as icons, colours and layouts left to the model, repeated KPIs, every card carrying its own buttons where one menu would do, and options missing from a form because nobody walked the task.

### How he says taste is learned

From ["The stupid simple way to learn UI/UX design"](https://sozai.app/transcript/stupid-simple-way-learn-ui-ux-design/index.md): collect about twenty screens you like (a swipe file), annotate their spacing, hierarchy and grouping, clone one exactly to see its details, then restyle the clone twice, once "warm and friendly" and once "modern and premium", to learn flavour as a separate skill from structure. That last exercise is the method of section 4.

### The canon behind these

The same ideas appear in the standard references, which the tools cite for a rule:

- [Refactoring UI](https://www.refactoringui.com/) (Wathan and Schoger): hierarchy from weight and colour before size; emphasise by de-emphasising the rest; labels quieter than values; a constrained spacing scale chosen in advance.
- [Practical UI](https://www.practical-ui.com/) (Dannaway): a hundred-odd logic-based guidelines; one spacing scale everywhere; colour used purposefully and sparingly; contrast and hierarchy treated as accessibility rules.
- [Nielsen's ten heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/): visibility of status, a match with the user's own words and concepts, consistency, error prevention and recovery; the basis of the walkthrough in T6.
- [Laws of UX](https://lawsofux.com/) (Yablonski): Fitts, Hick, Jakob's law (people expect your app to work like the others they use), proximity.
- Real-product galleries such as [Mobbin](https://mobbin.com/) for references from shipped apps, which is what Kole Jain's swipe file draws on. It is paid, and has an MCP server.

### Where the sources disagree

The rules conflict in places, which is why a project's brief decides and a gate allows named exceptions:

| Question | One side | Other side |
|---|---|---|
| Hidden actions | Kole Jain reveals secondary actions on hover to save space | ux-skill warns hover-only actions fail on touch and keyboard |
| Pure white | Kole Jain: Linear and Notion use it, it is fine | pixelslop flags a pure white or black background |
| Fonts | Kole Jain: one sans-serif for a product | Anthropic: a distinctive display face paired with a body face |
| Colour budget | 60-30-10 for landing pages | Kole Jain's layers for products |

Most of these resolve by register: a dense professional tool and a personal app want different answers, as the next section sets out. Hover-only actions resolve the same way every time: a hover reveal also needs a touch and keyboard path (a long-press, a swipe, a menu, focus).

## 4. One method for every register

The owner's projects range from professional tools to cozy personal apps. The machine look is the same failure in both: a choice made because it is probable, with no reason in the subject. So the method stays the same in every register, and the register sets the values it works with.

The register is declared in the brief. Three are enough to start:

- **Tool.** Dense, used daily, judged by speed and trust: an admin, a dashboard, a developer tool. Neutrals carry nearly everything, colour comes from data and state, one sans-serif, small type, high disclosure discipline. Kole Jain's dashboard and colour-layer rules apply in full.
- **Personal.** Used by a few people who know each other, judged by feel: this app, a family recipe book, a hobby log. Personality is allowed one strong voice: a typeface, a colour drawn from the subject's materials, an illustration style, or the copy's tone. Everything else follows the tool rules, because a cozy app that breaks consistency or hides state is still a bad app.
- **Showcase.** A landing page or portfolio, read once, judged by impression. More freedom in composition and type; the catalogs' tells weigh most here, since this is where they are most common.

"Cute and cozy" in the personal register comes from the subject and the voice; props such as the mocks' coffee cups add nothing. For a study app the subject has real materials: index cards, pencil marks, library desks, a timetable, the rhythm of a streak. A variant draws one of them into its one bold element, with a reason, and keeps the rest quiet.

The register changes the gate's budgets (section 5, T3) and which checklist items apply (T5). It does not change the process, the floor of accessibility and states, or the rule that every choice has a written reason.

## 5. Tools proposed

Each tool answers a failure from section 1. The ones that decide are deterministic. The model is used where it generates, and its judgement only on narrow questions. Each is described for any project; the trial applies it to this one.

### T1 A design brief before any pixels

A skill (`design-brief`) that writes `docs/design/brief.md` and stops for the owner. Its sections:

- The register (section 4) and the reason for it.
- The people: who uses it, on which devices, where, and for how long.
- The tasks, five or so, each a sentence ("study today's due cards on a phone on the bus").
- The data each screen shows, and what shape it calls for (Kole Jain's first rule): a fixed set of values, a time series, a ranking, free text.
- What is wrong with the current screens, from full-size screenshots of the real app at phone and desktop width.
- References from the subject's world: its objects, places and printed matter, and a swipe file of real shipped screens. The owner adds or strikes them. Each reference is a picture or a named thing.
- The default check: for each of colour, type, layout, shape and decoration, the generic choice written out, then this project's choice and why it differs.

The owner approves the brief before any mock exists. It answers the missing grounding.

### T2 One design system, as tokens the build enforces

`docs/design/system.md` in the DESIGN.md shape, written from the tokens so it cannot drift. Following section 3: the neutral layers by role (backgrounds, strokes, text tones), one accent ramp, the semantic colours, a dark palette built as its own set, a type scale, a spacing scale of multiples of four, at most three radii and two shadow depths. The source of truth is the stylesheet; in a Tailwind project its `@theme` resets the defaults (`--*: initial`) and declares only the project's tokens, so an off-system value is not a class that exists. In this project `src/lib/ui-looks.ts` already makes a shared look an entry, and T2 extends the same idea down to the values.

### T3 A static design gate

A command that joins the project's static gates, at zero warnings:

- A lint of unknown and conflicting classes against the token entry (`eslint-plugin-better-tailwindcss` in a Tailwind project).
- ast-grep rules for the source tells: gradient utilities, `backdrop-blur`, arbitrary colour values, `transition-all`, inline `style` with literal values, emoji literals in markup outside user data, arrows and middle dots in copy. Each is planted and tested like a layer rule.
- A census of the built CSS (css-analyzer) against budgets per register, kept in the project's config: unique colours, font sizes, font families, radii and shadows.
- Exceptions carry their reason in place and are listed by `session-suppressions`, as the catalogs' "documented exceptions" ask.

It answers the inconsistency, and the clichés that can be seen in source.

### T4 A rendered audit

A script that opens each screen in a real browser at phone and desktop width, in light and dark. It saves full-resolution screenshots under a scratch directory and reports:

- axe-core violations, contrast first;
- a census of computed styles per screen: distinct font sizes, colours, radii and shadows painted;
- the rendered tells a DOM can show: nested cards, every button primary, one spacing value everywhere, same-shaped sibling grids, numbers left-aligned in a column, icons without an accessible name or tooltip;
- touch targets under 44 px and text that overflows its box.

It fails on axe violations and on budgets. The rest is a report. It answers the 800 px screenshot judged by eye.

### T5 A critique by checklist, from a fresh reader

A subagent that never saw the code or the conversation. It gets the T4 screenshots, the brief and a checklist drawn from sections 2 and 3, filtered by register, each item a yes or no question with the region of the screen ("does each column's form follow its data?", "is any secondary action reachable only by hover?"). It is never asked whether the design is good, to rate it, or to pick between variants, since section 2 shows those answers are near chance and biased by position. Its findings go to the owner beside the screenshots. It answers the author judging their own work.

### T6 An inventory of the unseen interface, and a walkthrough

Two records in `docs/design/`, both kept current as screens change:

- **States.** For every component and screen, its states: default, hover, pressed, focus, disabled, loading, empty, error, success, and every tooltip, popover and drawer. Each is either drawn or marked not applicable with a reason. This is Kole Jain's "UI you can't see", made into a list a session can check.
- **Walkthroughs.** For each task in the brief, the session drives the real app at phone width and records each step: what the screen asked, what the person had to know, and every state met. This is a cognitive walkthrough of named tasks against Nielsen's heuristics. Heuristic evaluation by a model is ruled out, since it found a quarter of the problems. The real test stays with the people who use it, and the walkthrough says what to ask them.

### T7 A rule for variants

Variants differ on structure (layout, density, disclosure, how the main object behaves), never on palette alone. Each states its bet in one sentence, names its one bold element and the subject material it comes from, and fills the default check of T1. Directions come before mocks: two or three one-page directions (the bet, the references, a type specimen, the tokens, one screen), and the full mock only for the direction the owner picks. Flavour is applied last, as Kole Jain's two-restyle exercise separates it.

### T8 A reference of rules, loaded on demand

Sections 2 and 3, reorganised by topic (colour, type, space, hierarchy and disclosure, states and feedback, data display, copy, motion, dark mode), each rule with its source and the registers it applies to, and the conflicts of section 3 stated where they occur. This is Impeccable's shape: a short core file read every time, references read only when the work touches their topic. It is what T5's checklist and T3's rules are drawn from, so a rule exists once.

## 6. Order of the trial

1. T1, the brief. It needs the owner's answers and references first.
2. T8 and T2. The reference is written from this document; the tokens follow the brief.
3. T3. Cheap and deterministic, and it holds every later mock.
4. T7 on the new directions, built inside T2's tokens and against T1's brief.
5. T4 and T5 on the chosen direction's mock, then on the app.
6. T6 on the restyled app.

Each tool that holds up becomes an action under `O6`, with what proved it. Each that adds cost without catching anything is retired with that result. The survivors move to session-kit.

## 7. The shape in session-kit

Proposed for after the trial, so a project of any kind and register takes them with a config block:

- **Rules** in the global `CLAUDE.md`, a line each: a brief before pixels; variants differ in structure; a model never grades a design, it answers checklist questions; every state of a component is drawn or ruled out.
- **A skill**, `design`, with the brief (T1), the variant protocol (T7) and the critique (T5) as its steps, and the T8 reference as its loaded-on-demand files.
- **A command**, `session-design`, with `check` (T3) and `audit` (T4), configured by a `design` block in `.claude/claude-kit.json`: the register, the token entry, the budgets, the screens and widths to render. Like `session-codeintel layers`, it writes its ast-grep rules from that block.
- **Records** under each project's `docs/design/`: the brief, the system, the states and the walkthroughs, held by `session-docs`.

## 8. What this needs from the owner

- Approval of `O6`, or its rewording.
- Agreement that the three registers (tool, personal, showcase) are the right split, or a different one.
- For this project's brief: who the friends are and what they study on; two or three things (apps, objects, places, books) whose feel you want, and two whose feel you don't; and what bothers you in the current app, if anything specific.
- Whether the dev dependencies T3 and T4 need are acceptable here: `eslint-plugin-better-tailwindcss`, `@projectwallace/css-analyzer`, `@axe-core/playwright` and Playwright with one browser.
