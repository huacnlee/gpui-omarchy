#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
crate_dir="$(cd "$script_dir/.." && pwd)"
repo_dir="$(cd "$crate_dir/../.." && pwd)"
profile="debug"
cargo_args=(+nightly build --locked --manifest-path "$crate_dir/Cargo.toml" --target wasm32-unknown-unknown)
if [[ "${1:-}" == "--release" ]]; then
  profile="release"
  cargo_args+=(--release)
fi

if [[ "$(wasm-bindgen --version)" != "wasm-bindgen 0.2.121" ]]; then
  echo 'Install the matching CLI: cargo install wasm-bindgen-cli --version 0.2.121 --locked' >&2
  exit 1
fi

cargo "${cargo_args[@]}"
wasm-bindgen "$crate_dir/target/wasm32-unknown-unknown/$profile/gpui_omarchy_gallery_wasm.wasm" \
  --out-dir "$repo_dir/website/public/gallery/wasm" \
  --target web --no-typescript

# The web build downloads icons instead of embedding them. Serve the set from
# gpui-kit-assets itself, so no SVG is copied into this repository.
icons_src="$(cargo metadata --format-version 1 --manifest-path "$crate_dir/Cargo.toml" \
  | python3 -c 'import json,sys,pathlib
meta = json.load(sys.stdin)
for package in meta["packages"]:
    if package["name"] == "gpui-kit-assets":
        print(pathlib.Path(package["manifest_path"]).parent / "assets" / "icons")
        break')"
if [[ ! -d "$icons_src" ]]; then
  echo "Could not locate the gpui-kit-assets icons at: $icons_src" >&2
  exit 1
fi
icons_out="$repo_dir/website/public/gallery/assets/icons"
rm -rf "$icons_out"
mkdir -p "$icons_out"
cp "$icons_src"/*.svg "$icons_out/"
