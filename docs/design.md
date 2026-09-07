# gpui-omarchy

Independent presentation library on gpui-base 0.6.0. No dependency on the
gpui-component facade. Public constructors return composable base elements, retaining their interaction,
accessibility, child composition, and styling APIs. Button uses a thin facade
that withholds transient styles when disabled while delegating activation and
focus behavior to base.
Application entities own values and react to callbacks; controls do not maintain
competing internal copies of application state.

Theme roles are global, projected into gpui-base's semantic tokens whenever the
theme changes. The current Omarchy system theme is the default (read from
`$HOME/.local/state/omarchy/current/theme/colors.toml`, with `theme.name` for its name).
Older `.config/omarchy/current` installs are supported when the state directory is absent.
Support ANSI and semantic color files. Any read or parse failure falls back
atomically to Tokyo Night; a warm light theme reverses the full
surface/text hierarchy. Components use .SystemUIFont, content-sized actions,
role-specific geometry, square defaults and restrained foreground-tinted states.
Typography/spacing scaling and shell.toml overrides remain to be implemented.
Square corners are the recommended default; consumers may deliberately override
with slight rounding through the base styling API.
Focus uses a visible border; persistent selection uses a fill and marker.

Delivery scope: actions (button, toggle, link), forms (checkbox, switch, radio,
input, textarea, number input, slider, select, combobox), navigation (tabs,
menu, accordion, pagination), surfaces (panel, separator, keycap, badge,
empty state, progress, table, tooltip, popover, dialog, notification), and an
interactive preview for each component in a single Sidebar-driven gallery.
Specialized capabilities need individual behavior audits; unstyled re-exports
do not count as finished Omarchy components. Color picker now composes base Hex editing and HSLA sliders.

Validation: cargo fmt, cargo check --all-targets, cargo test; test the styled
controls' keyboard and pointer interaction, theme contrast and token projection.
Run the gallery on desktop, inspect both themes and narrow windows, exercise
Tab/Shift+Tab and activation, input editing, popup dismissal and focus recovery.
Examples must be runnable and exercise actual state changes. No screenshot or
compile-only check can establish interactive completion.

Implementation sequence: theme + basic controls; gallery + behavioral tests;
forms and navigation; overlays and data surfaces; complete component examples
and visual/runtime audit. This document records intended scope, not completion.


Current checkpoint: 47 component previews are implemented in one gallery.
Menu uses the base Popover with keyboard selection and disabled-item skipping;
Dialog and AlertDialog use base modal hosts with focus recovery and outline actions.
Icons come from gpui-kit-assets with explicit inherited-color resolution.
Tests cover these interactions and rendering every current page in both themes.
Select and Combobox share application-owned ChoiceState and styled option rows,
with filtering, disabled-item skipping and focus recovery. Open Select menus
support j/k; both controls support Ctrl-j/k/n/p without consuming Combobox
search text. Radio previews demonstrate density changes on an actual list.
ButtonGroup and Tabs have separate setting/page semantics with shared keyboard
navigation. Tooltip uses the base tooltip surface and GPUI hover lifecycle.
The focus_scope helper connects Tab traversal for forms and the gallery.
Popover now includes internal keyboard isolation and focus recovery. Collapsible
provides a controlled single region. Toast provides the base notification surface
and a bottom-right example with Undo/Retry actions. Saved notifications expire
after six seconds; hover/focus pauses expiry, errors persist, and replacement
restarts the timeout. Multi-notification stacking remains to be integrated.
This is partial progress: notification lifecycle integration and specialized
components remain, along with system structural
scaling and a complete visual/interaction audit.


Tree, Resizable, OTP Input, NavStack, HoverCard, DatePicker and Dock
now have styled constructors and gallery pages. DatePicker Escape/focus return
is tested; pointer selection, new component keyboard/drag interactions and
native visual review still need broader validation. Dock's tabbed split layout
is wired to base drag/drop; side-dock controls, title
metadata and persistence examples remain. Calendar currently uses base item
activation; grid arrow-key navigation still needs review before claiming full
keyboard coverage. OTP Input retains base's digit entry/backspace behavior;
paste and disabled-state interaction need an explicit integration audit.
Base OtpInput currently has no clipboard paste handler; this is a functional
gap, not a styling concern. Digit filtering, length limits and backspace are
covered by facade keyboard tests. Tree pointer-to-keyboard navigation and
folder collapse/expand are covered by an integration test.

Native AX review found unnamed Calendar day/month/year buttons. [gpui-kit PR #2996](https://github.com/longbridge/gpui-kit/pull/2996)
assigns names when items are created and uses full ISO dates for day cells.
The regression test inspects all three views and fails on the old implementation.
This remains a dependency gap until a version containing the fix is integrated. Native screenshots
can remain stale while AX updates; do not treat these as final visual validation.
Gallery footer now has explicit width and cannot shrink away its wrapped rows;
repository visibility is checked at narrow, default and wide viewport sizes.

Dock offers tabbed and split layouts. The gallery supports tab transfer and a
Reset layout action; floating layouts are intentionally not offered. Base still
requires a tiles renderer hook, which has no floating interaction affordances.

Primary buttons use transparent backgrounds with accent outlines and text,
matching the modal action treatment. This is an application-level mapping:
upstream Button.qml has no Primary variant, and its gallery Apply button uses
`bordered: true`. Persistent fills indicate selected/active state, not priority.

Interaction audit: Omarchy Button now owns disabled presentation. Its wrapper
withholds hover, pressed and focus-visible refinements when disabled, regardless
of builder order. Pointer, Return and Space activation remain guarded by base.
The fix works with the published gpui-base 0.6.0 and does not require an upstream
release. OtpInput still retains its tracked focus when disabled and has no
clipboard paste handler; those remain separate integration gaps.

TextView now has Markdown and HTML constructors with shared Omarchy typography,
selection, code and link colors. Both formats have destination-opening tests;
this does not replace native selection and visual review.

Editor is intentionally excluded from the component library and gallery until a suitable syntax-highlighted editing experience is available.

The native DatePicker report from September 7 identified an accessibility panic:
`set_focus called more than once in a single frame`. The picker root and its
trigger registered the same focus handle. DatePicker and ColorPicker now leave
focus ownership with the root and make the inner trigger non-focusable. Headless
interaction tests pass. A current native build opened the DatePicker popup with
its accessibility tree active without the duplicate-focus panic. Further native
month navigation and selection checks remain pending after conflicting window
changes interrupted the automation session.
