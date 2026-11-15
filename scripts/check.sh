#!/usr/bin/env bash
# Every static gate, in one call. Each must pass with zero warnings.
set -euo pipefail
cd "$(dirname "$0")/.."

tsc -b
eslint . --max-warnings 0
session-suppressions check
session-docs check
session-intent check
ast-grep test -c sgconfig.yml --skip-snapshot-tests
ast-grep scan -c sgconfig.yml --error
