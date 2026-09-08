//! Read-only rich text using base's Markdown and HTML renderers.
use crate::ActiveTheme;
use gpui_kit::base::{TextView, TextViewStyle};
use gpui_kit::{App, ElementId, SharedString, StyleRefinement, Styled, Window, rems};

/// Theme mapping shared by Markdown, HTML and state-backed TextViews.
pub fn text_view_style(window: &Window, cx: &App) -> TextViewStyle {
    let t = cx.omarchy();
    TextViewStyle::from_theme(&gpui_kit::base::Theme::global(cx))
        .with_foreground(t.foreground)
        .with_muted_foreground(t.secondary)
        .with_link(t.accent)
        .with_selection(t.foreground.opacity(0.35))
        .with_border(t.divider())
        .with_code_background(t.normal_fill())
        .with_inline_code(gpui_kit::HighlightStyle {
            background_color: Some(t.normal_fill()),
            ..Default::default()
        })
        .with_paragraph_gap(rems(0.75))
        .with_heading_base_font_size(rems(0.75).to_pixels(window.rem_size()))
        .with_heading_font_size(|level, base| {
            base * match level {
                1 => 5. / 3.,
                2 => 4. / 3.,
                3 => 7. / 6.,
                _ => 1.,
            }
        })
        .with_code_block(StyleRefinement::default().p(rems(0.625)).rounded_none())
}

pub fn markdown(
    id: impl Into<ElementId>,
    source: impl Into<SharedString>,
    window: &Window,
    cx: &App,
) -> TextView {
    TextView::markdown(id, source)
        .style(text_view_style(window, cx))
        .font_family(cx.omarchy().font.clone())
        .text_size(rems(0.75))
        .selectable(true)
}

pub fn html(
    id: impl Into<ElementId>,
    source: impl Into<SharedString>,
    window: &Window,
    cx: &App,
) -> TextView {
    TextView::html(id, source)
        .style(text_view_style(window, cx))
        .font_family(cx.omarchy().font.clone())
        .text_size(rems(0.75))
        .selectable(true)
}

#[cfg(test)]
mod tests {
    use super::*;
    use gpui_kit::px;
    use gpui_kit::{Context, IntoElement, Render, TestAppContext, Window, div, point, prelude::*};

    struct Document {
        html: bool,
    }
    impl Render for Document {
        fn render(&mut self, window: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
            let text = if self.html {
                html(
                    "document",
                    "<p><a href=\"https://github.com/huacnlee/gpui-omarchy/issues\">Project source</a></p>",
                    window,
                    cx,
                )
            } else {
                markdown(
                    "document",
                    "[Project source](https://github.com/huacnlee/gpui-omarchy)",
                    window,
                    cx,
                )
            };
            div().w(rems(20.)).child(text)
        }
    }

    #[gpui_kit::test]
    fn markdown_and_html_links_open_their_destination(cx: &mut TestAppContext) {
        cx.update(crate::init);
        for html in [false, true] {
            let (_, window) = cx.add_window_view(move |_, _| Document { html });
            window.update(|window, cx| window.draw(cx).clear(cx));
            window.simulate_click(point(px(10.), px(10.)), Default::default());
            assert_eq!(
                window.opened_url().as_deref(),
                Some(if html {
                    "https://github.com/huacnlee/gpui-omarchy/issues"
                } else {
                    "https://github.com/huacnlee/gpui-omarchy"
                })
            );
        }
    }
}
