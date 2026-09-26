//! Horizontal single-value and range sliders with native pointer interaction.
//!
//! Following `PanelSlider.qml`, the fill and knobs glide to a value set by the
//! keyboard or the application, but track the pointer exactly while it is
//! pressed; a hot knob grows slightly.
use crate::ActiveTheme;
use crate::motion::{SLIDER_KNOB_SCALE, SLIDER_TRAVEL, out_cubic};
use gpui_kit::base::motion::{Transition, transition};
use gpui_kit::base::{
    Slider, SliderIndicator, SliderThumb, SliderTrack,
    slider::{SliderEvent, SliderState, SliderValue},
};
use gpui_kit::rems;
use gpui_kit::{
    App, ElementId, Entity, FocusHandle, KeyDownEvent, MouseButton, Window, div, prelude::*,
    relative,
};
use std::time::Duration;

/// The knob's scale while hovered or pressed (`PanelSlider.qml`).
const HOT_KNOB_SCALE: f32 = 1.15;
/// The knob's resting size, in rems.
const KNOB_SIZE: f32 = 1.;
/// The knob's vertical center within the 1.75rem slider, in rems.
const KNOB_CENTER: f32 = 0.875;

/// Compose themed base parts. Pass disabled here so both track and thumbs are inert.
/// The returned base Slider remains available for layout/style customization.
pub fn slider(
    state: &Entity<SliderState>,
    disabled: bool,
    window: &mut Window,
    cx: &mut App,
) -> Slider {
    let t = cx.omarchy().clone();
    let id = state.entity_id();
    let target_percentage = state.read(cx).percentage();
    let range = state.read(cx).value().is_range();
    // Base keeps its drag flag private, so the slider records its own: set when
    // the pointer presses the track or a knob, cleared when it is released.
    let pointer = window
        .use_keyed_state(("omarchy-slider-pointer", id), cx, |_, _| false)
        .clone();
    let travel = if *pointer.read(cx) {
        Transition::new(Duration::ZERO)
    } else {
        out_cubic(SLIDER_TRAVEL)
    };
    let percentage = transition(
        ElementId::from(("omarchy-slider-start", id)),
        target_percentage.start,
        travel.clone(),
        window,
        cx,
    )
        ..transition(
            ElementId::from(("omarchy-slider-end", id)),
            target_percentage.end,
            travel,
            window,
            cx,
        );
    let press = pointer.clone();
    let release = pointer.clone();
    let release_out = pointer.clone();
    let mut track = SliderTrack::new(state)
        .disabled(disabled)
        .relative()
        .size_full()
        .when(!disabled, |track| {
            track
                .on_mouse_down(MouseButton::Left, move |_, _, cx| {
                    press.update(cx, |pressed, _| *pressed = true)
                })
                .on_mouse_up(MouseButton::Left, move |_, _, cx| {
                    release.update(cx, |pressed, _| *pressed = false)
                })
                .on_mouse_up_out(MouseButton::Left, move |_, _, cx| {
                    release_out.update(cx, |pressed, _| *pressed = false)
                })
        })
        .child(
            SliderIndicator::new(state)
                .absolute()
                .top(rems(0.75))
                .w_full()
                .h(rems(0.25))
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
        let edge = if start { "start" } else { "end" };
        let hovered = window
            .use_keyed_state(
                (ElementId::from(("omarchy-slider-hover", id)), edge),
                cx,
                |_, _| false,
            )
            .clone();
        let hot = !disabled && (*hovered.read(cx) || *pointer.read(cx));
        let scale = transition(
            (ElementId::from(("omarchy-slider-knob", id)), edge),
            if hot { HOT_KNOB_SCALE } else { 1. },
            out_cubic(SLIDER_KNOB_SCALE),
            window,
            cx,
        );
        // Grow around the knob's center so neither the track nor the knob's
        // position shifts.
        let size = KNOB_SIZE * scale;
        let target = state.clone();
        let pointer_focus: FocusHandle = focus.clone();
        let knob_press = pointer.clone();
        track = track.child(
            SliderThumb::new(state)
                .start(start)
                .disabled(disabled)
                .absolute()
                .top(rems(KNOB_CENTER - size / 2.))
                .left(relative(if start {
                    percentage.start
                } else {
                    percentage.end
                }))
                .ml(rems(-size / 2.))
                .size(rems(size))
                .debug_selector(move || format!("omarchy-slider-thumb-{edge}"))
                .border_2()
                .border_color(t.accent)
                .bg(t.background)
                .when(!disabled, |thumb| {
                    thumb
                        .track_focus(&focus)
                        .hover(|s| s.bg(t.selection))
                        .focus_visible(|s| s.bg(t.accent).border_color(t.bright))
                        .on_hover(move |hover, _, cx| {
                            hovered.update(cx, |hovered, cx| {
                                *hovered = *hover;
                                cx.notify();
                            })
                        })
                        .on_mouse_down(MouseButton::Left, move |_, window, cx| {
                            knob_press.update(cx, |pressed, _| *pressed = true);
                            pointer_focus.focus(window, cx)
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
        .h(rems(1.75))
        .px(rems(0.5))
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
    use gpui_kit::{Context, Modifiers, Render, TestAppContext, point, px};

    struct Harness {
        state: Entity<SliderState>,
    }
    impl Render for Harness {
        fn render(&mut self, window: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
            div()
                .w(px(216.))
                .child(slider(&self.state, false, window, cx))
        }
    }

    fn knob_center(cx: &mut gpui_kit::VisualTestContext) -> f32 {
        cx.update(|window, cx| window.draw(cx).clear(cx));
        let bounds = cx.debug_bounds("omarchy-slider-thumb-end").unwrap();
        bounds.center().x.as_f32()
    }

    #[gpui_kit::test]
    fn set_values_glide_but_pointer_presses_track_exactly(cx: &mut TestAppContext) {
        cx.update(crate::init);
        let state = cx.new(|_| SliderState::new().min(0.).max(100.).default_value(0.));
        let (_, cx) = cx.add_window_view(|_, _| Harness {
            state: state.clone(),
        });
        let rest = knob_center(cx);

        cx.update(|window, cx| state.update(cx, |state, cx| state.set_value(100., window, cx)));
        let start = knob_center(cx);
        cx.executor().advance_clock(SLIDER_TRAVEL / 2);
        let partway = knob_center(cx);
        cx.executor().advance_clock(SLIDER_TRAVEL);
        let settled = knob_center(cx);
        assert_eq!(start, rest, "the knob starts from where it was");
        assert!(
            partway > rest && partway < settled,
            "{rest} {partway} {settled}"
        );

        // A press on the track follows the pointer without gliding.
        let track = cx.debug_bounds("omarchy-slider-thumb-end").unwrap();
        let target = point(px(rest + (settled - rest) * 0.25), track.center().y);
        cx.simulate_mouse_down(target, MouseButton::Left, Modifiers::default());
        let pressed = knob_center(cx);
        assert!(
            (pressed - target.x.as_f32()).abs() < 2.,
            "{pressed} {:?}",
            target.x
        );
        // The pressed knob grows around its center.
        cx.executor().advance_clock(SLIDER_KNOB_SCALE * 2);
        assert!((knob_center(cx) - pressed).abs() < 0.5, "grows in place");
        let grown = cx
            .debug_bounds("omarchy-slider-thumb-end")
            .unwrap()
            .size
            .width;
        assert!(
            (grown.as_f32() - 16. * HOT_KNOB_SCALE).abs() < 0.5,
            "{grown:?}"
        );
        cx.simulate_mouse_up(target, MouseButton::Left, Modifiers::default());
        let released = knob_center(cx);
        assert!(
            (released - pressed).abs() < 0.5,
            "releasing does not move the knob"
        );
        // Still hot while hovered; it settles once the pointer leaves.
        cx.simulate_mouse_move(point(px(0.), px(200.)), None, Modifiers::default());
        knob_center(cx);
        cx.executor().advance_clock(SLIDER_KNOB_SCALE * 2);
        knob_center(cx);
        let rested = cx
            .debug_bounds("omarchy-slider-thumb-end")
            .unwrap()
            .size
            .width;
        assert_eq!(rested, px(16.));
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
