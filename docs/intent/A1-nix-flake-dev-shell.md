---
id: A1
from: [O5]
source: owner
status: decided 2026-11-15
kind: behaviour
implemented_by: [flake.nix, package.json]
proven_by: [flake.lock]
supersedes: []
---

# A1 The environment is a nix flake, entered with direnv

`nix develop`, or direnv with `use flake`, gives Node 22, pnpm, ast-grep and python3, and puts the session-kit commands on PATH. `packageManager` pins pnpm to the version the flake gives.

## Context

The owner, 2026-11-15: "Use a nix flake + direnv for the environment and installs". The machine's pnpm had moved to 11 under the project and refused to install.

## Consequences

`.envrc` stays untracked, as the owner's global gitignore has it. A pnpm update in nixpkgs needs the `packageManager` pin moved with it.
