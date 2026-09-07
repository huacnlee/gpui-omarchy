# Gallery for WebAssembly

This crate compiles the same `examples/gallery/app.rs` used by the desktop
gallery. It depends on the root `gpui-omarchy` library and `gpui-base`; it does
not recreate their controls with HTML.

Install the build tools, then generate the website assets:

```sh
rustup toolchain install nightly --target wasm32-unknown-unknown
cargo install wasm-bindgen-cli --version 0.2.121 --locked
bash examples/gallery-wasm/scripts/build.sh --release
```

The generated module goes into `website/public/gallery/wasm/`. The web entry
uses GPUI's single-threaded browser platform, so the page does not require
cross-origin isolation headers or `SharedArrayBuffer`. The application handle
is retained for the lifetime of the page.

The browser cannot access native system fonts. The included Inter font is
used for this target only; native builds retain `.SystemUIFont`. The font is
distributed under the SIL Open Font License in `fonts/OFL.txt` and comes from
GPUI Kit's web gallery font bundle.
