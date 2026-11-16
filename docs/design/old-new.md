# Before and after the sticker chart, screen by screen

The owner's girlfriend dislikes the restyle (`A12`, the sticker-chart direction): its colours and font, and its layout and flow. This compares the app before it with the app now, so the two can be merged. It was made on 2026-11-16.

Each image has three columns, all on the same demo data:

- Before: the app at e03ee17, the last commit before a71ddaa gave the app the sticker chart.
- Now: sticker chart: `dev` at 41b3d25, in the default look.
- Now: classic look: the same build with the classic look (`A14`, chosen from home's More menu). It has the old colours and Figtree, on the new layout.

Every screen is in `old-new/` as `<screen>.<phone|laptop>.<light|dark>.png`. The phone is 375 px wide and shot full length. The laptop is 1280 by 800.

## Home

![home, phone](old-new/home.phone.light.png)
![home, laptop](old-new/home.laptop.light.png)

| | Before | Now |
|---|---|---|
| Title | "Your Decks" | "Today", with a line on what is due today, tomorrow and later this week |
| Progress | A streak line, today's count against the goal, and a 3-month heatmap in green | Today's sheet: one spot per card of the goal, with the week's stickers |
| Studying | Opened from a deck, which offered All, Due, Weak and New | One "Study 8 cards" button across every deck with cards due |
| Decks | A grid of cards, each with a big cover in the deck's colour and its emoji | A list ranked by due, each row with a coloured spine, a round sticker and a due badge |
| Top bar | Theme and language as words, Stats and New Deck beside the title | Icons for stats, language, theme and More |

## A deck's page

![deck, phone](old-new/deck.phone.light.png)
![deck, laptop](old-new/deck.laptop.light.png)

| | Before | Now |
|---|---|---|
| Study | A "Study" box of pills: All cards, Due, Weak, New, then a dialog for shuffle and a goal | "Study 5 due", and "Choose cards to study" for the rest |
| Actions | A row of text buttons: Add Card, Import, Export JSON, Export Anki, Share Link, Delete Deck | Icons for add and share, the rest under More |
| Cards | Rows that unfold, with difficulty, tags and Due as coloured pills, Edit and Delete on each | A table: the card, its last grade, how often it was right, when it comes back, and a menu |

## Studying

![study question, phone](old-new/study-question.phone.light.png)
![study answer, phone](old-new/study-answer.phone.light.png)
![study answer, laptop](old-new/study-answer.laptop.light.png)

| | Before | Now |
|---|---|---|
| Card | Centred text in a plain box, the difficulty as a pill under the question | Left-aligned, with the deck's sticker and name on top and a dashed rule under the question |
| Grades | Three wide buttons (Wrong, Approximate, Correct), then "Next" | Three round stamps (Wrong, Almost, Right) that grade and move on in one step, each saying when the card comes back |
| Ask again | A "Redo later" checkbox | "Ask it again in this run": If not right, Yes, No |
| Laptop | One column | The run's time, tally and actions in a side panel, each with its key |

## Stats

![stats, phone](old-new/stats.phone.light.png)
![stats, laptop](old-new/stats.laptop.light.png)

| | Before | Now |
|---|---|---|
| Totals | Six tiles: decks, cards, sessions, time, accuracy, streak | One line of the same numbers |
| History | The green heatmap and an accuracy-trend chart | A month calendar of stickers and a chart of first tries per run |
| Decks | A plain table | Rows like home's, ranked by the lowest first-try rate |

## What the classic look already brings back, and what it does not

It brings back the white and near-black neutrals, the black buttons, Figtree, and the old corners and shadows, in light and dark.

Everything else is the sticker chart. The headings stay extra-bold, where the old ones were regular weight. The rest of what is left:

- the dashed sheet and its spots on home and in studying
- the round stamps
- the deck list in place of the cover grid
- the "Today" home and its one Study button
- the stats calendar

## Ways to merge them

Each step below goes further than the one before, and costs more.

1. She uses the classic look. It exists and costs nothing. Check first whether she has seen it: it is hidden in home's More menu by design. If the colours were most of her objection, this may be enough.
2. Bring the classic look closer to the old app. Headings at regular weight, the sheet's dashed borders solid and quiet, and the stamps as flat rectangles, all under `.classic` alone. This answers "colours and font" fully. The layout stays. It is a few hours of work, and the census already counts both looks.
3. Bring back old layout pieces for everyone. Choose the pieces she misses, one by one. For example: the deck grid with big colour covers as a view home can switch to, the heatmap on stats beside the calendar, the All, Due, Weak and New pills on a deck's page. Each piece then belongs to the app in both looks, so nothing doubles. This needs her to name which pieces matter.
4. A new default that takes from both. The old palette and covers with the new Today home, one-step stamps and deck table. This replaces `A12` and needs the owner's decision. The restyle's work on features carries over, because everything `restore.md` brought back is behaviour.

Keeping the old screens whole beside the new ones was set aside under `A14`, since it would mean two versions of every screen against `C1`. That still holds.

## Old pieces brought back

The owner chose these on 2026-11-16 (`A18`, pieces of the app before the sticker chart come back as the owner picks them), taking step 3 for each:

- Home shows the decks as a grid of cards with a cover in the deck's colour, or as the list, by a switch beside "Decks". The classic look opens on the grid and the sticker chart on the list, until a person picks one. The pick is kept under `anki-deck-view`.
- Study's buttons say what they show, without "Show the": Hint, Answer, Difficulty, Time.
- On a phone, Undo, Skip and Save for later sit under the run's progress, out of the More menu, which keeps only the time.
- Stats opens on six tiles: decks, cards, runs, time, right first try, and the streak.
- P3: home's tags as chips under the search, unfolded.
- P5: a deck's page offers All, Due, Weak and New with their counts under Study, each opening the start dialog on its cards. They replace "Choose cards to study".

## Old pieces still removed

What else e03ee17 had that the app now lacks, found from the screens above. Each line is a candidate for the owner to take or leave. Behaviour came back under `restore.md`, so these are layout, wording and feel.

| | Screen | At e03ee17 | Now |
|---|---|---|---|
| P1 | Home | A 13-week heatmap of the cards studied each day, in greens from less to more | The last seven days as stickers, and the month calendar on stats |
| P2 | Home | One line: the streak and today's count against the goal, the goal edited in place | The sheet of spots, the goal behind its figure |
| P3 (back) | Home | The tags as chips beside the search, always in view | Folded under "Tags" |
| P4 | Every screen | The theme and the language as words ("Light", "EN") | Icons, with the other language's name |
| P5 (back) | Deck | Study pills with counts: All cards, Due, Weak, New, each one tap from a run | "Study N due", and the rest behind "Choose cards to study" |
| P6 | Deck | Add Card, Import, Export JSON, Export Anki, Share Link and Delete as a row of buttons | Add and Share as icons, the rest in More |
| P7 | Deck | Each card a row with its difficulty, tags and Due as coloured pills, and Edit and Delete in view | A table with last grade, right and comes back, and Edit and Delete in each row's menu |
| P8 | Study | The question and answer centred, the difficulty as a coloured pill | Left-aligned, the difficulty as a word on the card |
| P9 | Study | Grading in two steps: pick Wrong, Approximate or Correct, then Next, so a grade could change before moving on | A stamp grades and moves on at once, and Undo takes it back |
| P10 | Study | The grades named Wrong, Approximate, Correct | Wrong, Almost, Right |
| P11 | Study | "Exit" | "Leave" |
| P12 | Run's end | Confetti | Stickers falling in the decks' colours |
| P13 | Stats | Accuracy over every try | Right on the first try |
| P14 | Stats | The heatmap and an accuracy trend side by side, each in a bordered card | The month calendar and a chart of first tries per run, unboxed |
| P15 | Stats | Each deck as a compact line: cards, due, accuracy, last studied | Rows like home's, the neediest first |
| P16 | Stats | The streak in green from a week up | The streak in plain text |

The deck stats screen, the dialogs and the forms were not compared screen by screen, so they may hold more.

The next step is to show her these images and ask, screen by screen, which column she prefers and what about it. Taking a line of the table above is step 3 for that piece, and the choice between steps 2 and 4 is the owner's.
