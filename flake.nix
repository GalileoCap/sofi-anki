{
  description = "sofi-anki: a flashcard study app, Vite/React, all in the browser";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";

  outputs =
    { nixpkgs, ... }:
    let
      systems = [
        "aarch64-darwin"
        "x86_64-darwin"
        "aarch64-linux"
        "x86_64-linux"
      ];
      forAllSystems = f: nixpkgs.lib.genAttrs systems (system: f nixpkgs.legacyPackages.${system});
    in
    {
      devShells = forAllSystems (pkgs: {
        default = pkgs.mkShell {
          packages = [
            pkgs.nodejs_22
            pkgs.pnpm
            pkgs.ast-grep
            # The session-kit gates run with python3, and macOS ships none.
            pkgs.python3
          ];

          # The session-kit gates in `pnpm check` run from the marketplace clone, which
          # follows the plugin's updates. The plugin's cache path names a version.
          shellHook = ''
            export PATH="$HOME/.claude/plugins/marketplaces/galileo-kit/plugins/session-kit/bin:$PATH"
          '';
        };
      });

      formatter = forAllSystems (pkgs: pkgs.nixfmt);
    };
}
