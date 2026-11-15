#!/usr/bin/env bash
# Every static gate, in one call. Each must pass with zero warnings.
set -euo pipefail
cd "$(dirname "$0")/.."

tsc -b
eslint . --max-warnings 0
session-suppressions check
session-docs check
