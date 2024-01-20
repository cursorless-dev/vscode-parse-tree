{
  description = "A Nix-flake-based development environment for vscode-parse-tree";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";

  outputs = { self, nixpkgs }:
    let
      overlays = [
        (final: prev: rec {
          nodejs = prev.nodejs-18_x;
          yarn = (prev.yarn.override { inherit nodejs; });
        })
      ];
      supportedSystems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
      forEachSupportedSystem = f: nixpkgs.lib.genAttrs supportedSystems (system: f {
        pkgs = import nixpkgs { inherit overlays system; config.allowUnfree = true; };
      });
    in
    {
      devShells = forEachSupportedSystem
        ({ pkgs }: {
          default = pkgs.mkShell
            {
              packages = with pkgs; [ nodejs yarn emscripten python310 vsce ];
              shellHook = ''
                if [ ! -d $(pwd)/.emscripten_cache ]; then
                  cp -R ${pkgs.emscripten}/share/emscripten/cache/ $(pwd)/.emscripten_cache
                  chmod u+rwX -R $(pwd)/.emscripten_cache
                  export EM_CACHE=$(pwd)/.emscripten_cache
                fi
              '';
            };
        });
    };
}
