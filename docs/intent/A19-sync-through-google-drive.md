---
id: A19
from: [O11, O1, C1]
source: session
status: decided 2026-11-16
kind: behaviour
implemented_by: [src/core/sync.ts, src/effects/google-drive.ts, src/hooks/use-sync.ts, src/components/sync-dialog.tsx, src/pages/home.tsx, src/hooks/use-store.ts, src/effects/storage.ts, src/core/stored.ts, src/core/handover.ts, src/App.tsx, src/main.tsx, src/lib/translations/en.ts, src/lib/translations/es.ts, .github/workflows/deploy.yml, OWED.md]
proven_by: [tests/sync.test.ts]
supersedes: []
---

# A19 Each device keeps a stamp per item it changes, and sync merges the stamped stores through one file in the person's Google Drive app folder

Sync is off until a person turns it on from home's More menu, which signs them in with Google for the `drive.appdata` scope alone, which reaches a hidden folder only this app can read. The app then keeps one file there, `sofi-anki.json`, holding the store and its stamps.

**Stamps.** Every change to the store already passes through one place, `useStore`'s `update`, with the store before and after. A pure function compares the two and records, under the new key `anki-sync-stamps`, when each item last changed on this device: a deck's own fields and card order, each card, each run, each schedule and the settings, keyed by id. An item there before and gone after gets a tombstone with the time. Nothing in the decks, runs or schedules changes shape, so a backup, a share link and an `.apkg` read as before. Data stored before stamps existed reads as stamped at zero.

**Merge.** A pure function takes this device's store and stamps and the file's, and keeps for each item the later of the two. A tombstone removes an item stamped no later than it. A deck's fields and card order come from the side whose deck stamp is later, and its cards merge one by one, so editing different cards of a deck on two devices keeps both. A deck deleted on one device and edited later on another comes back. Equal stamps choose by the items' text, so two devices that merge each other's copies arrive at the same store.

**Sync.** Download the file, merge, write the merged store here, and upload it when it differs from the file. It runs when sync is turned on, when the app opens or comes back into view, when the browser comes back online, and a few seconds after each change. Two devices that upload at once can overwrite each other's upload, but each keeps its own changes and the next sync carries them up again, so nothing is lost (`O1`).

## Context

The owner chose Google Drive, optional, on 2026-11-16 (`C1`). The app has no server, so it uses Google's browser sign-in, whose access token lasts an hour and cannot be renewed without a click: a browser alone cannot hold a refresh token. Sync therefore pauses when the token expires and shows a button to resume, which opens Google's sign-in popup again, usually without asking anything. `A20` adds a token server that renews it without the click. The pause stays for when renewal fails.

## Options

- Stamps from the store's before and after (taken): no change to the stored shapes and no change to the code that edits decks.
- A `updatedAt` field on every deck, card and schedule: each edit site must remember to set it, and the backup and share shapes change.
- One copy of the store, last writer wins: two devices studying offline would lose one side's runs (`O1`).

## Consequences

Two new stored keys: `anki-sync-stamps`, and `anki-sync` for whether sync is on. Tombstones are never pruned, which costs a few bytes a deletion. A restore by replace on one device deletes on every synced device what the backup lacks, as a restore asks. The deploy needs a Google OAuth client id, the owner's step in `OWED.md`. Until it is set the More menu offers no sync. The owner chose the token server the same day (`A20`).
