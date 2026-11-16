#!/usr/bin/env bash
# Every static gate, in one call. Each must pass with zero warnings.
set -euo pipefail
cd "$(dirname "$0")/.."

tsc -b
eslint . --max-warnings 0
session-codeintel looks .
# The prose and comments written here; shadcn's generated components are not.
git ls-files -z '*.md' 'src/*.ts' 'src/*.tsx' 'auth-server/*.rs' ':!src/components/ui/' | xargs -0 session-tells check
# The token server (A20): its lints at zero warnings and its formatting.
(cd auth-server && cargo clippy --quiet --all-targets --locked -- -D warnings && cargo fmt --check)
session-suppressions check
session-docs check
session-intent check
ast-grep test -c sgconfig.yml --skip-snapshot-tests
ast-grep scan -c sgconfig.yml --error
# The design gate's source rules (lint/design), apart from the layer rules above.
ast-grep test -c lint/design/sgconfig.yml --skip-snapshot-tests
ast-grep scan -c lint/design/sgconfig.yml --error
