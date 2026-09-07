//! Horizontal single-value and range sliders with native pointer interaction.
use crate::ActiveTheme;
use gpui_kit::base::{
    Slider, SliderIndicator, SliderThumb, SliderTrack,
    slider::{SliderEvent, SliderState, SliderValue},
};
use gpui_kit::{
    App, Entity, FocusHandle, KeyDownEvent, MouseButton, Window, div, prelude::*, px, relative,
};

/// Compose themed base parts. Pass disabled here so both track and thumbs are inert.
/// The returned base Slider remains available for layout/style customization.
pub fn slider(
    state: &Entity<SliderState>,
    disabled: bool,
    window: &mut Window,
    cx: &mut App,
) -> Slider {
    let t = cx.omarchy().clone();
    let percentage = state.read(cx).percentage();
    let range = state.read(cx).value().is_range();
    let mut track = SliderTrack::new(state)
        .disabled(disabled)
        .relative()
        .size_full()
        .child(
            SliderIndicator::new(state)
                .absolute()
                .top(px(12.))
                .w_full()
                .h(px(4.))
                .bg(t.border)
                .child(
                    div()
                        .absolute()
                        .h_full()
                        .left(relative(percentage.start))
                        .right(relative(1. - percentage.end))
                        .bg(t.accent),
                ),
        );
    for start in [true, false] {
        if start && !range {
            continue;
        }
        let focus = window
            .use_keyed_state(
                (
                    gpui_kit::ElementId::from(("omarchy-slider-focus", state.entity_id())),
                    if start { "start" } else { "end" },
                ),
                cx,
                |_, cx| cx.focus_handle(),
            )
            .read(cx)
            .clone();
        let target = state.clone();
        let pointer_focus: FocusHandle = focus.clone();
        track = track.child(
            SliderThumb::new(state)
                .start(start)
                .disabled(disabled)
                .absolute()
                .top(px(6.))
                .left(relative(if start {
                    percentage.start
                } else {
                    percentage.end
                }))
                .ml(px(-8.))
                .size(px(16.))
                .border_2()
                .border_color(t.accent)
                .bg(t.background)
                .when(!disabled, |thumb| {
                    thumb
                        .track_focus(&focus)
                        .hover(|s| s.bg(t.selection))
                        .focus_visible(|s| s.bg(t.accent).border_color(t.bright))
                        // The base thumb stops bubbling presses to keep the
                        // track from jumping. Acquire focus before that handler.
                        .capture_any_mouse_down(move |event, window, cx| {
                            if event.button == MouseButton::Left {
                                pointer_focus.focus(window, cx);
                            }
                        })
                        .on_key_down(move |event: &KeyDownEvent, window, cx| {
                            if event.keystroke.modifiers.modified() {
                                return;
                            }
                            let key = event.keystroke.key.as_str();
                            if !matches!(
                                key,
                                "left" | "right" | "down" | "up" | "h" | "l" | "home" | "end"
                            ) {
                                return;
                            }
                            target.update(cx, |state, cx| {
                                let next = keyboard_value(
                                    state.value(),
                                    start,
                                    key,
                                    state.min_value(),
                                    state.max_value(),
                                    state.step_value(),
                                );
                                if next != state.value() {
                                    state.set_value(next, window, cx);
                                    cx.emit(SliderEvent::Change(next));
                                    cx.emit(SliderEvent::Release(next));
                                }
                            });
                            cx.stop_propagation();
                        })
                }),
        );
    }
    Slider::new(state)
        .disabled(disabled)
        .w_full()
        .h(px(28.))
        .px(px(8.))
        .when(disabled, |s| s.opacity(0.45))
        .child(track)
}

fn keyboard_value(
    value: SliderValue,
    start: bool,
    key: &str,
    min: f32,
    max: f32,
    step: f32,
) -> SliderValue {
    let (current, lower, upper) = match value {
        SliderValue::Single(value) => (value, min, max),
        SliderValue::Range(a, b) if start => (a, min, b),
        SliderValue::Range(a, b) => (b, a, max),
    };
    let next = match key {
        "home" => lower,
        "end" => upper,
        "left" | "down" | "h" => (current - step).max(lower),
        _ => (current + step).min(upper),
    };
    match value {
        SliderValue::Single(_) => SliderValue::Single(next),
        SliderValue::Range(_, b) if start => SliderValue::Range(next, b),
        SliderValue::Range(a, _) => SliderValue::Range(a, next),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[gpui_kit::test]
    fn clicking_a_thumb_gives_it_keyboard_focus(cx: &mut gpui_kit::TestAppContext) {
        cx.update(crate::init);
        struct Probe(Entity<SliderState>);
        impl gpui_kit::Render for Probe {
            fn render(
                &mut self,
                window: &mut Window,
                cx: &mut gpui_kit::Context<Self>,
            ) -> impl IntoElement {
                slider(&self.0, false, window, cx).w(px(200.))
            }
        }
        let (view, cx) = cx.add_window_view(|_, cx| {
            Probe(cx.new(|_| {
                SliderState::new()
                    .min(0.)
                    .max(100.)
                    .step(5.)
                    .default_value(50.)
            }))
        });
        cx.update(|window, cx| window.draw(cx).clear(cx));
        cx.simulate_click(gpui_kit::point(px(100.), px(14.)), Default::default());
        cx.update(|window, cx| window.draw(cx).clear(cx));
        cx.simulate_keystrokes("right");
        cx.update(|_, cx| assert_eq!(view.read(cx).0.read(cx).value(), SliderValue::Single(55.)));
    }

    #[test]
    fn keys_respect_endpoints_and_prevent_range_crossing() {
        assert_eq!(
            keyboard_value(SliderValue::Single(100.), false, "right", 0., 100., 5.),
            SliderValue::Single(100.)
        );
        assert_eq!(
            keyboard_value(SliderValue::Range(20., 30.), true, "end", 0., 100., 5.),
            SliderValue::Range(30., 30.)
        );
        assert_eq!(
            keyboard_value(SliderValue::Range(20., 30.), false, "home", 0., 100., 5.),
            SliderValue::Range(20., 20.)
        );
    }
}
