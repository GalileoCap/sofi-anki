# The token server

The server behind sync's sign-in (`A20`). It runs on the owner's Opalstack host, `opal`, at `auth.anki.smplworks.net`, under a 16 MB memory cap. Opalstack's nginx holds the domain and its certificate and passes every request to an "nginx proxied port" app, whose port the server listens on.

It answers three calls from the app's origins, each a JSON `POST`:

| Path | Body | Answer |
| --- | --- | --- |
| `/exchange` | `{"code"}` from Google's sign-in popup | `{"token", "expiresIn", "sealed"}`, or 409 `sign_in_again` when Google gave no renewal token |
| `/refresh` | `{"sealed"}` | `{"token", "expiresIn"}`, or 401 when Google refuses the renewal token, 400 `bad_seal` when the seal does not open |
| `/revoke` | `{"sealed"}` | 204, after asking Google to revoke the renewal token |

`GET /health` answers `{"ok":true}` to anyone. It stores nothing, answers one request at a time and refuses a request over 8 KB.

## Settings

The unit reads `~/apps/anki_auth/env` on `opal`, readable by the owner alone. The first deploy makes it with a fresh sealing key.

| Variable | What it is |
| --- | --- |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | The Google OAuth client's id and secret (`OWED.md`) |
| `SEAL_KEY` | 64 hex digits. Changing it signs every browser out of sync, and each resumes with one click |
| `ALLOWED_ORIGINS` | Comma-separated origins allowed to call, `https://anki.smplworks.net` by default |
| `ANKI_AUTH_ADDR` | Where it listens, set by the unit from the panel's port |

## Deploy

```bash
PORT=<the proxied app's port> auth-server/deploy/deploy.sh
```

It copies the source to `opal`, builds it there with `cargo build --release --locked`, swaps the binary in, writes the unit from `deploy/anki-auth.service` and restarts it. `APP` names the panel's app when it is not `anki_auth`. The server's log is `~/logs/apps/anki_auth/error.log` on `opal`, one line a request, with no token in it.

## Check

```bash
curl -s https://auth.anki.smplworks.net/health
```

The memory it holds, under the cap:

```bash
ssh opal systemctl --user show anki-auth -p MemoryCurrent -p MemoryPeak
```

## Develop

`pnpm test:server` runs its tests, which put a fake Google on a local port. `scripts/check.sh` runs its lints and its formatting check.
