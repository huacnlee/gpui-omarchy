//! Contextual controls in an anchored, non-modal surface.
use crate::ActiveTheme;
use crate::motion::{POPUP_FADE, out_cubic};
use gpui_kit::base::motion::Presence;
use gpui_kit::base::{Popover, PopoverState};
use gpui_kit::rems;
use gpui_kit::{App, Context, Div, ElementId, Window, div, prelude::*};

pub(crate) fn init(cx: &mut App) {
    // Suppress the outer Popover toggle bindings inside its content. Deeper
    // control contexts (Button, Input, Select) still retain their own bindings.
    cx.bind_keys([
        gpui_kit::KeyBinding::new("enter", gpui_kit::NoAction, Some("OmarchyPopoverContent")),
        gpui_kit::KeyBinding::new("space", gpui_kit::NoAction, Some("OmarchyPopoverContent")),
    ]);
}

/// An anchored control surface with base-owned open state, outside dismissal,
/// and focus return. The content builder runs with the current theme.
///
/// To customize the surface itself, use the returned Popover's `content` builder
/// and compose `popover_surface(cx)` with your own dimensions and children.
pub fn popover<E: IntoElement>(
    id: impl Into<ElementId>,
    trigger: impl gpui_kit::base::Selectable + IntoElement + 'static,
    content: impl FnOnce(&mut PopoverState, &mut Window, &mut Context<PopoverState>) -> E + 'static,
) -> Popover {
    let id = id.into();
    Popover::new(id.clone())
        .trigger(trigger)
        .content(move |state, window, cx| {
            let body = content(state, window, cx);
            let opacity = popup_fade(&id, window, cx);
            div()
                .key_context("OmarchyPopoverContent")
                .opacity(opacity)
                .child(popover_surface(cx).child(body))
        })
}

/// The opacity of a popup card fading in, as `PopupCard.qml` does when it opens.
///
/// Base unmounts popover and hover card content the moment they close, so the
/// card fades in only; its fade-out would need Base to keep closing content
/// mounted. The fade state lives only while the content renders, so every
/// opening starts from transparent.
pub(crate) fn popup_fade(id: &ElementId, window: &mut Window, cx: &mut App) -> f32 {
    let fade_id = ElementId::NamedChild(id.clone().into(), "omarchy-popup-fade".into());
    let sample = Presence::new(fade_id, true)
        .transition(out_cubic(POPUP_FADE))
        .sample(window, cx);
    #[cfg(test)]
    tests::LAST_FADE.with(|fade| fade.set(sample.progress));
    sample.progress
}

/// Omarchy popup chrome. Content remains free to use forms, rows, and actions.
pub fn popover_surface(cx: &App) -> Div {
    let t = cx.omarchy();
    div()
        .flex()
        .flex_col()
        .gap(rems(0.875))
        .w(rems(17.5))
        .max_w(gpui_kit::relative(1.))
        .p(rems(0.875))
        .border_1()
        .rounded_none()
        .border_color(t.border)
        .bg(t.background)
        .text_color(t.foreground)
        .font_family(t.font.clone())
        .text_size(rems(0.75))
}

#[cfg(test)]
mod tests {
    use super::*;
    use gpui_kit::{FocusHandle, Render, TestAppContext};
    use std::cell::Cell;

    thread_local! {
        /// The last opacity [`popup_fade`] sampled on this test thread.
        pub(super) static LAST_FADE: Cell<f32> = const { Cell::new(-1.) };
    }
    struct Harness {
        trigger: FocusHandle,
        checked: bool,
        checkbox_focus: FocusHandle,
    }
    impl Render for Harness {
        fn render(&mut self, _: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
            let target = cx.entity();
            crate::focus_scope("root").size_full().child(popover(
                "options",
                crate::button(
                    "trigger",
                    "Display options",
                    crate::ButtonVariant::Secondary,
                    cx,
                )
                .track_focus(&self.trigger),
                move |_, _, cx| {
                    let checked = target.read(cx).checked;
                    let checkbox_focus = target.read(cx).checkbox_focus.clone();
                    div()
                        .debug_selector(|| "test-popover-content".into())
                        .child(
                            crate::checkbox(
                                "hidden",
                                "Show hidden files",
                                if checked {
                                    gpui_kit::base::CheckboxState::Checked
                                } else {
                                    gpui_kit::base::CheckboxState::Unchecked
                                },
                                cx,
                            )
                            .track_focus(&checkbox_focus)
                            .on_change(move |value, _, _, cx| {
                                target.update(cx, |state, cx| {
                                    state.checked = value == gpui_kit::base::CheckboxState::Checked;
                                    cx.notify();
                                })
                            }),
                        )
                },
            ))
        }
    }
    #[gpui_kit::test]
    fn keyboard_edits_popup_without_closing_then_escape_restores_focus(cx: &mut TestAppContext) {
        cx.update(crate::init);
        let (view, cx) = cx.add_window_view(|_, cx| Harness {
            trigger: cx.focus_handle(),
            checked: false,
            checkbox_focus: cx.focus_handle(),
        });
        cx.update(|window, cx| {
            view.read(cx).trigger.clone().focus(window, cx);
            window.draw(cx).clear(cx);
        });
        cx.simulate_keystrokes("enter");
        cx.update(|window, cx| {
            window.draw(cx).clear(cx);
        });
        assert!(cx.debug_bounds("test-popover-content").is_some());
        cx.simulate_keystrokes("tab");
        cx.update(|window, cx| {
            window.draw(cx).clear(cx);
        });
        cx.update(|window, cx| {
            assert!(
                view.read(cx).checkbox_focus.is_focused(window),
                "Tab should focus checkbox"
            )
        });
        let keystroke = gpui_kit::Keystroke::parse("space").unwrap();
        cx.simulate_event(gpui_kit::KeyDownEvent {
            keystroke: keystroke.clone(),
            is_held: false,
            prefer_character_input: false,
        });
        cx.simulate_event(gpui_kit::KeyUpEvent { keystroke });
        cx.update(|window, cx| {
            window.draw(cx).clear(cx);
            assert!(view.read(cx).checked);
        });
        assert!(
            cx.debug_bounds("test-popover-content").is_some(),
            "editing does not dismiss the popup"
        );
        cx.simulate_keystrokes("escape");
        cx.update(|window, cx| {
            window.draw(cx).clear(cx);
            assert!(view.read(cx).trigger.is_focused(window));
        });
        assert!(cx.debug_bounds("test-popover-content").is_none());
    }

    #[gpui_kit::test]
    fn opening_fades_the_card_in_and_every_opening_starts_transparent(cx: &mut TestAppContext) {
        cx.update(crate::init);
        let (view, cx) = cx.add_window_view(|_, cx| Harness {
            trigger: cx.focus_handle(),
            checked: false,
            checkbox_focus: cx.focus_handle(),
        });
        let draw = |cx: &mut gpui_kit::VisualTestContext| {
            cx.update(|window, cx| window.draw(cx).clear(cx));
            LAST_FADE.with(Cell::get)
        };
        cx.update(|window, cx| view.read(cx).trigger.clone().focus(window, cx));
        draw(cx);
        for _ in 0..2 {
            cx.simulate_keystrokes("enter");
            assert_eq!(draw(cx), 0., "an opening card starts transparent");
            cx.executor()
                .advance_clock(std::time::Duration::from_millis(50));
            let partway = draw(cx);
            assert!(partway > 0. && partway < 1., "fading in: {partway}");
            cx.executor()
                .advance_clock(std::time::Duration::from_millis(200));
            assert_eq!(draw(cx), 1., "the card settles opaque");
            cx.simulate_keystrokes("escape");
            draw(cx);
            assert!(cx.debug_bounds("test-popover-content").is_none());
        }
    }
}
