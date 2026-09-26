//! The switch track and knob, animated the way `ToggleSwitch.qml` animates them:
//! fills fade over 120ms and the knob slides over 120ms on an out-cubic curve.
use crate::ActiveTheme;
use crate::motion::{CONTROL_COLOR, SWITCH_TRAVEL, color, out_cubic};
use gpui_kit::base::motion::transition;
use gpui_kit::base::{SwitchThumb, SwitchTrack};
use gpui_kit::{
    App, ElementId, InteractiveElement, IntoElement, ParentElement, RenderOnce, Styled, Window,
    div, rems,
};

/// Knob travel from off to on: track width minus padding, border and knob.
const KNOB_TRAVEL: f32 = 1.25;

/// A switch's track and knob. Rendered inside the switch, so its motion state
/// is keyed within the switch's element scope.
#[derive(IntoElement)]
pub(crate) struct SwitchMotion {
    id: ElementId,
    checked: bool,
}

impl SwitchMotion {
    pub(crate) fn new(id: ElementId, checked: bool) -> Self {
        Self { id, checked }
    }
}

impl RenderOnce for SwitchMotion {
    fn render(self, window: &mut Window, cx: &mut App) -> impl IntoElement {
        let t = cx.omarchy().clone();
        let checked = self.checked;
        let fade = color(CONTROL_COLOR);
        let track_bg = transition(
            "omarchy-switch-track-bg",
            if checked {
                t.selected_fill()
            } else {
                t.normal_fill()
            },
            fade.clone(),
            window,
            cx,
        );
        let track_border = transition(
            "omarchy-switch-track-border",
            if checked {
                t.foreground.opacity(0.)
            } else {
                t.control_border()
            },
            fade.clone(),
            window,
            cx,
        );
        let thumb_bg = transition(
            "omarchy-switch-thumb-bg",
            if checked { t.foreground } else { t.secondary },
            fade,
            window,
            cx,
        );
        let travel = transition(
            "omarchy-switch-thumb-x",
            if checked { 1f32 } else { 0. },
            out_cubic(SWITCH_TRAVEL),
            window,
            cx,
        );
        let id = self.id;
        SwitchTrack::new(id.clone())
            .checked(checked)
            .w(rems(2.625))
            .h(rems(1.375))
            .flex_shrink_0()
            .p(rems(0.125))
            .border_1()
            .border_color(track_border)
            .rounded_none()
            .bg(track_bg)
            .child(
                SwitchThumb::new(checked)
                    .size(rems(1.))
                    .rounded_none()
                    .bg(thumb_bg)
                    .ml(rems(KNOB_TRAVEL * travel))
                    .child(
                        div()
                            .size_full()
                            .debug_selector(move || format!("omarchy-switch-thumb-{id}")),
                    ),
            )
    }
}

#[cfg(test)]
mod tests {
    use gpui_kit::{Context, Render, TestAppContext, VisualTestContext, prelude::*};
    use std::time::Duration;

    struct Harness {
        checked: bool,
    }

    impl Render for Harness {
        fn render(
            &mut self,
            _: &mut gpui_kit::Window,
            cx: &mut Context<Self>,
        ) -> impl gpui_kit::IntoElement {
            crate::focus_scope("switch-test")
                .size_full()
                .child(crate::switch("wifi", "Wi-Fi", self.checked, cx))
        }
    }

    fn thumb_x(cx: &mut VisualTestContext) -> f32 {
        cx.update(|window, cx| window.draw(cx).clear(cx));
        cx.debug_bounds("omarchy-switch-thumb-wifi")
            .unwrap()
            .origin
            .x
            .as_f32()
    }

    fn toggle(view: &gpui_kit::Entity<Harness>, cx: &mut VisualTestContext) {
        cx.update(|_, cx| {
            view.update(cx, |harness, cx| {
                harness.checked = !harness.checked;
                cx.notify();
            })
        });
    }

    #[gpui_kit::test]
    fn knob_slides_to_on_over_the_switch_travel(cx: &mut TestAppContext) {
        cx.update(crate::init);
        let (view, cx) = cx.add_window_view(|_, _| Harness { checked: false });
        let off = thumb_x(cx);

        toggle(&view, cx);
        assert_eq!(thumb_x(cx), off, "the first frame starts from rest");
        cx.executor().advance_clock(Duration::from_millis(40));
        let midway = thumb_x(cx);
        cx.executor().advance_clock(Duration::from_millis(200));
        let on = thumb_x(cx);

        assert!(on > off);
        assert!(off < midway && midway < on, "{off} < {midway} < {on}");
        // Out-cubic covers most of the distance early.
        assert!(midway - off > (on - off) / 3.);
    }

    #[gpui_kit::test]
    fn reduced_motion_snaps_the_knob(cx: &mut TestAppContext) {
        cx.update(|cx| {
            crate::init(cx);
            cx.set_reduce_motion(true);
        });
        let (view, cx) = cx.add_window_view(|_, _| Harness { checked: false });
        let off = thumb_x(cx);
        toggle(&view, cx);
        let on = thumb_x(cx);
        assert!(on > off);
        cx.executor().advance_clock(Duration::from_millis(200));
        assert_eq!(thumb_x(cx), on);
    }
}
