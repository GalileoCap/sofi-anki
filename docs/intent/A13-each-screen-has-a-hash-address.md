---
id: A13
from: [O7, O2]
source: session
status: decided 2026-11-15
kind: behaviour
implemented_by: [src/core/route.ts, src/effects/page.ts, src/App.tsx]
proven_by: [tests/route.test.ts]
supersedes: []
---

# A13 Each screen has its address in the page's hash, beside the share link

Home is the bare address. Stats is `#/stats`, a deck `#/deck/<id>`, its stats `#/deck/<id>/stats`, a run `#/study` or `#/deck/<id>/study`, and a shared deck stays `#/share/<deck>`. Opening a screen adds a history entry, and the app's own back buttons step back through history when the entry before is where they lead, so the app's back and the browser's agree. An address naming a deck this browser lacks opens home.

A run lives only in memory: reloading or returning to its address opens its deck instead. Leaving a run by the browser's back keeps the cards answered so far, as leaving by the button does.

## Context

The app kept its screen in memory, so the browser's back left the app and a reload or bookmark always opened home. The site is served from GitHub Pages, which answers any path but the root's files with a 404.

## Options

- Addresses in the hash (taken): GitHub Pages serves them as they are, and the share links already in people's hands are one of them (`O2`).
- Addresses in the path (`/sofi-anki/deck/<id>`): tidier, but GitHub Pages answers them with a 404 page that has to redirect to the app, and a share link would still need its hash.
- A router library: more than six addresses need, against `C1`.

## Consequences

A deck's id is in its address, so a bookmark opens the deck only in the browser that holds it. Undone if the owner wants addresses without the `#`, which means the 404 redirect.
