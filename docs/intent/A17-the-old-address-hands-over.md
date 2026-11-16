---
id: A17
from: [O10, O1, O2, O7]
source: owner
status: decided 2026-11-15
kind: behaviour
implemented_by: [src/core/handover.ts, src/effects/handover.ts, src/handover-main.tsx, src/pages/hand-over.tsx, src/main.tsx, vite.config.ts, .github/workflows/deploy.yml, OWED.md]
proven_by: [tests/handover.test.ts]
supersedes: []
---

# A17 The app lives at anki.smplworks.net, and the old address becomes a page that hands its data over

The app is built for the root of `anki.smplworks.net` and pushed to the `gh-pages` branch of `GalileoCap/anki`, whose Pages site holds the custom domain. This repo's own Pages site, `galileocap.github.io/sofi-anki/`, serves a hand-over page in place of the app, with a service worker that removes itself so an installed copy of the old app stops serving from its cache.

The hand-over page forwards to the new address with the same hash, so a bookmark, a screen's address and a share link land where they did. When this browser holds decks or runs at the old address that it has not moved, the page asks first: its button opens the new address in a tab, which asks the old page for its stored text by `postMessage` and checks the sender's origin. A new address that has stored nothing takes the text as it is, language, theme and look included. One that has takes the decks, runs and schedules it lacks, by id, the way a backup merge does, and keeps its own settings. Text that does not read is refused, and nothing is written. The old page keeps its copy and records that it moved, so later visits forward at once. A backup download stays on the page for a browser that blocks the new tab.

## Context

The owner chose this on 2026-11-15 among three options. `localStorage` is per origin, so the new address cannot see what people saved at the old one. GitHub redirects a Pages site's github.io address to its custom domain, so the domain on this repo would make the old address unloadable and strand that data.

## Options

- Hand-over page on the old address (taken): one place the app lives, and old addresses keep working (`O10`, `O1`).
- The full app on both addresses, the old one with a banner to move: gentler, but a person's data can split between the two.
- The custom domain on this repo, accepting GitHub's redirect: simplest, and strands every person's data (`O1`).

## Consequences

A second repo and a deploy key in this one's secrets, against `C1` (keep it simple). The old address must turn into the hand-over only once the new one answers, which the order of the steps in `OWED.md` holds. A person who opens the old address in a browser that blocks the new tab moves by backup file.
