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
