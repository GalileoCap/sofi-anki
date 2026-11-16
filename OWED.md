# Owed

What a change leaves to do outside the code, under when it is due. An entry is never removed, and one done is marked done with its date.

## Before `main` takes the move to anki.smplworks.net (A17)

The deploy turns the old address into the hand-over page, which forwards to the new one, so the new one must answer first. Each is the owner's step, in this order.

### DNS: anki.smplworks.net points at GitHub Pages

Done 2026-11-16: `dig` names `galileocap.github.io`.

At Opalstack, a `CNAME` record for `anki.smplworks.net` to `galileocap.github.io.`. `dig +short anki.smplworks.net` names `galileocap.github.io` once it holds.

### The repo `GalileoCap/anki`, with a deploy key this repo's workflow pushes with

Done 2026-11-16, by the owner's word. The repo answers. The secret is checked by the first deploy.

1. Create `GalileoCap/anki`, public (a free account serves Pages from a public repo only), with any first commit so it has a branch.
2. Make a key pair outside the project folder: `ssh-keygen -t ed25519 -N "" -C "sofi-anki deploy" -f ~/anki-deploy`.
3. In `GalileoCap/anki`, Settings → Deploy keys: add `anki-deploy.pub`, with write access.
4. In `GalileoCap/sofi-anki`, Settings → Secrets and variables → Actions: a secret `ANKI_DEPLOY_KEY` holding `anki-deploy`, the private half. Then delete both files.

### Pages on `GalileoCap/anki`, after the first deploy writes its `gh-pages` branch

Done 2026-11-16, "Enforce HTTPS" included (`http://` paths redirect to `https://`): `https://anki.smplworks.net/` serves the app, and the deploy of 9fa1b97 gave the old address its hand-over page, driven live (a move, a forward after it, a share link forwarded).

Until `https://anki.smplworks.net/` serves the app, the workflow skips the hand-over's deploy, so the old address keeps serving the old app.

1. Settings → Pages: source "Deploy from a branch", branch `gh-pages`, folder `/`.
2. Custom domain `anki.smplworks.net` (the workflow writes the `CNAME` file too), then "Enforce HTTPS" once GitHub has issued the certificate.
3. Recommended: verify `smplworks.net` under the account's Settings → Pages, so no other account can claim the subdomain.
4. Check `https://anki.smplworks.net/` opens the app, then run the workflow again (Actions → Deploy to GitHub Pages → Run workflow) so the old address takes the hand-over page.

### `GalileoCap/sofi-anki` keeps no custom domain

Its Settings → Pages must leave the custom domain empty: a domain there makes GitHub redirect the old address, which strands the data saved there.

## Before sync shows on anki.smplworks.net (A19)

Until the deploy has a client id, the app builds and works as before, with no Sync in home's More menu.

### A Google OAuth client for the app folder, named to the deploy

The owner's step, in a Google account of theirs.

1. At console.cloud.google.com, make a project (for instance "sofi-anki") and enable the Google Drive API in it.
2. Google Auth Platform → Branding: app name "sofi-anki", support and developer email, home page `https://anki.smplworks.net/`.
3. Audience: External. Data access: add the scope `https://www.googleapis.com/auth/drive.appdata`, which Google lists as non-sensitive. While the app is in Testing, only the Google accounts added under Test users can sign in, and Google asks them again every 7 days. Publish it to let any friend in, and check then whether Google asks for verification.
4. Clients → Create client → Web application. Authorized JavaScript origins: `https://anki.smplworks.net` and `http://localhost:5173`. No redirect URI.
5. In `GalileoCap/sofi-anki`, Settings → Secrets and variables → Actions → Variables: `GOOGLE_CLIENT_ID` holding the client id. For `pnpm dev`, the same in an untracked `.env.local` as `VITE_GOOGLE_CLIENT_ID=…`.
6. Push to `main` and turn sync on from two devices: the More menu shows Sync, and an edit on one shows on the other.

## Before sync renews sign-ins without a click (A20)

The app built with `VITE_AUTH_SERVER` signs in through the token server, so the server must answer at its address before `main` deploys a build with sync. Each is the owner's step, after the Google client above, in this order.

### The Google client's secret, and the code flow's origins

In the Google client of the section above: copy its client secret. The sign-in popup's code needs no redirect URI. The authorized JavaScript origins stay `https://anki.smplworks.net` and `http://localhost:5173`.

### auth.anki.smplworks.net points at opal

At Opalstack's DNS, `auth.anki.smplworks.net` to opal's address, the same as `stance.smplworks.net`. `dig +short auth.anki.smplworks.net` names opal's address once it holds.

### An Opalstack app and site for the server

1. Applications: a new "Nginx Proxy Port" app named `anki_auth`. Note its port.
2. Sites: a new site for `auth.anki.smplworks.net`, routing `/` to `anki_auth`, with the panel's free HTTPS certificate turned on.

### The first deploy, then its settings

1. `PORT=<the app's port> auth-server/deploy/deploy.sh`. It makes `~/apps/anki_auth/env` on opal with a fresh `SEAL_KEY`, and the server stops at once for want of the Google client.
2. On opal, fill `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in that file, then `systemctl --user restart anki-auth`.
3. `curl -s https://auth.anki.smplworks.net/health` answers `{"ok":true}`.

### The Google app published

While the Google app is in Testing, its renewal tokens last 7 days, and each tester signs in again after them. Publishing it (Google Auth Platform → Audience → Publish app) makes them last.
