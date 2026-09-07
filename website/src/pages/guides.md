---
layout: ../layouts/Guides.astro
title: Guides
description: Build an Omarchy application with GPUI. Learn composition, themes, forms, navigation, overlays and data views, with API details alongside each task.
---

# Guides

Build an Omarchy application from a first window to forms, menus and a docked workspace. These guides share one page so you can read through, jump to a chapter, or search for a component with your browser's Find command.

The examples target **gpui-omarchy 0.1.0** with **GPUI Kit 0.6.0**. They cover the public API defined by gpui-omarchy, including its modules, constructors, wrapper methods, state types and theme fields. [GPUI Kit](https://gpui-kit.com/) supplies the underlying framework and base builder APIs; their entire dependency APIs are not duplicated here.

## Start an application

Add the library to a Rust 2024 application:

```toml
[dependencies]
gpui-kit = { version = "=0.6.0", default-features = false }
gpui-omarchy = "0.1.0"
```

Use `gpui_kit` directly for framework types and `gpui_kit::application()` for the desktop entry point. `gpui_kit::base` provides the underlying state and composition APIs. Disabling default features leaves the GPUI Kit component facade out, so gpui-omarchy supplies the Omarchy presentation. Call `gpui_omarchy::init(cx)` to initialize base behavior and the Omarchy theme.

Save this complete example as `src/main.rs`, then run `cargo run`. Install your platform's GPUI build dependencies first.

```rust
use gpui_kit::{
    AppContext, Context, IntoElement, ParentElement, Render, Styled, Window, WindowOptions,
};
use gpui_omarchy::{ActiveTheme, ButtonVariant, button, focus_scope, panel};

struct Hello {
    clicks: usize,
}

impl Render for Hello {
    fn render(&mut self, _: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        focus_scope("hello")
            .size_full()
            .bg(cx.omarchy().background)
            .child(
                panel("Welcome to Omarchy", cx).child(
                    button(
                        "hello",
                        format!("Clicked {} times", self.clicks),
                        ButtonVariant::Primary,
                        cx,
                    )
                    .on_click(cx.listener(|this, _, _, cx| {
                        this.clicks += 1;
                        cx.notify();
                    })),
                ),
            )
    }
}

fn main() {
    gpui_kit::application().run(|cx| {
        gpui_omarchy::init(cx);
        cx.open_window(WindowOptions::default(), |_, cx| {
            cx.new(|_| Hello { clicks: 0 })
        })
        .expect("open window");
        cx.activate(true);
    });
}
```

Call `init(cx: &mut gpui_kit::App)` once before creating components. It initializes gpui-base, installs the focus, option-group, popover and date-picker keybindings, and starts following the system theme. Reading `cx.omarchy()` before initialization has no installed theme to read.

Use base state and composition types through `gpui_kit::base`, for example `gpui_kit::base::input::InputState`. No separate gpui-base dependency is needed. GPUI Kit also exposes bundled assets through `gpui_kit::assets` when its `assets` feature is enabled.

Except for the complete applications explicitly labeled below, Rust examples are fragments for a view's constructor or `Render::render`, as indicated. They assume the same framework imports, plus `gpui_omarchy::*` and `gpui_kit::prelude::*`. Fields such as `self.name` are entities retained by the application, not recreated on every render. Do not also import `gpui_kit::*`: names such as `MenuItem` would become ambiguous. Import base state from `gpui_kit::base`; keep Omarchy constructors under `gpui_omarchy`.

## Compose a view and manage state

Build components inside `Render`. Their appearance is taken from the current theme on that render, so the next render picks up theme changes. Most functions return a gpui-base element; use its normal `.child(...)`, `.children(...)`, layout, event and style builders.

```rust
// Inside Render::render.
panel("Workspace", cx)
    .child(badge("Connected", Status::Success, cx))
    .child(separator(cx))
    .child(button("save", "Save", ButtonVariant::Primary, cx))
```

There are two common ways to hold state:

- **Values owned by your view:** checkbox, switch, radio, toggle, tab and expandable-region values are passed on each render. Their callbacks must update your value and call `cx.notify()`.
- **Entities owned by your view:** inputs, choices, dates, sliders, trees and navigation retain editing or interaction state across renders. Create each `Entity<T>` once with `cx.new(...)`. Observe it when the parent needs to redraw, and subscribe to its events when your application needs a semantic action.

For example, in your view constructor:

```rust
let name = cx.new(|cx| {
    gpui_kit::base::input::InputState::new(window, cx).placeholder("Workspace name")
});
cx.observe(&name, |_, _, cx| cx.notify()).detach();
// Store name in your view; render input("name", &self.name, window, cx).
```

Retain a subscription in your view or deliberately `.detach()` it so it remains registered for the entity's lifetime. Recreating state during rendering resets editing and selection. A constructor reading a value does not make that value persistent for you.

Use stable component IDs, unique within the same parent. For repeated rows use tuples such as `("row", index)`. Constructors generally accept `id: impl Into<ElementId>` and labels as `impl Into<SharedString>`; owned strings work for dynamic labels.

### Enable keyboard traversal

Wrap the window or form in `focus_scope(id) -> Stateful<Div>`. It enables Tab and Shift+Tab traversal while preserving text-field and popup keyboard contexts. A focus scope does not create your layout; add normal GPUI layout builders.

The public unit actions `gpui_omarchy::focus::Next` and `gpui_omarchy::focus::Previous` move focus forward and backward. `init` binds them to Tab and Shift+Tab in the `OmarchyFocusScope` context. You can dispatch them with `window.dispatch_action(Box::new(gpui_omarchy::focus::Next), cx)` or register additional GPUI keybindings for either action. They are available through the `focus` module, not re-exported at the crate root. The scope also handles copying selected rich text with the platform's copy shortcut, letting an editor handle it when no rich-text selection is active.

Keep stable `FocusHandle`s for modal content and the trigger that opens it. Focus the modal handle when opening, and restore the trigger on closing. Icon-only actions need an accessible name even when they have a tooltip.

### Run a complete stateful form

This is a second **complete desktop application**. Use the two dependencies from the setup chapter and replace `src/main.rs` with the code below. It shows all fields, imports and initialization for an input, a controlled switch, a choice entity and a save callback. Saving updates the on-screen message in memory; no files are written.

```rust
use gpui_kit::{
    AppContext, Context, Entity, IntoElement, ParentElement, Render,
    SharedString, Styled, Window, WindowOptions,
};
use gpui_omarchy::{
    ActiveTheme, ButtonVariant, ChoiceItem, ChoiceState,
    button, focus_scope, input, panel, select, switch,
};
use gpui_kit::base::input::InputState;

struct Settings {
    name: Entity<InputState>,
    workspace: Entity<ChoiceState>,
    notifications: bool,
    saved: SharedString,
}

impl Settings {
    fn new(window: &mut Window, cx: &mut Context<Self>) -> Self {
        let name = cx.new(|cx| InputState::new(window, cx).default_value("My workspace"));
        let workspace = cx.new(|cx| {
            ChoiceState::new(
                vec![ChoiceItem::new("personal", "Personal"), ChoiceItem::new("team", "Team")],
                window,
                cx,
            )
            .label("Workspace type")
            .default_selected(0)
        });
        cx.observe(&name, |_, _, cx| cx.notify()).detach();
        cx.observe(&workspace, |_, _, cx| cx.notify()).detach();
        Self { name, workspace, notifications: false, saved: "No changes saved".into() }
    }
}

impl Render for Settings {
    fn render(&mut self, window: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        let changed = cx.listener(|this, enabled: &bool, _, cx| {
            this.notifications = *enabled;
            cx.notify();
        });
        focus_scope("settings")
            .size_full()
            .bg(cx.omarchy().background)
            .child(panel("Workspace settings", cx)
                .child("Name")
                .child(input("name", &self.name, window, cx))
                .child("Workspace type")
                .child(select("workspace", &self.workspace, window, cx))
                .child(switch("notifications", "Notifications", self.notifications, cx)
                    .on_change(move |enabled, _, window, cx| changed(&enabled, window, cx)))
                .child(button("save", "Save", ButtonVariant::Primary, cx)
                    .on_click(cx.listener(|this, _, _, cx| {
                        let kind = this.workspace.read(cx).selected()
                            .map(|item| item.value.clone()).unwrap_or_else(|| "none".into());
                        this.saved = format!("Saved {} ({kind})", this.name.read(cx).value()).into();
                        cx.notify();
                    })))
                .child(self.saved.clone()))
    }
}

fn main() {
    gpui_kit::application().run(|cx| {
        gpui_omarchy::init(cx);
        cx.open_window(WindowOptions::default(), |window, cx| cx.new(|cx| Settings::new(window, cx)))
            .expect("open settings window");
        cx.activate(true);
    });
}
```

The parent retains editing state and observes it for redraws. The switch callback receives a value and updates a field; the select updates its own entity. The save callback reads both entities through the application context. These are the same patterns used by the fragments in the following chapters.

## Follow and customize the theme

Most applications can let `init` follow the desktop theme. On native targets, gpui-omarchy reads:

```text
$HOME/.local/state/omarchy/current/theme/colors.toml
$HOME/.local/state/omarchy/current/theme.name
```

It checks for changes once per second off the UI thread, including replaced theme symlinks. The legacy `$HOME/.config/omarchy/current` location is used only when the current state directory is absent. An existing but invalid current theme falls back to Tokyo Night rather than reviving a stale legacy theme.

For an application theme switcher, apply a palette explicitly:

```rust
// After gpui_omarchy::init(cx).
Theme::flexoki_light().apply(cx);
// Later, resume following the desktop:
Theme::follow_system(cx);
```

`apply(self, cx: &mut App)` consumes the palette, stops the system watcher, updates both Omarchy and base tokens, and refreshes all windows. It also installs square radius tokens and the library's typography scale. Change a cloned palette, then apply the whole theme, so the two token sets stay in sync.

```rust
let mut theme = cx.omarchy().clone();
theme.font = ".SystemUIFont".into();
theme.apply(cx);
```

Import `ActiveTheme` to use `omarchy(&self) -> &Theme` on `App` and through contexts that dereference to it. The `Theme` type implements GPUI `Global` and supports `Clone`, `Debug` and `PartialEq`.

### Load an explicit palette

| API | When to use it |
| --- | --- |
| `Theme::tokyo_night() -> Theme` | Construct the default dark palette without applying it. |
| `Theme::flexoki_light() -> Theme` | Construct the built-in warm light palette. |
| `Theme::system_or_default() -> Theme` | Read a one-time system snapshot, with atomic Tokyo Night fallback. This does not start watching. |
| `Theme::follow_system(&mut App)` | Apply the system palette and follow later changes. In browsers, apply Tokyo Night without filesystem monitoring. |
| `Theme::from_current_dir(path: impl AsRef<Path>) -> Result<Theme, ThemeLoadError>` | Read `theme/colors.toml` under a supplied current directory, with optional `theme.name`. |
| `Theme::from_colors_toml(name: &str, contents: &str) -> Result<Theme, ThemeLoadError>` | Parse palette text already loaded by your application. |

The parser accepts ANSI `color0..15` and semantic Omarchy colors. Required keys are `background`, `foreground`, `accent`, and the status colors `red`/`color1`, `yellow`/`color3`, `green`/`color2`. Optional surfaces derive from that same palette. Color strings use `#RRGGBB`. `mode`, when provided, must be `dark` or `light`; otherwise appearance is inferred from background and foreground luminance. Explicit loading returns `ThemeLoadError` on malformed or incomplete palettes; it does not silently apply a partial theme. The error implements `Debug`, `Display` and `std::error::Error`, with a private message accessible through `to_string()`.

`shell.toml` size and state overrides are not implemented. The library's default font is `.SystemUIFont`; a browser application needs its own available fonts and bootstrap, as in the WASM gallery.

### Choose colors by their purpose

All these `Theme` fields are public:

| Fields | Type and role |
| --- | --- |
| `name`, `font` | `SharedString`: display name and application font family. |
| `appearance` | `gpui_kit::base::ThemeAppearance`: light or dark. |
| `background`, `surface`, `inset` | `Hsla`: main canvas, raised content and inset surface. |
| `foreground`, `secondary`, `bright` | `Hsla`: normal, secondary and emphasized text. |
| `accent`, `on_accent` | `Hsla`: accent and its contrasting foreground. |
| `selection`, `border` | `Hsla`: palette selection and general surface edges. |
| `danger`, `warning`, `success` | `Hsla`: semantic status colors. |

For custom controls, use the theme's control-state helpers instead of treating the palette's `selection` as every selected fill:

| Method on `&Theme` | Return value |
| --- | --- |
| `normal_fill()` | `Hsla`, foreground at 4% opacity. |
| `hover_fill()` | `Hsla`, foreground at 8%. |
| `selected_fill()` | `Hsla`, foreground at 18%. |
| `pressed_fill()` | `Hsla`, foreground at 22%. |
| `control_border()` | `Hsla`, foreground at 40%. |
| `focus_border()` | `Hsla`, foreground at 25%. |
| `divider()` | `Hsla`, foreground at 12%. |
| `input_style()` | `gpui_kit::base::input::InputEditorStyle`, including editor selection at 35% foreground opacity. |
| `tokens()` | `gpui_kit::base::ColorTokens`, the palette mapping used when applying the theme. |

## Add actions and links

Use `button(id, label, variant, cx) -> Button` for application commands. `ButtonVariant` offers `Primary`, `Outline`, `Secondary` (the default) and `Danger`. Native primary actions emphasize the label and outline; they are not the website's filled primary buttons. `Outline` has a visible idle edge, while `Secondary` is quiet at rest.

```rust
button("save", "Save changes", ButtonVariant::Primary, cx)
    .disabled(self.saving)
    .on_click(cx.listener(|this, _, _, cx| {
        this.saving = true;
        cx.notify();
    }))
```

`Button` is an Omarchy wrapper over base activation and focus behavior. Its final disabled state suppresses hover, active and focus-visible refinements, whether `.disabled(true)` comes before or after them. Ordinary styling and selected/disabled styles remain composable.

### Refine a button

| `Button` method | Use |
| --- | --- |
| `new(id)` | Construct a raw wrapper without the themed constructor's label or styling. |
| `disabled(bool)`, `selected(bool)` | Set disabled interaction or persistent selection. Both return `Self`. |
| `styles(FnOnce(ButtonStyles) -> ButtonStyles)` | Configure base selected and disabled style slots. `ButtonStyles` comes from gpui-base. |
| `accessibility_label(label)` | Set an explicit accessible name. |
| `role(impl Into<gpui_kit::base::RoleOverride>)` | Override the base accessibility role. |
| `track_focus(&FocusHandle)` | Associate a stable focus handle. |
| `tab_index(isize)`, `tab_stop(bool)`, `focusable(bool)` | Refine tab order and focus participation. |
| `on_click(Fn(&ClickEvent, &mut Window, &mut App) + 'static)` | Handle activation; use `cx.listener` to update your view. |

It implements `Styled`, `ParentElement`, `InteractiveElement`, `StatefulInteractiveElement`, `RenderOnce`, `IntoElement` and `gpui_kit::base::Selectable`. Import the appropriate traits for `.child`, `.hover`, `.focus_visible`, `.active` and layout builders. `Selectable::is_selected(&self) -> bool` reads the selected state.

### Open a destination

Use `link(id, label, href, cx) -> Link` when activation navigates to a URL:

```rust
link("project", "Project source", "https://github.com/huacnlee/gpui-omarchy", cx)
```

The constructor installs an opener using `cx.open_url`. The `Link` wrapper suppresses transient disabled styles just like `Button`.

| `Link` method | Use |
| --- | --- |
| `new(id)` | Raw wrapper; supply your own content, URL and opener. |
| `href(impl Into<SharedString>)` | Set the destination. |
| `open_with(Fn(&str, &ClickEvent, &mut Window, &mut App) + 'static)` | Replace URL opening, for example with an application router. |
| `on_activate(Fn(&ClickEvent, &mut Window, &mut App) + 'static)` | Handle link activation. |
| `disabled(bool)` | Disable activation and transient styling. |
| `styles(FnOnce(LinkStyles) -> LinkStyles)` | Configure base style slots. `LinkStyles` comes from gpui-base. |
| `accessibility_label(label)`, `tab_index(isize)`, `tab_stop(bool)` | Name and configure keyboard participation. |

These builders return `Self`. `Link` supports the same GPUI styling, children, interaction and rendering traits as `Button`, but does not expose `Selectable` or the button-only inherent methods.

### Name icon actions

```rust
with_tooltip(
    button("settings", "", ButtonVariant::Secondary, cx)
        .accessibility_label("Open settings")
        .child(icon(IconName::Settings)),
    "Open settings",
)
```

`icon(name: IconName) -> icon::Icon` returns a 16px, non-shrinking icon; use `Styled` to change size or text color. `Icon` implements `RenderOnce` and `IntoElement`. Icons inherit text color at render time and embed their assets, so you do not need to replace your application's `AssetSource`.

`IconName` has these variants: `Check`, `Minus`, `Plus`, `ChevronDown`, `ChevronRight`, `ChevronLeft`, `Calendar`, `Star`, `ExternalLink`, `Close`, `Search`, `Menu`, `Settings` and `TriangleAlert`. `IconName::path(self) -> &'static str` returns the bundled `icons/*.svg` asset key, not a URL to fetch. `IconName` is re-exported at the crate root; the concrete icon type is `gpui_omarchy::icon::Icon`.

## Build forms

Choose a control by the value the user edits. Keep labels visible and put validation feedback next to the field. Input editing, selection, clipboard and IME behavior come from gpui-base.

### Edit text and numbers

Create states once in your view constructor:

```rust
let name = cx.new(|cx| {
    gpui_kit::base::input::InputState::new(window, cx).placeholder("Workspace name")
});
let notes = cx.new(|cx| {
    gpui_kit::base::input::TextareaState::new(window, cx)
        .rows(4)
        .placeholder("Add notes")
});
let copies = cx.new(|cx| {
    gpui_kit::base::input::InputState::new(window, cx).default_value("1")
});
```

Store them in your view, then compose a form during rendering:

```rust
panel("Workspace settings", cx)
    .child("Name")
    .child(input("name", &self.name, window, cx))
    .child("Notes")
    .child(textarea("notes", &self.notes, window, cx))
    .child("Copies")
    .child(number_input(&self.copies, cx))
```

| Constructor | State, context and result |
| --- | --- |
| `input(id, &state, window, cx)` | `Entity<gpui_kit::base::input::InputState>`, `&Window`, `&mut App`; returns `gpui_kit::base::InputBase`. |
| `textarea(id, &state, window, cx)` | `Entity<gpui_kit::base::input::TextareaState>`, `&Window`, `&mut App`; returns `gpui_kit::base::InputBase`. |
| `number_input(&state, cx)` | `Entity<InputState>`, `&mut App`; returns `gpui_kit::base::NumberInput`. |

The returned `InputBase` is the styled frame containing the editor. Configure values, placeholders and editor behavior on the state. Constructors refresh the state's editor style and focus styling. Number input centers the text and adds decrement/increment controls with base arrow-key stepping; configure numeric constraints through the base number-input API. Input validation and saving remain application responsibilities.

### Toggle values

`checkbox(id, label, state, cx)` takes `gpui_kit::base::CheckboxState::{Unchecked, Checked, Indeterminate}` and returns `gpui_kit::base::Checkbox`. `switch(id, label, checked, cx)` and `radio(id, label, checked, cx)` take `bool` and return base `Switch` and `Radio`. `toggle(id, label, pressed, cx)` takes `bool` and returns base `Toggle`. All four take `cx: &App`.

A base `on_change` receives `(next_value, &ClickEvent, &mut Window, &mut App)`. Bridge that value into a view listener:

```rust
let changed = cx.listener(|this, checked: &bool, _, cx| {
    this.notifications = *checked;
    cx.notify();
});
switch("notifications", "Notifications", self.notifications, cx)
    .on_change(move |checked, _, window, cx| changed(&checked, window, cx))
```

Pass the current value into the constructor again on each render. Do not override `.checked`, `.state` or `.pressed` afterward: the indicator was composed from the constructor's value and can become visually inconsistent. Disabled state uses the returned base control's `.disabled(true)`.

A `radio` does not coordinate its siblings for you. Use the next chapter's `button_group` for an exclusive setting. For independent filters, compose toggles in `toggle_group(id, cx) -> gpui_kit::base::ToggleGroup`:

```rust
toggle_group("filters", cx)
    .child(toggle("unread", "Unread", self.unread, cx))
    .child(toggle("starred", "Starred", self.starred, cx))
// Attach an on_change callback to each child to update its own value.
```

Each toggle keeps its own tab stop and value. Icons are explicit children, not inferred from the label.

### Enter a verification code

Create `cx.new(|cx| gpui_kit::base::OtpState::new(6, window, cx))` once, then render:

```rust
otp_input(&self.code, window, cx).disabled(self.submitting)
```

`otp_input(&Entity<gpui_kit::base::OtpState>, &Window, &App) -> OtpInput` supplies the code slots and clipboard behavior. `OtpInput::disabled(self, bool) -> Self` disables interaction. The wrapper implements `Styled`, `ParentElement`, `RenderOnce` and `IntoElement` for layout, children and rendering; it does not expose all base OTP builders.

Paste replaces the code, filters non-digits, normalizes full-width digits and truncates to the configured length. Disabled controls ignore edits and paste. Observe the base state for code changes; your application decides when to submit and how to report a rejected code.

## Choose options and switch pages

Use an inline group for a few visible choices, a Select for a longer list, or a Combobox when users need to search the list. Choices have stable values independent of their display labels.

### Hold a selected option

Create a separate `ChoiceState` entity for each Select or Combobox in your view constructor:

```rust
let workspace = cx.new(|cx| {
    ChoiceState::new(
        vec![
            ChoiceItem::new("personal", "Personal workspace"),
            ChoiceItem::new("team", "Team workspace"),
            ChoiceItem::new("archive", "Archived workspace").disabled(true),
        ],
        window,
        cx,
    )
    .label("Default workspace")
    .placeholder("Choose a workspace…")
    .default_selected(0)
});
cx.observe(&workspace, |_, _, cx| cx.notify()).detach();
```

During rendering use `select("workspace", &self.workspace, window, cx)` or `combobox("workspace-search", &self.workspace, window, cx)`. Both accept `&Entity<ChoiceState>`, `&mut Window` and `&mut App`; they return base `Select` and `Combobox` respectively. Use one constructor per entity/control: their internal search and focus state is not intended to be shared by two simultaneous controls.

Read the result using `self.workspace.read(cx).selected()`, which returns `Option<&ChoiceItem>`. Persist the item's `value`, rather than its label or position. Combobox performs case-insensitive substring searches of option labels; it selects existing options and does not create a free-text value.

Arrow Up/Down and Home/End navigate options. Enter confirms; Escape dismisses and returns focus. Disabled options are skipped. The searchable popup owns its text input so editing keys do not activate unrelated controls.

| Public choice API | Behavior |
| --- | --- |
| `ChoiceItem::new(value, label)` | Both arguments convert into `SharedString`; the item starts enabled. |
| `ChoiceItem::disabled(self, bool) -> Self` | Configure availability. |
| `ChoiceItem::{value, label, disabled}` | Public fields of types `SharedString`, `SharedString`, `bool`; items support `Clone` and `Debug`. |
| `ChoiceState::new(Vec<ChoiceItem>, &mut Window, &mut Context<Self>) -> Self` | Create choice and search state with no selected item. |
| `ChoiceState::label(self, label) -> Self` | Accessible control name. |
| `ChoiceState::placeholder(self, label) -> Self` | Text shown before selection. |
| `ChoiceState::disabled(self, bool) -> Self` | Disable the control at state construction. |
| `ChoiceState::default_selected(self, usize) -> Self` | Set an initial index; invalid or disabled entries leave no selection. |
| `ChoiceState::selected(&self) -> Option<&ChoiceItem>` | Read the committed option. |
| `ChoiceState::is_open(&self) -> bool` | Read whether its popup is open. |
| `ChoiceState::set_selected(&mut self, Option<usize>, &mut Context<Self>)` | Update inside `Entity::update` and notify observers. `None`, out-of-range and disabled indexes clear selection. |

### Show an exclusive setting or a tab list

Both constructors take `(id, items: Vec<ChoiceItem>, selected: Option<usize>, on_change, window: &mut Window, cx: &mut App)`:

- `button_group(...) -> gpui_kit::base::RadioGroup` represents one exclusive setting.
- `tab_list(...) -> gpui_kit::base::Tabs` represents page navigation; render the corresponding content yourself.

Their `on_change` callback is `Fn(usize, &mut Window, &mut App) + 'static`. Keep the selected index in your view:

```rust
let changed = cx.listener(|this, index: &usize, _, cx| {
    this.page = *index;
    cx.notify();
});
tab_list(
    "workspace-pages",
    vec![ChoiceItem::new("files", "Files"), ChoiceItem::new("activity", "Activity")],
    Some(self.page),
    move |index, window, cx| changed(&index, window, cx),
    window,
    cx,
)
```

Each group has one Tab stop. Left/Right or h/l moves the keyboard cursor; Enter or Space commits. Moving the cursor alone does not switch the selected value. Disabled choices are skipped, and activating the current selection does not emit a change.

For custom compositions, use `tabs(id, cx) -> gpui_kit::base::Tabs` and `tab(id, label, selected: bool, cx) -> gpui_kit::base::Tab`. Both take `&App`. You own selected state, callbacks and composition; the low-level pair does not add `tab_list`'s option-group cursor handling.

## Edit dates, ranges and colors

These controls keep richer state in an entity. Observe that state to redraw dependent labels or previews. Subscribe to its base events when you need to distinguish editing from committing.

### Pick a date

For an always-visible calendar, create a base state once:

```rust
let calendar = cx.new(|cx| gpui_kit::base::CalendarState::new(window, cx));
```

Render `calendar("schedule", &self.calendar, cx) -> gpui_kit::base::Calendar`; it takes `&Entity<gpui_kit::base::CalendarState>` and `&App`. Base state configures single-date or range selection, month/year navigation and disabled-date matchers.

For a compact trigger and popup, create `cx.new(|cx| DatePickerState::new(window, cx))`, then render `date_picker("due-date", &self.due_date, cx) -> gpui_kit::base::DatePicker`.

`DatePickerState::new(&mut Window, &mut Context<Self>) -> Self` installs the calendar subscription and owns popup focus. Its public `calendar: Entity<gpui_kit::base::CalendarState>` is where you configure date rules and observe `CalendarEvent::Selected`. `is_open(&self) -> bool` reads popup visibility; there is no public open-state setter.

A completed selection closes the popup and returns focus to the trigger. A range remains open until the selection is complete. Escape and outside dismissal close it; implement your own draft/commit model if you need rollback of calendar edits. The returned picker supports the base `.disabled(true)` builder.

### Adjust a numeric value or range

Create a single-value slider or range slider in your constructor:

```rust
let volume = cx.new(|_| gpui_kit::base::slider::SliderState::new().step(5.).default_value(40.));
let interval = cx.new(|_| {
    gpui_kit::base::slider::SliderState::new().step(5.).default_value((20., 80.))
});
```

`slider(&Entity<gpui_kit::base::slider::SliderState>, disabled: bool, &mut Window, &mut App) -> gpui_kit::base::Slider` renders a horizontal slider. Set the disabled flag in the constructor so both track and thumbs are inert; reserve returned builders for layout and styling.

Arrow keys and h/l step the focused thumb. Home/End moves it to its allowed endpoint, and range thumbs cannot cross. Keyboard changes emit base `SliderEvent::Change` and `SliderEvent::Release`; pointer interaction comes from the base track/thumb components. Use `SliderValue::Single` or `SliderValue::Range` when consuming state.

### Choose a color

In your constructor, create `cx.new(|cx| gpui_kit::base::ColorPickerState::new(window, cx))`, optionally with `.default_value(color)`. During rendering:

```rust
color_picker("accent", &self.color, window, cx)
```

`color_picker(id, &Entity<gpui_kit::base::ColorPickerState>, &mut Window, &mut App) -> gpui_kit::base::ColorPicker` composes a trigger, Hex editor and HSLA sliders. Hex supports 3, 4, 6 or 8 digits with an optional `#`. Invalid text shows an error and disables Apply color. Enter or Apply commits valid Hex input; Escape or outside dismissal discards its uncommitted preview. Slider adjustments apply immediately.

Observe the state or subscribe to `gpui_kit::base::ColorPickerEvent` to update an application preview. Your application decides whether picking a color should also apply a new `Theme`.

## Organize navigation

Choose between expanding content in place, requesting another data page, and navigating between retained views. These are separate state models.

### Expand a section

`accordion(id, cx) -> gpui_kit::base::Accordion` supplies the outer surface. Compose base `AccordionItem` and `AccordionHeader` slots with `accordion_trigger(id, label, open: bool, cx) -> gpui_kit::base::AccordionTrigger` and `accordion_panel(cx) -> gpui_kit::base::AccordionPanel`. All constructors take `&App`.

```rust
let changed = cx.listener(|this, open: &bool, _, cx| {
    this.expanded = *open;
    cx.notify();
});
accordion("settings", cx).child(
    gpui_kit::base::AccordionItem::new()
        .open(self.expanded)
        .header(gpui_kit::base::AccordionHeader::new(
            accordion_trigger("advanced", "Advanced settings", self.expanded, cx)
                .on_change(move |open, _, window, cx| changed(&open, window, cx)),
        ))
        .panel(accordion_panel(cx).child("Advanced settings appear here.")),
)
```

The item's `open` state and the trigger's indicator must agree. Keep one value per section, or close peers in your callback if your application requires an exclusive accordion.

For a simpler disclosure, `collapsible(open: bool, cx: &App) -> gpui_kit::base::Collapsible` keeps ordinary children visible and conditionally renders its `.content(...)` slot. Supply your own trigger and update the `open` value.

### Request another data page

`pagination(id, state: gpui_kit::base::PaginationState, cx: &App) -> gpui_kit::base::Pagination` builds page buttons and ellipses. Pass the current page and page count into base state, then handle requested pages:

```rust
let changed = cx.listener(|this, page: &usize, _, cx| {
    this.current_page = *page;
    cx.notify();
});
let state = gpui_kit::base::PaginationState::new(self.current_page, 12)
    .on_change(move |page, window, cx| changed(&page, window, cx));
pagination("pages", state, cx)
```

Page numbers are one-based. The constructor requests a page through state; fetching, sorting and displaying that page's records belong to your application.

### Navigate between retained views

Create `cx.new(|_| gpui_kit::base::NavStackState::new())` once. It starts empty: push an initial page entity before rendering. For example, in your constructor, with `first_page: Entity<P>` already created and `P: Render`:

```rust
let navigation = cx.new(|_| gpui_kit::base::NavStackState::new());
navigation.update(cx, |state, cx| {
    state.push(first_page.clone(), gpui_kit::base::NavMotion::Immediate, cx);
});
```

Store `navigation` on your view, then render `nav_stack(&self.navigation, cx) -> gpui_kit::base::NavStack` with `&Entity<gpui_kit::base::NavStackState>` and `&App`. In callbacks, call `state.push(next_page, gpui_kit::base::NavMotion::Immediate, cx)`, `state.pop(gpui_kit::base::NavMotion::Immediate, cx)` or `state.forward(gpui_kit::base::NavMotion::Immediate, cx)` inside `self.navigation.update(cx, |state, cx| { ... })`. `pop` keeps the root page; `forward` returns a previously popped page when available. A new push discards forward history.

The stack preserves the base navigation model; page content and navigation controls remain yours. Retain page entities when you want their editing state to survive navigation. The gallery's navigation example demonstrates pages with persistent notes.

## Open menus and contextual content

Use a menu for actions, a popover for interactive contextual content, and a hover card for supplementary previews. Keep essential information available without hovering.

### Offer a menu of actions

```rust
menu(
    "workspace-menu",
    button("menu-trigger", "Workspace", ButtonVariant::Outline, cx),
    vec![
        MenuItem::new("Settings").icon(IconName::Settings),
        MenuItem::new("Team workspace").checked(true),
        MenuItem::new("Archive").separator_before().disabled(true),
    ],
    |index, _, _| {
        // Dispatch your application command for this item index.
        println!("Selected item {index}");
    },
)
```

`menu(id, trigger, items: Vec<MenuItem>, on_select) -> gpui_kit::base::Popover` requires a trigger implementing `gpui_kit::base::Selectable + IntoElement + 'static`. Its callback is `Fn(usize, &mut Window, &mut App) + 'static`, receiving the original item index. Disabled entries cannot be chosen. The popup handles keyboard navigation, outside/Escape dismissal and focus return.

`MenuItem::new(label)` starts with no icon, shortcut, check or preceding separator. Its consuming builders return `Self`: `.icon(IconName)`, `.shortcut(label)`, `.disabled(bool)`, `.checked(bool)` and `.separator_before()`.

The `MenuItem` fields are also public: `label: SharedString`, `icon: Option<IconName>`, `shortcut: Option<SharedString>`, `disabled: bool`, `checked: Option<bool>` and `separator_before: bool`. The type implements `Clone`. `checked: None` is an ordinary command; `Some(bool)` marks an exclusive choice with a trailing check when selected. A shortcut is display text only; register the corresponding action/keybinding in your application.

### Put an editor in a popover

```rust
popover(
    "workspace-help",
    button("help-trigger", "Workspace details", ButtonVariant::Outline, cx),
    |_, _, _| gpui_kit::div().child("Changes are saved to this workspace."),
)
```

`popover<E>(id, trigger, content) -> gpui_kit::base::Popover` requires `E: IntoElement`, the same selectable trigger bounds as `menu`, and a content builder `FnOnce(&mut gpui_kit::base::PopoverState, &mut Window, &mut Context<gpui_kit::base::PopoverState>) -> E + 'static`.

The content builder runs in the popup state's context, not your parent view's context. Move entity handles or a parent listener into it when content needs to update your view. The constructor wraps content in `popover_surface(cx) -> Div`, a square, 280px-wide themed surface; use that helper directly when composing another popup. Popover content has its own keyboard context so editing does not activate the trigger. Escape dismisses and restores focus.

### Add supplementary help

`with_tooltip<T: StatefulInteractiveElement>(control: T, text: impl Into<SharedString>) -> T` preserves the input control's type and adds a tooltip after 400ms hover. `tooltip(text, cx: &App) -> gpui_kit::base::Tooltip` creates only the customizable tooltip surface, without a trigger or timer. A tooltip does not replace an accessible name.

`hover_card<E>(id, trigger, content) -> gpui_kit::base::HoverCard` accepts any `IntoElement` trigger and a content builder `FnOnce(&mut gpui_kit::base::HoverCardState, &mut Window, &mut Context<gpui_kit::base::HoverCardState>) -> E + 'static`, with `E: IntoElement`. It wraps content in a popover surface, opens after 400ms and closes after 200ms. Use it for a preview such as a person's details; put actions essential to completing the task in an ordinary visible control or popover.

## Ask for a decision or show a side panel

Modal overlays need an application-owned open flag, a stable modal focus handle and a trigger handle. Create handles in the view constructor, focus the modal when opening, and restore the trigger when closing. Render the overlay only while open.

### Compose a dialog

`dialog(&FocusHandle, &mut App) -> gpui_kit::base::Dialog` creates a centered modal host with a backdrop. `alert_dialog(&FocusHandle, &mut App) -> gpui_kit::base::AlertDialog` creates an explicit-decision modal with its distinct accessibility role; backdrop presses do not dismiss an alert dialog.

```rust
// Inside the branch rendered while self.modal_open is true.
let close = cx.listener(|this, confirmed: &bool, window, cx| {
    if *confirmed {
        // Commit your draft here.
    }
    this.modal_open = false;
    this.modal_trigger.focus(window, cx);
    cx.notify();
});
dialog(&self.modal_focus, cx)
    .popup(
        dialog_popup(cx)
            .child(dialog_title("Save workspace?", cx))
            .child(dialog_description("Save the current workspace settings.", cx))
            .child(dialog_button("cancel", "Cancel", ButtonVariant::Secondary, cx)
                .on_click(|_, window, cx| {
                    window.dispatch_action(Box::new(gpui_kit::base::actions::Cancel), cx);
                }))
            .child(dialog_button("confirm", "Save", ButtonVariant::Primary, cx)
                .on_click(|_, window, cx| {
                    window.dispatch_action(
                        Box::new(gpui_kit::base::actions::Confirm { secondary: false }), cx,
                    );
                })),
    )
    .request_close(move |confirmed, window, cx| close(&confirmed, window, cx))
```

The footer dispatches base confirm and cancel actions. Base owns the focus trap, Escape and confirmation dispatch; your close handler decides how to persist or discard the draft. Use the dialog's base `.on_ok(...)` builder to reject invalid drafts before closing.

| Constructor | What it supplies |
| --- | --- |
| `dialog_backdrop() -> gpui_kit::base::DialogBackdrop` | Full-size black scrim at 60% opacity; useful when composing a custom host. |
| `dialog_popup(cx: &App) -> gpui_kit::base::DialogPopup` | Square content surface, 420px wide and capped at its available width. |
| `dialog_title(title, cx: &App) -> gpui_kit::base::DialogTitle` | Emphasized title slot. |
| `dialog_description(text, cx: &App) -> gpui_kit::base::DialogDescription` | Secondary descriptive text slot. |
| `dialog_button(id, label, ButtonVariant, cx: &App) -> Button` | Outlined footer action using the requested semantic variant. |

### Show details at the edge

`sheet(&FocusHandle, &mut App) -> gpui_kit::base::Sheet` uses the same backdrop and base focus trapping. Compose the right-hand panel with `sheet_surface(cx: &App) -> Div`, then handle closing:

```rust
let close = cx.listener(|this, _: &(), window, cx| {
    this.sheet_open = false;
    this.sheet_trigger.focus(window, cx);
    cx.notify();
});
sheet(&self.sheet_focus, cx)
    .surface(sheet_surface(cx).child("Workspace details"))
    .request_close(move |window, cx| close(&(), window, cx))
```

The default surface is 360px wide, capped at the available width, anchored to the right edge and full height. Refine its width with normal `Styled` builders. Focus `self.sheet_focus` in your opening callback; Escape and backdrop dismissal request closing, while your application updates visibility and restores focus.

## Present status and rich content

A surface communicates state but does not own its lifecycle. Compose status text with actions that make sense for your application.

```rust
panel("Import", cx)
    .child(badge("In progress", Status::Neutral, cx))
    .child(progress("import-progress", 42., cx))
    .child(keycap("Escape", cx))
```

| Constructor (with `cx: &App`) | Return type and use |
| --- | --- |
| `panel(title, cx)` | `Div`: title and vertically arranged content with padding and an outer edge. |
| `separator(cx)` | `Div`: a one-pixel horizontal divider. |
| `vertical_separator(cx)` | `Div`: a one-pixel-wide, 20px-high toolbar divider; override height when needed. |
| `keycap(key, cx)` | `Div`: a bordered keyboard hint. It does not bind that key. |
| `badge(label, status: Status, cx)` | `Div`: short status label with a matching border. |
| `empty_state(title, description, cx)` | `Div`: explain what belongs in the empty region; add a relevant action as a child. |
| `progress(id, value: f32, cx)` | `gpui_kit::base::Progress`: determinate percentage, clamped to `0..=100`; NaN and infinities become zero. |
| `toast(id, cx)` | `gpui_kit::base::Toast`: notification surface with room for content and actions. |
| `avatar(initials, cx)` | `gpui_kit::base::Avatar`: square identity marker with an initials fallback. |

`Status` is `Neutral` (the default), `Success`, `Warning` or `Error`; these map to secondary, success, warning and danger colors. Like `ButtonVariant`, it supports `Clone`, `Copy`, `Debug`, `Default`, `PartialEq` and `Eq`.

### Own notification timing

`toast` creates a surface, not a notification service. Keep placement, stacking, dismissal, timeout and retry behavior in your application; base `ToastManager` can help. The gallery's six-second, hover/focus-paused success notifications are an example policy, not a constructor default. Persistent errors should offer a recovery action.

### Show an identity image

`avatar_image(source: impl Into<gpui_kit::ImageSource>) -> gpui_kit::base::AvatarImage` sizes an image slot to the avatar and does not require an application context:

```rust
avatar("JL", cx).image(avatar_image(self.profile_image.clone()))
```

The application decides whether to provide the image or fall back to initials after loading failure. The initials slot does not imply an automatic network retry or failure policy.

### Render a document

`markdown(id, source, cx)` and `html(id, source, cx)` both return `gpui_kit::base::TextView`. They accept `id: impl Into<ElementId>`, `source: impl Into<SharedString>` and `cx: &App`.

```rust
markdown("readme", "# Workspace\n\nSelect a file to begin.", cx)
```

These are read-only rich-text views with document typography, links and selectable content, not source editors or embedded web browsers. Install one `gpui_kit::base::TextSelectionLayer` as the root's **first child** so selection is initialized before rendering text:

```rust
focus_scope("document")
    .size_full()
    .child(gpui_kit::base::TextSelectionLayer)
    .child(markdown("readme", "# Workspace\n\nSelect a file to begin.", cx))
```

Do not add a separate selection layer to every text view.

For a state-backed base TextView, use `text_view_style(cx: &App) -> gpui_kit::base::TextViewStyle`. It maps Omarchy foreground, muted text, links, selection, borders and code surfaces into the base renderer's style, so all three entry points share the same document presentation.

## Display tables, lists and trees

Use a table for a modest structured dataset, a virtual list for many rows, and a tree for hierarchical items. Your application owns records, loading and selection policy.

### Compose a table

```rust
table("files", cx)
    .child(table_row("header", 1, cx)
        .child(table_head("name", 1, cx).child("Name"))
        .child(table_head("status", 2, cx).child("Status")))
    .child(table_row("readme", 2, cx)
        .child(table_cell("name", 1, cx).child("README.md"))
        .child(table_cell("status", 2, cx).child("Saved")))
```

`table(id, cx) -> gpui_kit::base::Table` supplies the outer edge and text style. `table_row(id, index, cx) -> gpui_kit::base::TableRow` takes a **one-based accessibility row index including the header**. `table_head(id, index, cx) -> gpui_kit::base::TableHead` and `table_cell(id, index, cx) -> gpui_kit::base::TableCell` take a **one-based column index**. All use `cx: &App` and `index: usize`.

Cells share available width by default; refine widths consistently across the header and body. These are primitive table parts: sorting, pagination, virtualization and row selection are not added automatically.

### Render only visible list rows

`virtual_list` creates a vertical `gpui_kit::base::VirtualList`. Give it your view entity, a stable ID, every row's size and a closure that builds only the requested range:

```rust
let sizes = std::rc::Rc::new(vec![
    gpui_kit::size(gpui_kit::px(0.), gpui_kit::px(28.));
    self.records.len()
]);
virtual_list(
    cx.entity(),
    "records",
    sizes,
    |this, range, _, _| {
        range.map(|index| {
            gpui_kit::div()
                .h(gpui_kit::px(28.))
                .child(this.records[index].clone())
        }).collect()
    },
    cx,
)
```

The full parameter types are `view: Entity<V>`, `id: impl Into<ElementId>`, `sizes: Rc<Vec<Size<Pixels>>>`, `render: impl Fn(&mut V, Range<usize>, &mut Window, &mut Context<V>) -> Vec<R> + 'static`, and `cx: &App`, where `V: Render` and `R: IntoElement`.

Every size must match its row's rendered height, including variable-height rows. The default list height is 280px; override it for your layout. Retain a base `VirtualListScrollHandle` and attach it with `.track_scroll(&handle)` to preserve position or navigate to an item.

### Add a scrollbar

`scrollbar(id, axis, &handle, cx) -> gpui_kit::base::Scrollbar` accepts `axis: gpui_kit::base::ScrollbarAxis`, `cx: &App` and a handle implementing `gpui_kit::base::ScrollbarHandle + Clone`. Vertical, horizontal and both-axis modes are supported.

Share the handle with the scrollable content, and render the scrollbar **after** that content inside the same relative container. The default mode is `ScrollbarMode::Always`; base builders remain available for customization. A scrollbar does not make ordinary content scrollable by itself.

### Navigate a tree

Create the tree state once:

```rust
let files = cx.new(|cx| {
    gpui_kit::base::TreeState::new(cx).items(vec![
        gpui_kit::base::TreeItem::new("documents", "Documents")
            .expanded(true)
            .child(gpui_kit::base::TreeItem::new("readme", "README.md")),
        gpui_kit::base::TreeItem::new("archive", "Archive").disabled(true),
    ])
});
```

`tree(&Entity<gpui_kit::base::TreeState>, cx: &App) -> gpui_kit::base::Tree` adds indented 28px rows, expand/collapse icons, disabled styling and selected fills to the base virtualized keyboard tree. It defaults to 280px high. Read selection and update items through the base state, and observe the entity when dependent content needs to redraw.

## Arrange a workspace

Use resizable panes when the layout has a fixed set of regions. Use a dock area when users need to move and regroup panels.

### Resize adjacent panes

```rust
resizable("workspace", gpui_kit::Axis::Horizontal, cx)
    .child(resizable_panel().child("Files"))
    .child(resizable_panel().child("Editor"))
```

`resizable(id, axis: gpui_kit::Axis, cx: &App) -> gpui_kit::base::ResizablePanelGroup` installs a fine divider while base owns dragging, hit areas and constraints. `resizable_panel() -> gpui_kit::base::ResizablePanel` creates an empty pane. Configure initial sizes and constraints with the returned base panel builders; choose horizontal or vertical axes for side-by-side or stacked regions.

### Dock and regroup panels

Create a dock area entity inside your view constructor:

```rust
let dock = cx.new(|cx| dock_area("workspace", window, cx));
```

`dock_area(id: impl Into<SharedString>, window: &mut Window, cx: &mut Context<gpui_kit::base::dock::DockArea>) -> gpui_kit::base::dock::DockArea` installs the Omarchy dock renderer. Unlike most constructors, it builds the stateful dock view inside that view's own context. Retain the entity and render it as a child of your workspace.

An empty dock has no visible panels. A base `gpui_kit::base::dock::Panel` must implement `Render`, `gpui_kit::Focusable`, `gpui_kit::EventEmitter<gpui_kit::base::dock::PanelEvent>` and `panel_name(&self) -> &'static str`. Keep its focus handle stable and its panel name stable across saved layouts. This minimal panel type can be defined at module scope:

```rust
struct NotesPanel {
    focus: gpui_kit::FocusHandle,
}
impl gpui_kit::EventEmitter<gpui_kit::base::dock::PanelEvent> for NotesPanel {}
impl gpui_kit::Focusable for NotesPanel {
    fn focus_handle(&self, _: &gpui_kit::App) -> gpui_kit::FocusHandle {
        self.focus.clone()
    }
}
impl gpui_kit::base::dock::Panel for NotesPanel {
    fn panel_name(&self) -> &'static str { "notes" }
}
impl Render for NotesPanel {
    fn render(&mut self, _: &mut Window, _: &mut Context<Self>) -> impl IntoElement {
        gpui_kit::div().size_full().child("Workspace notes")
    }
}
```

Then create the panel and assign a layout in your parent view's constructor:

```rust
let notes = cx.new(|cx| NotesPanel { focus: cx.focus_handle() });
let dock = cx.new(|cx| dock_area("workspace", window, cx));
dock.update(cx, |state, cx| {
    state.set_center(gpui_kit::base::dock::DockLayout::tabs().panel(notes), window, cx);
});
```

Retain `dock` and render its cloned entity in a container with available width and height. Base owns tab dragging, merging and split arrangements; gpui-omarchy supplies tab bars, surfaces and drop indicators. Floating layouts are not offered. The gallery's dock example demonstrates multiple panels and a split/tab layout.

## Find an API and continue

### Use the guide with an AI coding assistant

Start from the plain Markdown at `guides.md`, discovered through the site's `llms.txt` index or the Download Markdown link. The HTML and Markdown are generated from the same source. `llms.txt` is a convenience index; tools that do not discover it automatically can read the Markdown URL directly.

For an implementation task, follow this sequence:

1. Read the dependency versions and complete application example. Use the code for this documented version; inspect your project's `Cargo.lock` before mixing in examples from newer base releases.
2. Find the task's chapter and choose its state model. Create entities once in the view constructor and retain them as fields. Treat view, popup and component-state contexts as different types.
3. Distinguish a complete application from a fragment. A fragment using `self.name` requires an `Entity<InputState>` field initialized earlier; it is not a standalone program. Use explicit framework imports to avoid name collisions.
4. Preserve constructor-owned state: update values through callbacks or entities, and rebuild the themed component on render. Do not overwrite checkbox indicators, choice popup state or slider disabled state through unrelated builders.
5. Keep IDs and focus handles stable. Add required root layers, initial navigation pages and dock panels; constructing an empty state alone does not populate a view.
6. Run `cargo check` for types and `cargo run` to exercise interaction. Test Tab/Shift+Tab, disabled controls, editing, popup dismissal and focus return. Compilation does not prove runtime behavior.

When an API is not listed, inspect `src/lib.rs`, the relevant module and the **installed** gpui-base documentation produced by `cargo doc`. Do not invent a wrapper method or assume a base type is re-exported. For asynchronous work, use GPUI's supported task/context APIs and update view state on the appropriate context; the snippets here do not define a background persistence service.

All guide content is in this Markdown page. Use browser Find for a function or type name; the chapter directory lets you jump between tasks without changing pages.

Public modules mirror the components, so `gpui_omarchy::controls::button` and the root `gpui_omarchy::button` name the same constructor. This map lists every public module and where it appears above:

| Public modules | Guide |
| --- | --- |
| `theme` | [Follow and customize the theme](#follow-and-customize-the-theme) |
| `focus` | [Compose a view and manage state](#compose-a-view-and-manage-state) |
| `button`, `link`, `icon` | [Add actions and links](#add-actions-and-links) |
| `controls` | [Build forms](#build-forms), [Add actions and links](#add-actions-and-links), [Choose options and switch pages](#choose-options-and-switch-pages) |
| `input`, `otp_input` | [Build forms](#build-forms) |
| `button_group`, `select` | [Choose options and switch pages](#choose-options-and-switch-pages) |
| `calendar`, `date_picker`, `slider`, `color_picker` | [Edit dates, ranges and colors](#edit-dates-ranges-and-colors) |
| `navigation` | [Organize navigation](#organize-navigation) |
| `menu`, `popover`, `hover_card`, `tooltip` | [Open menus and contextual content](#open-menus-and-contextual-content) |
| `dialog`, `sheet` | [Ask for a decision or show a side panel](#ask-for-a-decision-or-show-a-side-panel) |
| `surface`, `text` | [Present status and rich content](#present-status-and-rich-content) |
| `table`, `list`, `tree` | [Display tables, lists and trees](#display-tables-lists-and-trees) |
| `resizable`, `dock` | [Arrange a workspace](#arrange-a-workspace) |

The root re-exports all themed constructors, `Button`, `Link`, `OtpInput`, `ChoiceItem`, `ChoiceState`, `DatePickerState`, `MenuItem`, `ButtonVariant`, `Status`, `IconName`, `Theme`, `ActiveTheme` and `ThemeLoadError`. Framework types and the application entry point come directly from `gpui_kit`. `icon::Icon` is module-qualified. The theme loader's implementation module is private; its public theme methods and error type remain available as described above.

For runnable examples in a checkout, start with `examples/hello.rs`, then explore `examples/gallery/app.rs`. Run the complete gallery with `cargo run --example gallery`. `examples/gallery-wasm/README.md` explains browser bootstrap, fonts and WebAssembly build requirements; browser applications use GPUI Kit’s web bootstrap instead of `gpui_kit::application()` and do not monitor desktop theme files.

For framework concepts, continue with [GPUI Kit](https://gpui-kit.com/) or its [AI-readable documentation](https://gpui-kit.com/llms-full.txt). Those docs also cover the optional component layer; keep the Omarchy setup in this guide when using this library. To inspect the exact base builders for your installed dependency versions, run `cargo doc --open`. Use these guides for the Omarchy presentation, state and composition conventions, and the generated dependency documentation for additional base and GPUI customization.
