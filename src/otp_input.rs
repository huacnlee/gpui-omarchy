use crate::ActiveTheme;
use gpui::{App, Entity, Focusable, MouseButton, Window, div, prelude::*, px};
use gpui_base::{OtpInput, OtpState};

/// Numeric code entry with square cells. Base owns digit filtering and backspace.
pub fn otp_input(state: &Entity<OtpState>, window: &Window, cx: &App) -> OtpInput {
    let t = cx.omarchy();
    let value = state.read(cx);
    let digits: Vec<char> = value.value().chars().collect();
    let focused = value.focus_handle(cx).is_focused(window);
    let mut input = OtpInput::new(state).flex().gap(px(6.));
    for index in 0..value.len() {
        let target = state.clone();
        let current = focused && index == digits.len().min(value.len().saturating_sub(1));
        let character = digits
            .get(index)
            .map(|ch| if value.is_masked() { '•' } else { *ch });
        input = input.child(
            div()
                .w(px(32.))
                .h(px(36.))
                .flex()
                .items_center()
                .justify_center()
                .border_1()
                .rounded(px(0.))
                .border_color(if current {
                    t.accent
                } else {
                    t.control_border()
                })
                .bg(t.normal_fill())
                .font_family(t.font.clone())
                .text_size(px(16.))
                .text_color(t.foreground)
                .on_mouse_down(MouseButton::Left, move |_, window, cx| {
                    target.update(cx, |state, cx| state.focus(window, cx))
                })
                .child(character.map(|ch| ch.to_string()).unwrap_or_default()),
        );
    }
    input
}

#[cfg(test)]
mod tests {
    use super::*;
    use gpui::{Context, Render, TestAppContext};
    struct Harness {
        state: Entity<OtpState>,
    }
    impl Render for Harness {
        fn render(&mut self, window: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
            crate::focus_scope("otp-test")
                .size_full()
                .child(otp_input(&self.state, window, cx))
        }
    }
    #[gpui::test]
    fn otp_filters_digits_limits_length_and_backspaces(cx: &mut TestAppContext) {
        cx.update(crate::init);
        let (view, cx) = cx.add_window_view(|window, cx| Harness {
            state: cx.new(|cx| OtpState::new(6, window, cx)),
        });
        cx.update(|window, cx| {
            let state = view.read(cx).state.clone();
            state.update(cx, |state, cx| state.focus(window, cx));
            window.draw(cx).clear(cx);
        });
        cx.simulate_keystrokes("1 a 2 3 4 5 6 7");
        cx.update(|_, cx| assert_eq!(view.read(cx).state.read(cx).value().as_ref(), "123456"));
        cx.simulate_keystrokes("backspace 9");
        cx.update(|_, cx| assert_eq!(view.read(cx).state.read(cx).value().as_ref(), "123459"));
    }
}
