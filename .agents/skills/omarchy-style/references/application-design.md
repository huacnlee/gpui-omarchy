# Omarchy Application Design

This guide covers building a **native application** in Omarchy's style: adopting the user's system theme, mapping the shell's palette into application roles, and giving every component concrete geometry, state and keyboard behavior.

Read [design-guides.md](design-guides.md) first. It records source-audited facts about the Omarchy shell itself. This file applies those facts one layer up, to an application that is not part of the shell. Unless a line cites the shell source, treat the values here as **design proposals validated by building a complete component set**, not as upstream requirements. An application may deviate deliberately; it must not present its deviation as an Omarchy default.

Nothing here is tied to a UI toolkit. Translate the roles, geometry and behavior into whatever framework is in use.

## Contents

1. [Adopt the system theme](#1-adopt-the-system-theme)
2. [Application role model](#2-application-role-model)
3. [Emphasis without fills](#3-emphasis-without-fills)
4. [Component blueprint](#4-component-blueprint)
5. [State ownership](#5-state-ownership)
6. [Keyboard and focus contract](#6-keyboard-and-focus-contract)
7. [Validation](#7-validation)

## 1. Adopt the system theme

An Omarchy application should look like the user's desktop on first launch, with no configuration, and should degrade cleanly on a non-Omarchy machine.

### 1.1 Where the theme lives

The current theme is a directory or symlink, not an operating-system identity flag. Do not detect "am I on Omarchy" — read the theme and fall back.

| Path | Contents |
|---|---|
| `$HOME/.local/state/omarchy/current/theme/colors.toml` | Foundational palette |
| `$HOME/.local/state/omarchy/current/theme.name` | Display name; default to `Omarchy` when absent or blank |
| `$HOME/.config/omarchy/current/…` | Legacy location for older installations |

Use the legacy path **only when the state `current` entry does not exist at all**. If `current` exists but its theme is missing or invalid, fall back to the built-in default. An upgrade can leave a stale legacy theme behind, and reviving it silently shows the user a theme they replaced.

Read the theme once at startup and expose an explicit reload. Applying a theme must swap the whole palette and redraw; do not repaint components one at a time from a half-updated palette.

### 1.2 Palette formats

Support both formats a theme may ship:

- **ANSI**: `color0`–`color15`, plus `background` and `foreground`.
- **Semantic**: named roles such as `accent`, `muted`, `selection`, `lighter_background`.

Accept `#RRGGBB` only. Reject other lengths, missing `#`, and non-hex digits rather than guessing.

### 1.3 Required and derived roles

Require these; a theme missing any of them is invalid:

`background`, `foreground`, `accent`, `red`/`color1`, `yellow`/`color3`, `green`/`color2`.

Derive everything else from the user's own colors. Never borrow a missing role from a different theme.

| Role | Source key | Fallback |
|---|---|---|
| `appearance` | `mode` = `dark`/`light` | dark unless `background` is lighter than `foreground` |
| `surface` | `lighter_background` | mix `background` toward `foreground` by 5% |
| `inset` | `dark_background` | mix `background` toward `foreground` by 8% |
| `bright` | `bright_foreground`, `selection_foreground`, `cursor` | `foreground` |
| `secondary` | — | mix `background` toward `foreground` by 75% |
| `selection` | `selection`, `selection_background` | mix `background` toward `accent` by 20% |
| `border` | `muted`, `color8` | mix `background` toward `foreground` by 25% |
| `on_accent` | — | black or white, whichever contrasts better with `accent` |

`on_accent` must be computed, not assumed. A theme with a pale accent needs dark text on it; hard-coding the background color produces unreadable accent surfaces in light themes.

### 1.4 Fallback rules

A missing `HOME`, unreadable file, malformed TOML, bad hex, or missing required role must fall back **atomically** to one complete built-in theme. A palette that mixes the user's background with a default accent is worse than either theme alone. Tokyo Night is the conventional dark default.

Failure to find a theme is the normal case off Omarchy, not an error to report to the user.

### 1.5 Light themes

A light theme reverses the entire surface and text hierarchy; it is not a white background. Status colors must be **darkened until they read as text**, because the saturated terminal red, yellow and green intended for a dark canvas fail contrast on a light one.

Flexoki Light is a usable warm reference: canvas `#FFFCF0`, surface `#F2F0E5`, inset `#E6E4D9`, ink `#100F0F`, secondary `#575653`, border `#B7B5AC`, selection `#DAD8CE`, accent `#205EA6`, danger `#AF3029`, warning `#855B00`, success `#526600`.

Verify contrast against the **composited** surface in both appearances, including translucent state fills over a panel over the canvas.

## 2. Application role model

The shell palette maps to a small application role set. Keep it small; a component that needs a new color usually needs a different role instead.

| Role | Use |
|---|---|
| `background` | Window canvas, panels, popups, menus, dialogs |
| `surface` | Raised or hovered secondary regions |
| `inset` | Recessed regions: keycaps, code grounds, wells |
| `foreground` | Body text, icons, active switch thumbs |
| `secondary` | Labels, descriptions, shortcut hints, metadata |
| `bright` | Headings, hover peaks, cursor |
| `accent` | Links, primary emphasis, progress fill, focus ring where a theme asks for one |
| `on_accent` | Text on a filled accent surface, if the design uses one |
| `selection` | Text and list selection ground from the theme's own ramp |
| `border` | Surface and container edges |
| `danger` / `warning` / `success` | Real consequences and states only |

Interactive state is **not** in this list. States are foreground-tinted alphas shared by every control — normal fill `.04`, hover and focus fill `.08`, selected fill `.18`, pressed fill `.22`, control border `.40`, focus border `.25`, divider `.12`, text selection `.35`. See [shared control states](design-guides.md#shared-control-states) for their precedence and source. Deriving states from the foreground rather than the accent is what keeps an Omarchy interface quiet under every theme.

## 3. Emphasis without fills

The shell's plain button has no primary variant and no solid fill. Carry that upward: express priority through **edge and text color on a transparent field**, and reserve fills for state.

| Variant | Edge | Text | Note |
|---|---|---|---|
| Primary | `accent` | `accent` | Transparent ground; its interaction border is the accent |
| Outline | control border `.40` | `foreground` | Neutral bordered action |
| Secondary | transparent | `foreground` | The default; quiet until hovered |
| Danger | `danger` | `danger` | Only for a real destructive consequence |

Fills then mean exactly one thing: **this control is being interacted with, or is currently chosen.** Hover and focus take the hover fill, pressed takes the pressed fill, persistent selection takes the selected fill. Disabled controls drop to about 45% opacity and stay legible.

Modal footers use the same treatment. A dialog's confirm action is an accent-edged outline button beside a neutral cancel, not a solid block. A solid accent button is a deliberate application decision that must be justified by the task, not a default.

## 4. Component blueprint

Baseline logical pixels at body text `12`, matching the shell's baseline scale. Scale them with the user's text size (see [scale rules](design-guides.md#scale-rules)); do not treat them as minimums. Every control reserves its largest possible border before layout so that hover and focus never resize it or move its neighbors.

### Actions

| Component | Geometry |
|---|---|
| Button | Padding `6` vertical / `10` horizontal, icon-label gap `8`, text `12` at normal weight, `1px` edge. Intrinsic width from content |
| Toggle (press state) | Button metrics with a persistent edge; pressed uses the selected fill, not a heavier weight |
| Toggle group | Independent toggles, gap `6`, wrapping. Each keeps its own focus and pressed state |
| Tab / segmented item | Padding `6`/`10`, control border, selected uses the selected fill. Label weight stays constant across selection |
| Pagination | Gap `4`, page buttons `32` wide with no horizontal padding, ellipsis `24` wide in secondary |
| Link | Accent text, underline retained, trailing external-glyph `12`, gap `6`. Hover lifts to `bright` |

### Forms

| Component | Geometry |
|---|---|
| Checkbox | Row minimum `28`, padding `4`, gap `8`. Indicator `16` square, `1px` control border over the normal fill; checked and indeterminate swap to the selected fill with no border; glyph `14` |
| Radio | Checkbox row metrics. Indicator `16` square with an `8` square filled center — square, not a dot, at radius `0` |
| Switch | Track `42×22`, inner padding `2`, thumb `16` square, travel `20`. Off: normal fill, control border, secondary thumb. On: selected fill, no border, foreground thumb |
| Text input | Padding `7` vertical / `10` horizontal, `1px` edge, text `12`. Height follows line metrics plus padding plus borders |
| Textarea | Input metrics, minimum height `96` |
| Code editor | Input metrics, minimum height `280`, with line numbers and indentation |
| Number field | `120×28` with `28`-wide step buttons and `12` glyphs; its label is separate |
| Slider | Track `4`, thumb `16` square, hit row `28`, horizontal padding `8`. Track and hit area are different sizes |
| Select / combobox | Trigger with a `14` chevron. Popup `280` wide, offset `4`, padding `6`, option rows `28` with padding `6`, maximum height `224`, `14` check column. A combobox filters existing options; it does not create free text |

### Navigation

| Component | Geometry |
|---|---|
| Sidebar | `196` wide, `148` under a narrow viewport, padding `8`, hairline right divider. Choose the threshold from content — there is no official breakpoint |
| Section heading | Height `32`, padding `8`, text `12` bold, trailing chevron when collapsible. Hover uses `surface`; reserve the focus border width in the resting state |
| Accordion panel | Padding `8` vertical / `10` horizontal, bottom hairline, secondary text |
| Action menu | Width `240`, padding `6`, rows `28` with padding `8`, row gap `2`, `14` icon column, `14` trailing check column, shortcut `11` in secondary. The cursor row takes the hover fill. Separators are inset by `4` |
| Tree | Rows `28`, indent `20` per level, left padding `6`, right padding `8`, glyph `14`, gap `6`. Selection uses the selected fill |
| Scrolling list | Default height `280`; build only the visible range and keep declared row heights matching what renders |

A compact action menu is not the shell's main command launcher. Keep that one at its own larger row scale — see [component geometry](design-guides.md#component-geometry).

### Overlays

| Component | Geometry |
|---|---|
| Dialog | `420` wide capped at the viewport, padding `18`, gap `14`, `1px` edge, backdrop black at `60%`. Title `16` bold, description in secondary, peer outline actions in the footer |
| Alert dialog | Dialog metrics. A backdrop press must **never** dismiss a decision that needs an answer |
| Popover | `280` wide, padding `14`, gap `14`. Anchored, non-modal, keyboard-isolated from the surface beneath |
| Sheet | Edge-attached, `360` wide, padding `18`, gap `14` |
| Tooltip | Maximum width `320`, padding `6`/`10`, text `11`, delay about `400ms`. Supplementary only |
| Toast | Padding `14`, gap `10`, `1px` edge over the background. Expires after about `6s`; hover or focus pauses the timer; errors persist until handled; a replacement restarts the timeout |

Offer docked layouts as tabs and splits. Floating panels inside a tiling desktop reintroduce the window management the compositor already owns.

### Display

| Component | Geometry |
|---|---|
| Panel | Padding `18`, gap `14`, `1px` edge, title `14` bold |
| Separator | `1px` hairline at `12%` foreground; a vertical rule defaults to `20` tall and should match its row |
| Keycap | Padding `2`/`4`, inset ground, `1px` edge, text `11` bold |
| Badge | Padding `2`/`6`, text `11`, edge and text in the status color, no fill |
| Avatar | `32` square with a control border; initials at `12` when no image resolves |
| Progress | Track `6` in the border color with an accent indicator; clamp to `0–100` and treat non-finite values as `0` |
| Empty state | Padding `18`, gap `8`, bold title over a secondary description that names the action which fills it |
| Table | Rows at least `28`, cells padded `6`/`8`, bold header, hairline between rows, one border on the table rather than on every cell |
| Scrollbar | Track `8` in the normal fill, thumb `6` inset by `1`, thumb at `35%` foreground rising to `55%` hovered and `70%` active |
| Rich text | Body `12`, headings scaled from that base, code blocks padded `10` at radius `0`, selection at `35%` foreground |
| Icons | `16` standalone, `14` inside a control row, `11`–`12` for dense metadata. Match painted size and baseline, not the nominal box |

## 5. State ownership

The application owns its values; a control renders them.

- Pass the current value on every render and update it in the change callback. A control that keeps a competing internal copy will drift out of sync with the model the moment anything else writes to it.
- Do not write a control's value after construction as a correction. Fix the source of truth and re-render.
- Share one selection model between a control and the popup or list that edits it, and read back a stable identifier rather than a display label or an index into a filtered view.
- Keep component identifiers unique within a parent so state survives re-renders and reordering.
- Distinguish **persistent selection**, the **transient cursor**, and **input focus** in the model, not only in the paint. Pointer motion moves the same cursor the arrow keys move; two competing highlights in one list is a model bug, not a styling one.

## 6. Keyboard and focus contract

- Tab and Shift+Tab traverse a window or form. A group of peers — segmented control, tab strip, radio set — is **one** tab stop; arrow keys or `h`/`l` move the cursor inside it and Enter or Space confirms.
- Lists, menus and sidebars accept Up/Down, `j`/`k`, and Home/End. Navigation wraps and skips disabled items rather than stopping on them.
- Escape dismisses the topmost surface and returns focus to the control that opened it. A popup isolates its own keys so the surface beneath does not act on them, while nested inputs keep their own editing keys.
- Suspend a panel's single-key shortcuts while a field or nested popup owns input.
- A disabled control must not activate by pointer, Enter, or Space, and its disabled appearance must win over hover and pressed refinements.
- Give every icon-only control an explicit accessible name. A tooltip is supplementary and a visual glyph is not a name; do not assume rendered text becomes an accessible label — supply one through a real labeling interface.
- Read-only text worth quoting — errors, paths, commands, log lines — should be selectable and copyable with the system shortcut.
- Keep essential content reachable without hover. A hover preview may enrich a row; it may not be the only place a fact appears.

## 7. Validation

In addition to the [source-comparison checklist](design-guides.md#review-the-design-not-just-the-token-list):

- [ ] Launch with a real Omarchy theme, with the legacy path, with a broken `colors.toml`, and with no theme at all. Confirm the fallback is whole in every case.
- [ ] Load an ANSI palette and a semantic palette, and confirm the derived surface, border, secondary and selection roles remain readable in both.
- [ ] Check every state — normal, hover, cursor, focus, selected, pressed, disabled — in a dark and a light theme, over the composited surface.
- [ ] Confirm bounds are stable across states: nothing grows or shifts on hover or focus.
- [ ] Drive every interactive component from the keyboard alone: enter it, change it, dismiss it, and confirm focus returns.
- [ ] Verify at narrow, default and wide window sizes. Preserve readable control widths and scroll locally instead of compressing the whole layout.
- [ ] Exercise text editing, clipboard, selection and IME in every field, not only single-key entry.
- [ ] Confirm each accessible name from the accessibility tree, not from the rendered text.

Compilation, a passing test suite, a palette match, and the existence of a screenshot are not evidence of visual quality. Report unverified work as source-grounded rather than as visually aligned.
