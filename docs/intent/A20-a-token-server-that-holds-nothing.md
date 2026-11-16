---
id: A20
from: [O11, C1]
source: owner
status: decided 2026-11-16
kind: behaviour
implemented_by: [auth-server/src/main.rs, auth-server/src/http.rs, auth-server/src/seal.rs, auth-server/src/google.rs, auth-server/deploy/deploy.sh, auth-server/deploy/anki-auth.service, src/effects/google-drive.ts, src/hooks/use-sync.ts, src/core/stored.ts, OWED.md]
proven_by: [auth-server/tests/api.rs]
supersedes: []
---

# A20 A Rust token server on opal renews Google sign-ins, with each renewal token sealed and kept in the person's browser

Sync (`A19`) signs in with Google's code flow. The browser sends the one-time code to `auth.anki.smplworks.net`, which trades it with Google for an access token and a renewal token, using the client secret only it holds. It hands back the access token and the renewal token sealed with ChaCha20-Poly1305 under a key only the server has. The browser keeps the sealed token beside the sync state. When the access token nears its hour, the browser sends the sealed token back and gets a new access token, with no click. Turning sync off sends it once more, and the server revokes it at Google.

The server stores nothing: no disk, no database, no session. It answers one request at a time on one thread, refuses a request over 8 KB, closes each connection after its answer, and gives up on a client silent for 5 seconds, so its memory stays the same whatever the load. Its systemd unit caps it at 16 MB, and a restart loses nothing. It answers only the app's origins.

## Context

A browser cannot keep a Google renewal token without a client secret, so `A19` paused sync each hour until a click. The owner chose this server on 2026-11-16 to remove the click, with the sealed token, the 16 MB cap and the address.

## Options

- Sealed renewal token in the browser (taken): the server keeps no state, and a stolen sealed token is useless without the server's key.
- Renewal tokens on the server's disk, the browser holding an id: storage, backups and growth with each person.

## Consequences

A server to deploy and keep on `opal`, its DNS name and its Opalstack site, and the Google client secret in a file there (`OWED.md`). Changing the sealing key signs everyone out of sync, and each resumes with one click. One request at a time means a burst of sign-ins waits its turn, a fraction of a second each. While the Google app is in Testing, renewal tokens last 7 days, so the app must be published for the renewal to hold.
