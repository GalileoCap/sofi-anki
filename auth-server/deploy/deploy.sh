#!/usr/bin/env bash
# Builds the token server on opal from this directory's source, installs it beside its unit, and starts it again.
# Usage: PORT=<the proxied app's port> auth-server/deploy/deploy.sh   (auth-server/README.md)
set -euo pipefail

DOMAIN="auth.anki.smplworks.net"
SSH_HOST="${SSH_HOST:-opal}"
# The "nginx proxied port" app's name in Opalstack's panel.
APP="${APP:-anki_auth}"
PORT="${PORT:?set PORT to the port the panel gave the proxied app}"

here=$(cd "$(dirname "$0")" && pwd)
crate=$(dirname "$here")

unit=$(mktemp)
trap 'rm -f "$unit"' EXIT
sed -e "s|@PORT@|$PORT|g" -e "s|@APP@|$APP|g" "$here/anki-auth.service" > "$unit"

ssh "$SSH_HOST" "mkdir -p ~/apps/$APP/src-build ~/logs/apps/$APP ~/.config/systemd/user"
# The source only; opal has cargo and a C compiler, so the binary is built where it runs.
rsync -a --delete --exclude target --exclude deploy "$crate/" "$SSH_HOST:apps/$APP/src-build/"
scp -q "$unit" "$SSH_HOST:.config/systemd/user/anki-auth.service"
ssh "$SSH_HOST" bash -s -- "$APP" <<'REMOTE'
set -euo pipefail
app=$1
cd ~/apps/$app
# The settings file, made once with a fresh sealing key. The owner adds the Google client to it (OWED.md).
if [ ! -f env ]; then
  umask 077
  printf 'SEAL_KEY=%s\nGOOGLE_CLIENT_ID=\nGOOGLE_CLIENT_SECRET=\nALLOWED_ORIGINS=https://anki.smplworks.net\n' "$(openssl rand -hex 32)" > env
fi
(cd src-build && cargo build --release --locked --quiet)
# Copied beside the running binary and renamed over it, so the unit never starts a half-copied file.
cp src-build/target/release/anki-auth anki-auth.new && mv anki-auth.new anki-auth
systemctl --user daemon-reload
systemctl --user enable --quiet anki-auth
systemctl --user restart anki-auth
sleep 1
systemctl --user --no-pager status anki-auth | head -n 5
REMOTE
echo "Deployed. Check: curl -s https://$DOMAIN/health"
