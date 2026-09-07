# JavaScript package

`src/index.js` exports the native components registered by `gpui-omarchy-shell`,
along with pure theme utilities. `src/native.js` is the native-only entry.
`src/composition.js` contains the composition helpers brought into gpui-omarchy
from Omarchy UI (source revision `abfeec2`, MIT). These are also available as
the `composition` namespace from the default entry.

The repository's root `package.json` exposes the default entry to
gpui-shell Git package consumers. Native exports also require the embedding
host to install the Rust adapter. Applications built alongside this repository
can bundle these sources with `gpui_omarchy_shell::write_javascript` instead
of fetching a second repository at runtime.

Run `bun test` here for the JS presentation contracts. These use a recording
stub; native rendering and interaction are tested through the Rust shell host
in Longbridge Lite. Generate declarations with `bun run types`.
