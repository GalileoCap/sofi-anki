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
2. Make a key pair: `ssh-keygen -t ed25519 -N "" -C "sofi-anki deploy" -f anki-deploy`.
3. In `GalileoCap/anki`, Settings → Deploy keys: add `anki-deploy.pub`, with write access.
4. In `GalileoCap/sofi-anki`, Settings → Secrets and variables → Actions: a secret `ANKI_DEPLOY_KEY` holding `anki-deploy`, the private half. Then delete both files.

### Pages on `GalileoCap/anki`, after the first deploy writes its `gh-pages` branch

Done 2026-11-16 up to the last item: `https://anki.smplworks.net/` serves the app. Open: "Enforce HTTPS" (`http://` still answers without redirecting), and the run that gives the old address its hand-over page, since the run of 10:17 UTC came before the site was up and skipped it.

Until `https://anki.smplworks.net/` serves the app, the workflow skips the hand-over's deploy, so the old address keeps serving the old app.

1. Settings → Pages: source "Deploy from a branch", branch `gh-pages`, folder `/`.
2. Custom domain `anki.smplworks.net` (the workflow writes the `CNAME` file too), then "Enforce HTTPS" once GitHub has issued the certificate.
3. Recommended: verify `smplworks.net` under the account's Settings → Pages, so no other account can claim the subdomain.
4. Check `https://anki.smplworks.net/` opens the app, then run the workflow again (Actions → Deploy to GitHub Pages → Run workflow) so the old address takes the hand-over page.

### `GalileoCap/sofi-anki` keeps no custom domain

Its Settings → Pages must leave the custom domain empty: a domain there makes GitHub redirect the old address, which strands the data saved there.
