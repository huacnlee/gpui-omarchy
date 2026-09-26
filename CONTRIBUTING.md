# Contributing

gpui-omarchy follows the conventions of [GPUI Kit](https://github.com/longbridge/gpui-kit)
for code and pull requests. This guide restates the pull request rules and adds
the ones specific to an Omarchy component library.

## AI-assisted contributions

Contributions written with AI are welcome, including pull requests where all of
the code was generated. What matters is whether the change is necessary,
focused and validated; the contributor is responsible for the result.

Before opening a pull request, make sure that:

- the problem is real and the change is needed;
- the API follows the existing patterns of this crate, gpui-base and GPUI Kit;
- the visual and interaction design follows Omarchy (see [Design sources](#design-sources));
- you have reviewed the code and run the tests and the gallery;
- the pull request does one thing and keeps the diff as small as practical.
  Ask an AI assistant to avoid unrelated refactors, cleanup and formatting.

## Pull requests

### Title

Match the titles already in the repository: `<area>: <what changes>`, where the
area is the component or module the change is about (`chart`, `button`,
`theme`, `menu`, `gallery`, `website`, `docs`), or `fix` for a bug fix. Start
the summary with a lowercase imperative verb. Do not reach for conventional
prefixes such as `feat:` by habit.

```text
chart: add Omarchy charts built on gpui-base plot
fix: keep keycap height independent of inherited line height
website: fix icons not rendering in the web gallery
```

### Description

Write the description so a reviewer can judge the change without reading the
diff. Use these sections, in this order, and leave out the ones that do not
apply:

1. **Summary** — what changes and why, in a few sentences. Name the problem
   before the solution.
2. **Design** — for visual or interaction changes: the decisions made and the
   Omarchy source each one follows (a shell file, a theme role, the design
   guide), plus what was deliberately left out and why.
3. **Public API** — every public item the pull request adds, changes or removes:
   types, functions, builder methods, fields, re-exports and macros. Give the
   signature as a reader would see it in the docs and one line on what it is
   for; a name alone is not enough. Additive changes are listed too. Write
   `None.` when the public API does not change.
4. **Breaking Changes** — every change to an existing public item, with a
   `diff` block showing the old and the new usage, even when the old form still
   compiles (a deprecated alias) or the break is only for struct literals.
   Behavior changes that existing callers will notice go here as well.
5. **Dependencies** — any change to dependency versions or sources. A dependency
   on an unreleased gpui-kit branch or a `[patch]` section must say which pull
   request it waits for, and that the crate must not be published until the
   patch is replaced by a released version.
6. **Test plan** — a checklist of what was run, with the real results (test
   counts, commands). Leave an item unchecked when it was not verified; never
   check a box for something that was only expected to pass.
7. **AI assistance** — say which parts were written with AI, for example with a
   `🤖 Generated with …` line at the end.

### UI changes

Attach screenshots or recordings of the changed components in the gallery, in
a dark and a light theme. For motion, a short recording is more useful than a
screenshot. Say which theme and zoom level were used.

### Public API rules

These restate the GPUI Kit coding guides that matter most for review:

- Constructors return composable gpui-base elements; keep base builder APIs
  available instead of wrapping them.
- Applications own values: pass the current value on every render and update it
  from the callback. Controls keep no competing copy of application state.
- Public structs handed to callers keep private fields with builders and
  readers. A struct that is deliberately record-like may have public fields but
  must be `#[non_exhaustive]`, except `Theme`, whose roles are meant to be set
  directly.
- Boolean readers are `is_…` or `has_…`; non-boolean setters that collide with
  a reader are `with_…`.
- Changing a public constructor's signature is a breaking change; prefer an
  internal element that samples what it needs at render time.

## Design sources

Visual and interaction decisions follow Omarchy itself, not generic UI
conventions. Cite the source in the pull request:

- the shell components in `/usr/share/omarchy/shell` (for example
  `Ui/Button.qml` for button states and timing), naming the Omarchy version;
- the theme roles in `colors.toml` and how this crate derives the missing ones
  (`src/system_theme.rs`);
- [docs/design.md](docs/design.md) for decisions already made in this crate.

When the shell has no equivalent for a component, say so and label the
measurement as this crate's own choice.

## Development

```bash
cargo test --lib                 # library tests
cargo test --example gallery     # gallery tests
cargo clippy --all-targets
cargo fmt --check
cargo run --example gallery -- <page>   # e.g. line_chart, switch
```

The web gallery in `examples/gallery-wasm` builds with nightly Rust:

```bash
cd examples/gallery-wasm
cargo +nightly check --target wasm32-unknown-unknown
```
