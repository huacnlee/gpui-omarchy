# JavaScript package

`src/index.js` exports the native components registered by `gpui-omarchy-shell`,
along with pure theme utilities. `src/native.js` is the native-only entry: it
re-exports the catalog from the `gpui-omarchy-native` module the Rust adapter
registers, so an application imports one specifier, `gpui-omarchy`, and gets
both the native components and the helpers around them.
`src/composition.js` contains the composition helpers brought into gpui-omarchy
from Omarchy UI (source revision `abfeec2`, MIT). These are also available as
the `composition` namespace from the default entry.

The repository's root `package.json` exposes the default entry to gpui-shell
Git package consumers, which is the only supported way in: an application
declares `"gpui-omarchy": "huacnlee/gpui-omarchy"` under its `gpui-shell.json`
dependencies and imports the bare specifier. The native exports additionally
require the embedding host to install the Rust adapter; without it the
`gpui-omarchy-native` import fails and the theme utilities still work.

Run `bun test` here for the JS presentation contracts. These use a recording
stub; native rendering and interaction are tested through the Rust shell host
in Longbridge Lite. Generate declarations with `bun run types`.
