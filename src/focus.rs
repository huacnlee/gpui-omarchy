//! Keyboard traversal for a composed desktop region.
use gpui::{App, Div, ElementId, KeyBinding, Stateful, Window, actions, div, prelude::*};

actions!(omarchy_focus, [Next, Previous]);

pub(crate) fn init(cx: &mut App) {
    cx.bind_keys([
        KeyBinding::new("tab", Next, Some("OmarchyFocusScope")),
        KeyBinding::new("shift-tab", Previous, Some("OmarchyFocusScope")),
    ]);
}

/// Wrap a window or form in this scope to connect Tab and Shift+Tab to GPUI's
/// tab order. Nested editors may consume Tab for indentation; single-line
/// fields propagate it here. Popup-specific handlers take priority.
pub fn focus_scope(id: impl Into<ElementId>) -> Stateful<Div> {
    div()
        .id(id)
        .tab_group()
        .key_context("OmarchyFocusScope")
        .on_action(|_: &Next, window: &mut Window, cx| window.focus_next(cx))
        .on_action(|_: &Previous, window: &mut Window, cx| window.focus_prev(cx))
        .on_action(
            |_: &gpui_base::input::IndentInline, window: &mut Window, cx| window.focus_next(cx),
        )
        .on_action(
            |_: &gpui_base::input::OutdentInline, window: &mut Window, cx| window.focus_prev(cx),
        )
}
