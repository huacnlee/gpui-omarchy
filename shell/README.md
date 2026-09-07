# gpui-omarchy-shell

This unpublished adapter lives beside the publishable `gpui-omarchy` crate.
Its `gpui-shell` feature is off by default. Enabling it installs native Omarchy
components in gpui-shell's `gpui-component` catalog slot. The runtime owns
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
The adapter pins the shell revision that introduces
`MaterializeRequest::native_state`, allowing components to reuse existing
editing entities. No sibling gpui-kit checkout is required.

The feature-free `write_javascript(directory)` function copies embedded JS
package sources into an application's resource directory. Call it from
the application's build script; ship the resulting directory with its other
application resources. Longbridge Lite demonstrates this integration.

The default JS entry exports the native catalog:

```js
import { Button } from "./gpui-omarchy/index.js";

new Button("save")
  .label("Save")
  .primary()
  .disabled(false)
  .on_click((_event, cx) => cx.notify());
```

Explicit children replace the label's implicit text content; the label still
supplies the accessible name.

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
or the default entry's `composition` namespace. Exporting the remaining Rust
components, including retained state and compound widgets, is still in progress.

Validation:

```sh
cargo check --manifest-path shell/Cargo.toml --no-default-features
cargo test --manifest-path shell/Cargo.toml --features gpui-shell
cargo package --allow-dirty --no-verify
```
