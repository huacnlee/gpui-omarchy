# Omarchy UI Design Guides

These guides govern Omarchy-inspired application and shell design. Read them alongside the brand and theme definitions in [design-system.md](design-system.md). They are about the whole interface: composition, proportions, information hierarchy, interaction, and the relationship between controls. A palette and a component inventory do not establish the intended visual character.

Source baseline: the user-provided `~/github/omarchy` checkout, clean at commit [`945549699026df6c888a6b1bd4e06fbf55a67595`](https://github.com/omacom/omarchy/tree/945549699026df6c888a6b1bd4e06fbf55a67595), inspected 2026-09-07. Values below describe this revision, not permanent limits. Recheck changed upstream files when updating the baseline. **Source facts** identify implemented behavior; **design guidance** applies that behavior to new interfaces. Explicit user choices take precedence, and a platform adaptation must not be presented as an upstream default.

## Design thesis

Omarchy puts the work in front of the interface. Its recognizable qualities are quiet surfaces, clear edges, compact but readable information, and a single predictable keyboard cursor. Density comes from removing redundant containers and aligning related information, not from shrinking every control to the same height.

A successful screen has an obvious object or task, a small number of visual levels, and enough space for the important content. Most of its chrome is neutral. Focus and current choices become visible when needed. Accent is meaningful rather than a coating on every border, icon, button, and selection.

Prefer square corners. Slight rounding is allowed when deliberately chosen or inherited from the active system theme; it is not the recommended application default. This is a preference, not a claim that upstream contains no rounded shapes.

## Start from the task and the surface

Before choosing dimensions, identify the kind of surface:

| Surface | Composition | Avoid |
|---|---|---|
| Bar | Small stable slots, tightly aligned icons and compact status text | Treating bar height as a universal control size |
| Settings or device popup | Hero/object header, a few sections, rows and trailing controls | A border and card around every label/value pair |
| Command menu | Search/header, substantial selectable rows, explicit hierarchy | Reusing compact dropdown option heights |
| Form | Label, field, optional helper/error; related controls aligned | Full-width action buttons beneath every field |
| Desktop workbench or Gallery | Persistent navigation, a primary working region, subordinate status/actions | A cloud of equally prominent demo cards or navigation buttons |

Choose a representative upstream component or screen before adapting a component. For a novel widget with no upstream equivalent, label its measurements as a design proposal. Do not invent an “official” checkbox or radio API from another component library.

## Compose the whole screen

**Design guidance:**

- Establish three levels: the object or page identity, the current working content, and auxiliary metadata/actions. Use weight, alignment and spacing before adding another size or color.
- Group related content with shared alignment and whitespace. Introduce a divider only at a real section boundary. Avoid a page border, panel border, card border, row border and field border all describing the same grouping.
- Use a quiet page header. Keep a title near the working content; do not repeat the same title in a header, breadcrumb and nested panel.
- Let fields use widths suited to their values. A numeric field should not stretch across a wide preview just because its container can. Reserve full width for text, lists and tables that benefit from it.
- Fit simple actions to their content. Use a small row of peer actions, with one meaningful emphasis at most. A column of full-width bold buttons makes a component gallery resemble a command menu without the menu's row structure.
- Use semantic status colors only where they convey status. Ordinary switch tracks, check marks and focus do not need to be accent-colored by default.
- Give important rows room for their content. A two-line device row must be taller than an inline action. Dense does not mean cramped.
- Treat native font metrics as part of layout. If a port uses `.SystemUIFont` by explicit request, measure its line boxes and baselines; do not pretend it is the Linux `monospace` alias or compensate by mechanically compressing it.

### Gallery composition

A component gallery is a desktop reference application. Keep one restrained Sidebar with section labels and a single current item. The preview region should contain the component name, a short purpose, the live example, and only relevant controls or state output.

Show related variants together: normal/hover/focus/selected/disabled for actions; label/helper/validation for fields; collapsed/expanded for sections. Use short captions, with consistent gaps and alignment. Do not make every specimen full width or put an identical “Preview” box around every example. A popup specimen may need a real surface border; a standalone button generally does not need an extra bordered container.

Keep theme controls and implementation notes subordinate to the specimen. When space gets narrow, preserve readable control widths and local scrolling rather than squeezing the whole desktop arrangement. A `768px` web breakpoint is not an official shell rule; choose a collapse threshold from the actual content.

## Theme resolution is more than a palette

**Source facts:** [`Color.qml`](https://github.com/omacom/omarchy/blob/945549699026df6c888a6b1bd4e06fbf55a67595/shell/Commons/Color.qml), [`Style.qml`](https://github.com/omacom/omarchy/blob/945549699026df6c888a6b1bd4e06fbf55a67595/shell/Commons/Style.qml), and [`shell.toml.tpl`](https://github.com/omacom/omarchy/blob/945549699026df6c888a6b1bd4e06fbf55a67595/default/themed/shell.toml.tpl).

- `current/theme/colors.toml` supplies the foundational palette.
- `current/theme/shell.toml` supplies surface colors, shared control states, font, spacing and bar settings. It can be generated from the default template or supplied by a theme.
- `~/.config/omarchy/shell.toml` overrides theme shell keys. This machine-level override is where the text-size command writes `[font] base-size`; ignoring it can make a port look smaller than the user's desktop.
- `Style.cornerRadius` reads the effective Hyprland `decoration:rounding`; its fallback is `0`.
- `Style.gapsOut` is **half** the effective Hyprland `general:gaps_out`, rounded. The default shell edge gap is `5`, distinct from the Hyprland window gap of `10`.
- The Linux font family is the system `monospace` alias, resolved with `fc-match`, not a hard-coded JetBrains family. Menu surfaces can override it with `OMARCHY_MENU_FONT`.

**Port guidance:** resolve palette, surface/state roles and structural scale separately. For the application-side reading and derivation rules — theme paths, both palette formats, derived roles and atomic fallback — see [Application Design § 1](application-design.md#1-adopt-the-system-theme). If runtime Hyprland or shell configuration is unavailable, use documented baseline values. Honor an explicit application font choice. A port that reads only colors has palette integration, not full system-style integration.

## Dimensions and scaling

All baseline dimensions below are logical pixels at a font base of `12` and spacing scale `1`, unless noted. They are not physical screen pixels or arbitrary minimums for every component.

### Scale rules

From `Style.qml`:

- `fontScale = max(1 / 12, fontBaseSize / 12)`.
- A derived font token is `max(1, round(fontBaseSize × multiplier))`; a positive explicit per-token value is rounded and used directly.
- `effectiveSpacingScale = spacingScale × (scaleWithFont ? fontScale : 1)`.
- `space(n)` scales a positive baseline, rounds it, and floors it at `1`; nonpositive input produces `0`. `spaceReal(n)` preserves fractional geometry.
- A nonnegative explicit spacing-token value is rounded and used directly, without another scale multiplication. Do not scale overrides twice.
- Bar horizontal/vertical dimensions scale with the base font by default. `[bar] scale-with-font = false` disables that coupling.

For example, at base font `16`, default `control-height` becomes `37` and `panel-padding` becomes `24`. An explicit `control-height = 32` stays `32`. Some component-local floors are deliberately unscaled, so derive final geometry from the component rather than scaling a screenshot wholesale.

### Typography

| Role | Baseline | Derivation |
|---|---:|---|
| Caption | 10 | base × 0.833 |
| Body small | 11 | base × 0.917 |
| Body | 12 | base × 1.0 |
| Subtitle | 13 | base × 1.083 |
| Title | 14 | base × 1.167 |
| Heading | 16 | base × 1.333 |
| Display | 24 | base × 2.0 |
| Display large | 28 | base × 2.333 |
| Small/default/large icon | 11 / 14 / 18 | body-small / title / base × 1.5 |

Normal Button text is not universally bold: `Button.qml` uses bold for `selected`. Section headings use caption size and bold; Toggle row titles use subtitle and bold; descriptions use caption. Preserve those relationships instead of bolding every control.

### Shared spacing

| Tokens | Baselines |
|---|---|
| xxs / xs / sm / md / lg | 2 / 3 / 4 / 6 / 8 |
| xl / xxl / xxxl / huge | 10 / 12 / 14 / 18 |
| control-gap / control-padding-x / control-padding-y | 8 / 10 / 6 |
| input-padding-y | 7 |
| control-height / popup-row-height | 28 / 28 |
| row-gap / row-padding-x / label-gap | 8 / 12 / 4 |
| panel-gap / panel-padding / popup-padding | 14 / 18 / 14 |
| dropdown-width / searchable-dropdown-width / number-field-width | 240 / 260 / 120 |
| searchable-popup-min-height | 220 |

The same number appearing in two tokens does not make the tokens interchangeable. `panelPadding` belongs to panel content, and `popupPadding` belongs to popup content. Border insets are additional where the source component includes them.

### Component geometry

| Source component | Baseline or formula | Design consequence |
|---|---|---|
| `Button.qml` | Measured label/icon row + horizontal padding 10 each side + vertical padding 6 each side + maximum state-border reservation | Intrinsic size; **not** a fixed 28px control. Default label 12, icon 14, gap 8 |
| `TextField.qml` | Native text metrics + vertical padding 7 each side + border insets | Source describes about 30px in dialog forms; actual height follows font metrics. Inline prompts reduce padding explicitly |
| `NumberField.qml` | width 120; height `max(controlHeight, fontSize + 2 × controlPaddingY)` | Baseline 28px spinbox; label is separate, at 11px with gap 6 |
| `Dropdown.qml` | width 240; trigger and popup row tokens 28; labeled wrapper adds `huge` (18) | Trigger height is not the height of every form or menu |
| `Toggle.qml` | width `space(240)`; height `max(54, contentHeight + huge)` | A labeled row with title/description left and switch right, not a tiny checkbox replacement |
| `ToggleSwitch.qml` | track height `max(22, round(controlHeight × .55))`; width `round(height × 1.9)`; knob `max(6, round(height × .72))`; inset `max(1, round((height − knob) / 2))` | Default track 42×22, knob 16, inset 3. Interactive cursor adds 6px padding per side, giving 54×34 overall; row-owned switches omit that ring |
| `PanelActionButton.qml` | `max(space(22), iconSize + 2 × sm)` square | Baseline 22×22 inline action, distinct from a normal text button |
| `PanelSlider.qml` | width `space(200)`; track `max(4, round(controlHeight × .11))`; knob `max(14, round(controlHeight × .38))`; height `max(space(22), knob + md)` | Default track 4px, knob 14px, hit height 22px; track and hit area are different sizes |
| `MultiSelect.qml` checkbox | 16×16; check glyph about 85% of indicator height | An actual checkbox with selected fill, not `[x]` text. The surrounding result row grows with content |
| `PopupCard.qml` / `KeyboardPanel.qml` | Default 280×200 configurable card, padding 14, fallback surface border `max(1, space(2))` | Compute content insets from padding **plus** border; fit to available screen |
| Network / Bluetooth / Audio panel | Requested width `space(380)`, fitted to available screen | Useful real panel reference; not a universal app or preview width |
| Main `Menu.qml` | baseline row 50, detail row 58, header 34, row gap 3, panel padding 18; normal width 300, some routes 520 | The command menu is materially larger than a 28px dropdown option list |
| `PanelSeparator.qml` | 1px, foreground alpha .12 | A quiet hairline; not the same visual strength as control or window borders |

Sources: [UI components](https://github.com/omacom/omarchy/tree/945549699026df6c888a6b1bd4e06fbf55a67595/shell/Ui), [main menu](https://github.com/omacom/omarchy/blob/945549699026df6c888a6b1bd4e06fbf55a67595/shell/plugins/menu/Menu.qml), [device panels](https://github.com/omacom/omarchy/tree/945549699026df6c888a6b1bd4e06fbf55a67595/shell/plugins/panels). Read the individual file before porting its behavior.

## Color, edges and emphasis

### Shared control states

`[controls]` in `shell.toml` defines these defaults. The color role is **foreground**, including selected and text selection, unless a theme overrides it.

| State | Fill alpha | Border alpha | Border width |
|---|---:|---:|---:|
| Normal form chrome | .04 | .40 | 1 |
| Hover / panel cursor | .08 | .25 | 1 |
| Active focus | .08 | .25 | 1 |
| Persistent selected | .18 | 1.0 | 0 |
| Pressed | .22 | follows component border-state logic | — |
| Text selection | .35 | — | — |

A plain Button is transparent and borderless at rest. `bordered` opts into the normal border. Its fill precedence is pressed → active focus → hover/cursor → selected → active → idle. Its border has its own focus → hover → selected → normal resolution. Selected bordered buttons retain their normal border when selected-border width is zero. Reserve each side's largest possible border before laying out the content.

Do not translate this into “every focused control gets an accent outline” or “every primary action is solid accent with dark text.” A deliberately emphasized action is a design choice; it is not the default Button recipe in this source revision. Destructive colors should indicate an actual destructive consequence.

### Surfaces and selection are different roles

- Popups use `[popups]` surface colors and active-border-derived edges; menu cards use `[menu]` and a background scrim. Do not replace them with the generic control-border color.
- Menu cursor rows default to foreground at .08 with accent text and their own selected-border role. This differs from a persistent selected control at .18.
- `TextField.qml` and `NumberField.qml` use `Style.selectionFillFor(...)`, default foreground at .35, and preserve foreground text. This differs from `colors.toml`'s `selection` ramp used by generated application themes.
- Distinguish window borders (Hyprland default 2px), surface borders, control borders (default 1px), and dividers (1px at .12). Applying the same opaque border everywhere destroys hierarchy.
- Keep text readable against the **composited** surface in dark and light themes. Do not mechanically replace `Qt.darker` with a CSS opacity and claim equivalent contrast.

### Corners: recommendation and source facts

Recommend square application chrome, with a default radius of zero. Follow an explicitly selected theme or user override when the application promises system-style integration.

The inspected source is not uniformly square: `Style.cornerRadius` follows Hyprland; ToggleSwitch becomes rounded when that radius is positive; MultiSelect's checkbox uses `max(2, cornerRadius / 2)`; PanelSlider has a circular knob and rounded track. These are component-specific source facts, not permission to add rounding to every card. If a square-by-default port intentionally differs on these small shapes, identify that as its own design decision.

## Icons and alignment

The shell's normal icons use the configured Nerd Font; branded marks also use `omarchy.ttf`. Some launcher entries use application images. A cross-platform application's explicit font/icon choice is an adaptation and should not be mislabeled as the shell's icon implementation.

Match **painted size and baseline**, not just nominal icon-box dimensions. `OpticalGlyph.qml` corrects horizontal tight bounds while preserving the shared line box and baseline. Use fixed icon columns in menus and rows. Align trailing actions to row content rather than arbitrary top padding. Pair selected, error and success states with a meaningful mark or label, not color alone.

## Interaction and motion

Keep persistent selection separate from the transient keyboard cursor and actual text/control focus. In a panel, pointer motion updates the same cursor that directional keys move. Do not paint an unrelated hover highlight on one row while another row holds the keyboard cursor.

Suspend panel shortcuts while a field or nested popup owns input. Escape dismisses the topmost surface and restores an appropriate focus target. A port may make standalone controls keyboard-focusable even where the shell relies on its containing panel; preserve the visible focus vocabulary.

There is no universal 150ms animation in the inspected kit: Button color is 120ms, CursorSurface 60ms, Toggle 100ms, switch travel 120ms, and PopupCard opacity 140ms. PanelSlider also has local size/position effects. Keep motion short and tied to state; do not add decorative animation to imitate a “modern” UI. Reduced-motion adaptations should preserve every state without animation.

## Review the design, not just the token list

Before calling a port visually aligned:

- [ ] Record the source revision, target theme/shell overrides, font family, base size and scale. State deliberate platform deviations.
- [ ] Compare a complete representative screen or panel, not only isolated controls. Check hierarchy, width, whitespace and where borders are absent.
- [ ] Check intrinsic button sizing, input line boxes, label/helper spacing, switch proportions, menu row sizes, and popup padding plus border.
- [ ] Verify that icon baselines and clipped text tops remain correct with the chosen font; check at 1× and 2×.
- [ ] Check normal, hover/cursor, focus, selected, pressed and disabled states; confirm stable bounds and one cursor model.
- [ ] Check composited selection and text contrast in both dark and light themes. Test a larger text-size setting as well as the baseline.
- [ ] Exercise keyboard navigation, text editing, popup dismissal and focus return.
- [ ] Capture and inspect reference and candidate screenshots at comparable logical sizes and states. Compare composition first, then individual metrics. Follow the source's [visual-verification guide](https://github.com/omacom/omarchy/blob/945549699026df6c888a6b1bd4e06fbf55a67595/agents/skills/visual-verification.md).
- [ ] Treat compile tests, a palette match, and screenshot existence as insufficient evidence of visual quality.

When a running Omarchy reference is unavailable, report the result as source-grounded guidance or implementation, with visual alignment still unverified. Do not invent measurements or claim a visual comparison took place.
