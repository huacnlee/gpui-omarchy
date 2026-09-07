//! Read-only selectable text using base's window-scoped selection behavior.
use crate::ActiveTheme;
use gpui::{App, ElementId, SharedString, TextStyleRefinement, px};

/// Render `gpui_base::TextSelectionLayer` once above the window's content.
pub fn selectable_text(
    id: impl Into<ElementId>,
    text: impl Into<SharedString>,
    cx: &App,
) -> gpui_base::SelectableText {
    let t = cx.omarchy();
    gpui_base::SelectableText::new(id, text)
        .selection_color(t.foreground.opacity(0.35))
        .text_style(TextStyleRefinement {
            font_family: Some(t.font.clone()),
            font_size: Some(px(12.).into()),
            color: Some(t.foreground),
            ..Default::default()
        })
}
