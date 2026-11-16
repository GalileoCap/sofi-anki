---
id: C1
source: owner
status: stated 2026-11-16
---

# C1 Keep it simple: no accounts, sync only through a person's own Google Drive when they choose it, and one tiny server that only renews Google sign-ins

When a feature would need multi-user features, auth or a backend, the work finds the in-browser way or puts the trade to the owner first.

The owner's words, from the project's `CLAUDE.md` before 2026-11-15: "a personal-use Anki clone. Keep it simple; no need for multi-user features, auth, or backend complexity." Carried into the record on 2026-11-15, when `G1` widened the users to the owner's friends. Each friend runs the app in their own browser.

The owner confirmed this reading on 2026-11-15, with sync put off: "Yes, it's correct for now (we'll consider sync later)".

## Amended 2026-11-16

The owner allowed cross-device sync through each person's own Google Drive, on condition that it stays optional: "Google Drive, but it should be optional (in case people don't want to or can't log-in with Google)". The app keeps no account and runs no server of its own. Signing in with Google is an exception taken only by a person who turns sync on, and everything works without it. The other options put to the owner were a small relay of our own reached by a sync code, a device-to-device transfer, and a file in a synced folder.

## Amended again 2026-11-16

The owner chose a small token server in Rust on their host `opal`, after hearing that a browser alone cannot renew a Google sign-in without a click, on one condition: "it needs to use a fixed extremely small amount of RAM". It runs on `opal` at `auth.anki.smplworks.net` under a 16 MB memory cap, and holds no data: each person's renewal token is sealed by the server and kept in their own browser. The owner picked the cap, the sealed token and the address on 2026-11-16.
