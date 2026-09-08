//! Native text editing, selection, clipboard and IME supplied by gpui-base.
use crate::ActiveTheme;
use gpui_kit::base::{
    Input as BaseInput, InputBase, Textarea,
    input::{InputState, TextareaState},
};
use gpui_kit::rems;
use gpui_kit::{
    AnyElement, App, ElementId, Entity, Focusable, InteractiveElement, Interactivity, IntoElement,
    MouseButton, ParentElement, RenderOnce, StatefulInteractiveElement, StyleRefinement, Styled,
    Window, div,
};

/// A native single-line editor with optional, non-editable prefix and suffix slots.
/// The caller retains the `InputState`; affixes never become part of its value.
#[derive(IntoElement)]
pub struct Input {
    base: InputBase,
    editor: BaseInput,
    prefix: Option<AnyElement>,
    suffix: Option<AnyElement>,
}

impl Input {
    pub fn prefix(mut self, content: impl IntoElement) -> Self {
        self.prefix = Some(content.into_any_element());
        self
    }

    pub fn suffix(mut self, content: impl IntoElement) -> Self {
        self.suffix = Some(content.into_any_element());
        self
    }
}

impl Styled for Input {
    fn style(&mut self) -> &mut StyleRefinement {
        self.base.style()
    }
}

impl InteractiveElement for Input {
    fn interactivity(&mut self) -> &mut Interactivity {
        self.base.interactivity()
    }
}

impl StatefulInteractiveElement for Input {}

impl RenderOnce for Input {
    fn render(self, _: &mut Window, cx: &mut App) -> impl IntoElement {
        let affix = |content| {
            div()
                .flex()
                .items_center()
                .flex_shrink_0()
                .text_color(cx.omarchy().secondary)
                .child(content)
        };
        self.base
            .children(self.prefix.map(affix))
            .child(div().flex_1().min_w_0().child(self.editor))
            .children(self.suffix.map(affix))
    }
}

fn frame(id: impl Into<ElementId>, focused: bool, cx: &App) -> InputBase {
    let t = cx.omarchy();
    InputBase::new(id)
        .focused(focused)
        .w_full()
        .min_w_0()
        .px(rems(0.625))
        .border_1()
        .rounded_none()
        .border_color(t.control_border())
        .bg(t.normal_fill())
        .text_color(t.foreground)
        .font_family(t.font.clone())
        .text_size(rems(0.75))
        .styles(|s| s.focused(|s| s.bg(t.hover_fill()).border_color(t.focus_border())))
}

pub fn input(
    id: impl Into<ElementId>,
    state: &Entity<InputState>,
    window: &Window,
    cx: &mut App,
) -> Input {
    let style = cx.omarchy().input_style();
    state.update(cx, |state, _| state.set_editor_style(style));
    let focused = state.read(cx).focus_handle(cx).is_focused(window);
    let target = state.clone();
    let base = frame(id, focused, cx)
        .py(rems(0.4375))
        .flex()
        .items_center()
        .gap_2()
        .on_mouse_down(MouseButton::Left, move |_, window, cx| {
            target.update(cx, |state, cx| state.focus(window, cx));
        });
    Input {
        base,
        editor: BaseInput::new(state),
        prefix: None,
        suffix: None,
    }
}

pub fn textarea(
    id: impl Into<ElementId>,
    state: &Entity<TextareaState>,
    window: &Window,
    cx: &mut App,
) -> InputBase {
    let style = cx.omarchy().input_style();
    state.update(cx, |state, _| state.set_editor_style(style));
    let focused = state.read(cx).focus_handle(cx).is_focused(window);
    let target = state.clone();
    frame(id, focused, cx)
        .min_h(rems(6.))
        .py(rems(0.4375))
        .on_mouse_down(MouseButton::Left, move |_, window, cx| {
            target.update(cx, |state, cx| state.focus(window, cx));
        })
        .child(Textarea::new(state))
}

/// Numeric editing with native arrow-key stepping and paired step buttons.
pub fn number_input(state: &Entity<InputState>, cx: &mut App) -> gpui_kit::base::NumberInput {
    use gpui_kit::ParentElement as _;
    let t = cx.omarchy().clone();
    state.update(cx, |state, cx| {
        state.set_editor_style(t.input_style());
        state.set_text_align(gpui_kit::TextAlign::Center, cx);
    });
    let minus = t.clone();
    gpui_kit::base::NumberInput::new(state)
        .w(rems(7.5))
        .h(rems(1.75))
        .flex()
        .items_center()
        .border_1()
        .rounded_none()
        .border_color(t.control_border())
        .bg(t.normal_fill())
        .text_color(t.foreground)
        .font_family(t.font.clone())
        .text_size(rems(0.75))
        .input(
            gpui_kit::div()
                .flex_1()
                .min_w_0()
                .px(rems(0.625))
                .child(BaseInput::new(state)),
        )
        .decrement_button(move |button| {
            button
                .w(rems(1.75))
                .h_full()
                .text_color(minus.foreground)
                .bg(minus.surface)
                .hover(|s| s.bg(minus.selection))
                .child(crate::icon(crate::IconName::Minus).size(rems(0.75)))
        })
        .increment_button(move |button| {
            button
                .w(rems(1.75))
                .h_full()
                .text_color(t.foreground)
                .bg(t.surface)
                .hover(|s| s.bg(t.selection))
                .child(crate::icon(crate::IconName::Plus).size(rems(0.75)))
        })
}

#[cfg(test)]
mod tests {
    use super::*;
    use gpui_kit::{Context, Modifiers, Render, TestAppContext, prelude::*};

    struct Harness(Entity<InputState>);

    impl Render for Harness {
        fn render(&mut self, window: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
            input("price", &self.0, window, cx)
                .debug_selector(|| "price-frame".into())
                .w(rems(15.))
                .prefix(div().debug_selector(|| "price-prefix".into()).child("$"))
                .suffix(div().debug_selector(|| "price-suffix".into()).child("USD"))
        }
    }

    #[gpui_kit::test]
    fn input_and_affixes_scale_with_the_window_rem(cx: &mut TestAppContext) {
        cx.update(crate::init);
        let (view, cx) = cx.add_window_view(|window, cx| {
            Harness(cx.new(|cx| InputState::new(window, cx).default_value("181.170")))
        });
        let mut previous_suffix_width = gpui_kit::Pixels::ZERO;
        for rem_size in [16., 20., 24.] {
            cx.update(|window, cx| {
                window.set_rem_size(gpui_kit::px(rem_size));
                view.update(cx, |_, cx| cx.notify());
                window.draw(cx).clear(cx);
            });
            let frame = cx.debug_bounds("price-frame").unwrap();
            let prefix = cx.debug_bounds("price-prefix").unwrap();
            let suffix = cx.debug_bounds("price-suffix").unwrap();
            assert_eq!(frame.size.width, gpui_kit::px(15. * rem_size));
            assert!(suffix.size.width > previous_suffix_width);
            assert!(prefix.right() < suffix.left());
            assert!(suffix.right() < frame.right());
            previous_suffix_width = suffix.size.width;
        }
    }

    #[gpui_kit::test]
    fn affixes_preserve_editing_and_focus(cx: &mut TestAppContext) {
        cx.update(crate::init);
        let (view, cx) =
            cx.add_window_view(|window, cx| Harness(cx.new(|cx| InputState::new(window, cx))));
        cx.update(|window, cx| window.draw(cx).clear(cx));
        let prefix = cx.debug_bounds("price-prefix").unwrap();
        let suffix = cx.debug_bounds("price-suffix").unwrap();
        assert!(prefix.right() < suffix.left());
        cx.simulate_click(suffix.center(), Modifiers::default());
        cx.update(|window, cx| {
            assert!(view.read(cx).0.read(cx).focus_handle(cx).is_focused(window));
        });
        cx.simulate_input("181.170");
        cx.update(|_, cx| {
            assert_eq!(view.read(cx).0.read(cx).value().as_ref(), "181.170");
        });
    }
}
