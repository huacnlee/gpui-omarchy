//! Virtualized lists retain base's sizing and scroll model.
use crate::ActiveTheme;
use gpui_kit::rems;
use gpui_kit::{
    App, Context, ElementId, Entity, IntoElement, Pixels, Render, Size, Styled, Window,
};
use std::{ops::Range, rc::Rc};

/// Each supplied size must match the corresponding row's rendered height.
/// Only the visible range is built. Attach a base VirtualListScrollHandle to
/// preserve scroll position and support navigation to a specific item.
pub fn virtual_list<V: Render, R: IntoElement>(
    view: Entity<V>,
    id: impl Into<ElementId>,
    sizes: Rc<Vec<Size<Pixels>>>,
    render: impl Fn(&mut V, Range<usize>, &mut Window, &mut Context<V>) -> Vec<R> + 'static,
    cx: &App,
) -> gpui_kit::base::VirtualList {
    let t = cx.omarchy();
    gpui_kit::base::v_virtual_list(view, id, sizes, render)
        .w_full()
        .h(rems(17.5))
        .font_family(t.font.clone())
        .text_size(rems(0.75))
        .text_color(t.foreground)
        .bg(t.background)
}

/// Overlay scrollbar for a scrollable region. Render after that region inside a
/// relative parent, using the same handle as the scrollable content.
pub fn scrollbar<H: gpui_kit::base::ScrollbarHandle + Clone>(
    id: impl Into<ElementId>,
    axis: gpui_kit::base::ScrollbarAxis,
    handle: &H,
    window: &Window,
    cx: &App,
) -> gpui_kit::base::Scrollbar {
    let t = cx.omarchy();
    gpui_kit::base::Scrollbar::new(handle)
        .id(id)
        .axis(axis)
        .mode(gpui_kit::base::ScrollbarMode::Always)
        .styles(|style| {
            style
                .track(|track| {
                    track
                        .width(rems(0.5).to_pixels(window.rem_size()))
                        .bg(t.normal_fill())
                })
                .thumb(|thumb| {
                    thumb
                        .width(rems(0.375).to_pixels(window.rem_size()))
                        .inset(rems(0.0625).to_pixels(window.rem_size()))
                        .radius(Pixels::ZERO)
                        .bg(t.foreground.opacity(0.35))
                })
                .thumb_hover(|thumb| thumb.bg(t.foreground.opacity(0.55)))
                .thumb_active(|thumb| thumb.bg(t.foreground.opacity(0.7)))
        })
}
