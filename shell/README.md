# gpui-omarchy-shell

This unpublished adapter lives beside the publishable `gpui-omarchy` crate.
Its `gpui-shell` feature is off by default, so the Git-only shell dependency
stays out of the native crate's release path. Enabling it registers the native
Omarchy catalog under its own module, `gpui-omarchy-native`. The runtime owns
JavaScript handles and callbacks; the existing Rust components own rendering,
focus, activation and disabled behavior.

```toml
[dependencies]
gpui-omarchy-shell = { path = "../gpui-omarchy/shell", features = ["gpui-shell"] }
```

Initialize with `gpui_omarchy_shell::init(cx)` and create the runtime with
`gpui_omarchy_shell::new_runtime(cx)`. Embedding applications must use the same
GPUI checkout and the `[patch.crates-io]` entries in this crate's Cargo.toml.
The native crate's crates.io dependencies are deliberately unchanged.

## Why the shell revision is pinned

The adapter pins the shell revision that introduces
`MaterializeRequest::native_state`. That is the whole of what it needs from the
shell beyond the released surface, and it is not optional: `Input`, `Textarea`,
`NumberInput`, `Calendar`, `Slider` and `OtpInput` render Omarchy components
over the very `InputState`, `TextareaState`, `CalendarState`, `SliderState` and
`OtpState` entities the script created, so the script keeps the value, focus
and subscription methods it already has. Without it those six components would
need adapter-owned opaque state and would lose that API. No sibling gpui-kit
checkout is required.

## How an application takes the dependency

The JavaScript package is loaded the way gpui-shell loads any package: the
application declares it in `gpui-shell.json` and imports the bare specifier.
Nothing is copied into the application's tree, and no build script participates.

```json
{
  "id": "com.example.viewer",
  "entry": "main.js",
  "dependencies": { "gpui-omarchy": "huacnlee/gpui-omarchy" }
}
```

```js
import { Button, style, composition } from "gpui-omarchy";

new Button("save")
  .label("Save")
  .primary()
  .disabled(false)
  .on_click((_event, cx) => cx.notify());
```

Explicit children replace the label's implicit text content; the label still
supplies the accessible name. `js/examples/hello-world` is that arrangement end
to end.

## The two module names

`gpui-omarchy` is the JavaScript package an application depends on and imports.
`gpui-omarchy-native` is the module this adapter registers, and only the
package's own `src/native.js` names it. They must stay distinct: the component
module resolves ahead of application files and Git dependencies, so a catalog
registered as `gpui-omarchy` would hide the package it belongs to instead of
completing it. `COMPONENT_MODULE` is the constant, and `shell/tests/catalog.rs`
holds it to that.

One consequence is open on the shell's side. The runtime resolves this catalog
under `COMPONENT_MODULE`, but the declarations it generates still name the block
`gpui-component`: `typings.rs` writes that specifier literally instead of asking
the registry it was handed. Until that literal becomes
`components.module_specifier()`, an editor cannot type `gpui-omarchy-native`,
and the package's re-export of it has no declarations behind it. Run time is
unaffected. `the_shell_still_declares_the_catalog_under_its_own_default_name`
states the current behavior and fails once the shell is fixed.

Current native exports include Button, Checkbox, Switch, Radio, Toggle, ChoiceItem, ButtonGroup, TabList, Tabs,
Tab, ToggleGroup, FocusScope, Tooltip, Panel, Separator, VerticalSeparator,
Keycap, Badge, EmptyState, Progress, Toast, Table, TableRow, TableHead, TableCell,
DialogBackdrop, DialogPopup, DialogTitle, DialogDescription, SheetSurface,
PopoverSurface, AccordionPanel, Avatar, AvatarImage, Icon, Markdown, Html,
Input, Textarea, NumberInput, Calendar, Slider and OtpInput. InputState,
TextareaState, CalendarState, SliderState and OtpState are re-exported from
gpui-base, with their existing value, focus and subscription methods.

```js
// In View.init():
this.query = InputState.new({ placeholder: "Search" });
this.query.on("change", (_event, cx) => cx.notify());
// In View.render():
return new Input(this.query);
```

Calendar uses its state's selection subscription. Slider supports single and
range values; Slider and OtpInput both expose `disabled(true)`. Their native
pointer, keyboard and state event behavior remains in Rust.

Controlled inputs report values through `on_change`; JavaScript passes the
updated value on the next render. Tab exposes the existing native pointer
activation contract; use TabList for compound keyboard navigation. FocusScope
connects Tab/Shift+Tab to focusable controls.
Tooltip and overlay surfaces are content primitives; their owner supplies
placement and lifecycle. Image paths must be relative application assets.

Compose exclusive choices with typed ChoiceItem children. Values must be
unique; disabled items are skipped by the native keyboard cursor. Arrow keys
move that cursor and Enter/Space commit. JavaScript owns the selected value:

```js
new TabList("interval", this.interval)
  .accessibility_label("Chart interval")
  .children([
    new ChoiceItem("day", "Day"),
    new ChoiceItem("week", "Week"),
  ])
  .on_change((value, cx) => { this.interval = value; cx.notify(); });
```

The older composition helpers are available through `js/src/composition.js`
or the default entry's `composition` namespace.

## What is not exported yet

43 of the crate's 67 public constructors have a native export. This catalog is
therefore not yet a replacement for `omarchy-ui`, and should not be described as
one until the list below is empty and each entry's state and interaction
contract has been exercised from JavaScript:

`accordion`, `accordion_trigger`, `collapsible`, `alert_dialog`, `dialog`,
`dialog_button`, `sheet`, `popover`, `hover_card`, `menu`, `select`,
`combobox`, `date_picker`, `color_picker`, `pagination`, `nav_stack`, `link`,
`tree`, `virtual_list`, `scrollbar`, `resizable`, `resizable_panel`,
`dock_area`.

The compound overlays (`dialog`, `sheet`, `popover`, `hover_card`, `menu`) are
the ones to weigh first: only their content primitives are exported today, so a
script still assembles placement and lifecycle itself.

Validation:

```sh
cargo check --manifest-path shell/Cargo.toml --no-default-features
cargo test --manifest-path shell/Cargo.toml --features gpui-shell
cargo package --allow-dirty --no-verify
```
