//! Button presentation that suppresses transient styles while disabled.
use gpui_kit::base::motion::transition;
use gpui_kit::base::{ButtonStyles, RoleOverride};
use gpui_kit::{
    AnyElement, App, ClickEvent, ElementId, Fill, FocusHandle, Hsla, InteractiveElement,
    Interactivity, IntoElement, MouseButton, ParentElement, RenderOnce, SharedString,
    StatefulInteractiveElement, StyleRefinement, Styled, Window,
};
use std::{rc::Rc, time::Duration};

type HoverListener = Rc<dyn Fn(&bool, &mut Window, &mut App)>;

/// An Omarchy button backed by gpui-base's activation and focus behavior.
/// Transient styles are applied only after the final disabled state is known.
///
/// Like the shell's `Button.qml`, the fill eases between states over 120ms;
/// borders and text change at once.
#[derive(IntoElement)]
pub struct Button {
    id: ElementId,
    base: gpui_kit::base::Button,
    disabled: bool,
    selected: bool,
    selected_fill: Option<Hsla>,
    fill_duration: Duration,
    focus: Option<FocusHandle>,
    on_hover: Option<HoverListener>,
    hover: Option<Box<StyleRefinement>>,
    active: Option<Box<StyleRefinement>>,
    focus_visible: Option<Box<StyleRefinement>>,
}

/// The pointer state the fill follows, kept per button across frames.
#[derive(Default)]
struct PointerState {
    hovered: bool,
    pressed: bool,
}

impl Button {
    pub fn new(id: impl Into<ElementId>) -> Self {
        let id = id.into();
        Self {
            base: gpui_kit::base::Button::new(id.clone()),
            id,
            disabled: false,
            selected: false,
            selected_fill: None,
            fill_duration: crate::motion::CONTROL_COLOR,
            focus: None,
            on_hover: None,
            hover: None,
            active: None,
            focus_visible: None,
        }
    }

    /// The fill while selected. Unlike a `styles` selected refinement, it
    /// takes part in the fill transition.
    pub(crate) fn selected_fill(mut self, fill: Hsla) -> Self {
        self.selected_fill = Some(fill);
        self
    }

    /// How long the fill takes to reach a new state.
    pub(crate) fn fill_duration(mut self, duration: Duration) -> Self {
        self.fill_duration = duration;
        self
    }

    pub fn disabled(mut self, disabled: bool) -> Self {
        self.disabled = disabled;
        self.base = self.base.disabled(disabled);
        self
    }

    pub fn selected(mut self, selected: bool) -> Self {
        self.selected = selected;
        self.base = self.base.selected(selected);
        self
    }

    pub fn styles(mut self, build: impl FnOnce(ButtonStyles) -> ButtonStyles) -> Self {
        self.base = self.base.styles(build);
        self
    }

    pub fn accessibility_label(mut self, label: impl Into<SharedString>) -> Self {
        self.base = self.base.accessibility_label(label);
        self
    }

    pub fn role(mut self, role: impl Into<RoleOverride>) -> Self {
        self.base = self.base.role(role);
        self
    }

    pub fn track_focus(mut self, focus: &FocusHandle) -> Self {
        self.focus = Some(focus.clone());
        self.base = self.base.track_focus(focus);
        self
    }

    pub fn tab_index(mut self, index: isize) -> Self {
        self.base = self.base.tab_index(index);
        self
    }

    pub fn tab_stop(mut self, tab_stop: bool) -> Self {
        self.base = self.base.tab_stop(tab_stop);
        self
    }

    pub fn focusable(mut self, focusable: bool) -> Self {
        self.base = self.base.focusable(focusable);
        self
    }

    pub fn on_click(
        mut self,
        handler: impl Fn(&ClickEvent, &mut Window, &mut App) + 'static,
    ) -> Self {
        self.base = self.base.on_click(handler);
        self
    }
}

impl gpui_kit::base::Selectable for Button {
    fn selected(self, selected: bool) -> Self {
        Button::selected(self, selected)
    }

    fn is_selected(&self) -> bool {
        self.base.is_selected()
    }
}

impl Styled for Button {
    fn style(&mut self) -> &mut StyleRefinement {
        self.base.style()
    }
}

impl ParentElement for Button {
    fn extend(&mut self, elements: impl IntoIterator<Item = AnyElement>) {
        self.base.extend(elements);
    }
}

impl InteractiveElement for Button {
    fn interactivity(&mut self) -> &mut Interactivity {
        self.base.interactivity()
    }

    fn hover(mut self, build: impl FnOnce(StyleRefinement) -> StyleRefinement) -> Self {
        self.hover = Some(Box::new(build(StyleRefinement::default())));
        self
    }
    fn focus_visible(mut self, build: impl FnOnce(StyleRefinement) -> StyleRefinement) -> Self {
        self.focus_visible = Some(Box::new(build(StyleRefinement::default())));
        self
    }
}

impl StatefulInteractiveElement for Button {
    /// Chained with the listener that drives the fill transition.
    fn on_hover(mut self, listener: impl Fn(&bool, &mut Window, &mut App) + 'static) -> Self {
        self.on_hover = Some(Rc::new(listener));
        self
    }

    fn active(mut self, build: impl FnOnce(StyleRefinement) -> StyleRefinement) -> Self {
        self.active = Some(Box::new(build(StyleRefinement::default())));
        self
    }
}

/// The solid color of a refinement's background, if it sets one.
fn solid(style: &StyleRefinement) -> Option<Hsla> {
    style
        .background
        .as_ref()
        .and_then(Fill::color)
        .and_then(|background| background.as_solid())
}

impl RenderOnce for Button {
    fn render(mut self, window: &mut Window, cx: &mut App) -> impl IntoElement {
        let focus = self.focus.clone().unwrap_or_else(|| {
            window
                .use_keyed_state((self.id.clone(), "omarchy-focus"), cx, |_, cx| {
                    cx.focus_handle()
                })
                .read(cx)
                .clone()
        });
        let pointer = window.use_keyed_state((self.id.clone(), "omarchy-pointer"), cx, |_, _| {
            PointerState::default()
        });

        // The fill for the current state, in the shell's precedence: pressed,
        // keyboard focus, hover, selected, rest. A gradient fill is left to the
        // instant state styles.
        let rest = match self.base.style().background.as_ref() {
            Some(_) => solid(self.base.style()),
            None => Some(gpui_kit::transparent_black()),
        };
        let fill = rest.map(|rest| {
            let state = pointer.read(cx);
            let focus_visible = focus.is_focused(window) && window.last_input_was_keyboard();
            let transient = |style: &Option<Box<StyleRefinement>>| style.as_deref().and_then(solid);
            let target = if self.disabled {
                None
            } else if state.pressed {
                transient(&self.active)
            } else if focus_visible {
                transient(&self.focus_visible)
            } else if state.hovered {
                transient(&self.hover)
            } else {
                None
            }
            .or(self.selected.then_some(self.selected_fill).flatten())
            .unwrap_or(rest);
            transition(
                (self.id.clone(), "omarchy-fill"),
                target,
                crate::motion::color(self.fill_duration),
                window,
                cx,
            )
        });
        #[cfg(test)]
        if let Some(fill) = fill {
            tests::record_fill(&self.id, fill);
        }

        let mut base = self.base;
        if self.focus.is_none() {
            base = base.track_focus(&focus);
        }
        if let Some(fill) = fill {
            // Every state paints the sampled fill, so GPUI's instant state
            // styles keep their borders but cannot jump the background.
            base = base.bg(fill);
            for style in [&mut self.hover, &mut self.active, &mut self.focus_visible]
                .into_iter()
                .flatten()
            {
                if style.background.is_some() {
                    style.background = Some(fill.into());
                }
            }
        }
        if !self.disabled {
            if let Some(style) = self.hover {
                base = base.hover(|_| *style);
            }
            if let Some(style) = self.active {
                base = base.active(|_| *style);
            }
            if let Some(style) = self.focus_visible {
                base = base.focus_visible(|_| *style);
            }
            let on_hover = self.on_hover;
            let hover_state = pointer.clone();
            let down_state = pointer.clone();
            let up_state = pointer.clone();
            let out_state = pointer;
            base = base
                .on_hover(move |hovered, window, cx| {
                    hover_state.update(cx, |state, cx| {
                        state.hovered = *hovered;
                        cx.notify();
                    });
                    if let Some(on_hover) = on_hover.as_ref() {
                        on_hover(hovered, window, cx);
                    }
                })
                .on_mouse_down(MouseButton::Left, move |_, _, cx| {
                    down_state.update(cx, |state, cx| {
                        state.pressed = true;
                        cx.notify();
                    });
                })
                .on_mouse_up(MouseButton::Left, move |_, _, cx| {
                    up_state.update(cx, |state, cx| {
                        state.pressed = false;
                        cx.notify();
                    });
                })
                .on_mouse_up_out(MouseButton::Left, move |_, _, cx| {
                    out_state.update(cx, |state, cx| {
                        state.pressed = false;
                        cx.notify();
                    });
                });
        } else if let Some(on_hover) = self.on_hover {
            base = base.on_hover(move |hovered, window, cx| on_hover(hovered, window, cx));
        }
        base
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::ActiveTheme;
    use gpui_kit::px;
    use gpui_kit::rems;
    use gpui_kit::{Context, Modifiers, MouseButton, Render, TestAppContext, div, point};
    use std::{cell::RefCell, collections::HashMap};

    thread_local! {
        static FILLS: RefCell<HashMap<String, Hsla>> = RefCell::default();
    }

    /// The fill a button sampled on its last render.
    pub(super) fn record_fill(id: &ElementId, fill: Hsla) {
        FILLS.with(|fills| fills.borrow_mut().insert(id.to_string(), fill));
    }

    fn fill(id: &str) -> Hsla {
        FILLS.with(|fills| fills.borrow()[id])
    }

    #[gpui_kit::test]
    fn fill_eases_to_the_hover_state_and_back(cx: &mut TestAppContext) {
        cx.update(crate::init);
        struct Harness;
        impl Render for Harness {
            fn render(&mut self, _: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
                div().size(rems(25.)).child(
                    crate::button("fill", "Apply", crate::ButtonVariant::Secondary, cx)
                        .w(rems(6.25))
                        .h(rems(2.5)),
                )
            }
        }
        let (view, cx) = cx.add_window_view(|_, _| Harness);
        let redraw = |cx: &mut gpui_kit::VisualTestContext| {
            view.update(cx, |_, cx| cx.notify());
            cx.update(|window, cx| window.draw(cx).clear(cx));
        };
        redraw(cx);
        let (rest, hover) = cx.update(|_, cx| {
            let t = cx.omarchy();
            (t.foreground.opacity(0.), t.hover_fill())
        });
        assert_eq!(fill("fill").a, rest.a);

        cx.simulate_mouse_move(point(px(10.), px(10.)), None, Modifiers::default());
        redraw(cx);
        cx.executor()
            .advance_clock(crate::motion::CONTROL_COLOR / 2);
        redraw(cx);
        let halfway = fill("fill").a;
        assert!(rest.a < halfway && halfway < hover.a, "{halfway}");

        cx.executor().advance_clock(crate::motion::CONTROL_COLOR);
        redraw(cx);
        assert_eq!(fill("fill").a, hover.a);

        cx.simulate_mouse_move(point(px(300.), px(300.)), None, Modifiers::default());
        redraw(cx);
        cx.executor()
            .advance_clock(crate::motion::CONTROL_COLOR * 2);
        redraw(cx);
        assert_eq!(fill("fill").a, rest.a);
    }
    #[gpui_kit::test]
    fn disabled_button_suppresses_hover_and_pressed_geometry(cx: &mut TestAppContext) {
        cx.update(crate::init);
        struct States {
            disabled: bool,
            disabled_first: bool,
        }
        impl Render for States {
            fn render(&mut self, _: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
                let button = crate::button("button", "Apply", crate::ButtonVariant::Primary, cx)
                    .w(rems(6.25))
                    .h(rems(2.5));
                let button = if self.disabled_first {
                    button
                        .disabled(self.disabled)
                        .hover(|s| s.w(rems(10.)))
                        .active(|s| s.w(rems(12.5)))
                } else {
                    button
                        .hover(|s| s.w(rems(10.)))
                        .active(|s| s.w(rems(12.5)))
                        .disabled(self.disabled)
                };
                div()
                    .size(rems(25.))
                    .child(button.debug_selector(|| "state-button".into()))
            }
        }
        for disabled_first in [false, true] {
            let (view, cx) = cx.add_window_view(move |_, _| States {
                disabled: true,
                disabled_first,
            });
            cx.update(|window, cx| window.draw(cx).clear(cx));
            let position = point(px(10.), px(10.));
            cx.simulate_mouse_move(position, None, Modifiers::default());
            cx.update(|window, cx| window.draw(cx).clear(cx));
            assert_eq!(
                cx.debug_bounds("state-button").unwrap().size.width,
                px(100.)
            );
            cx.simulate_mouse_down(position, MouseButton::Left, Modifiers::default());
            cx.update(|window, cx| window.draw(cx).clear(cx));
            assert_eq!(
                cx.debug_bounds("state-button").unwrap().size.width,
                px(100.)
            );
            cx.simulate_mouse_up(position, MouseButton::Left, Modifiers::default());
            view.update(cx, |this, cx| {
                this.disabled = false;
                cx.notify();
            });
            cx.update(|window, cx| window.draw(cx).clear(cx));
            cx.simulate_mouse_move(point(px(300.), px(300.)), None, Modifiers::default());
            cx.simulate_mouse_move(position, None, Modifiers::default());
            cx.update(|window, cx| window.draw(cx).clear(cx));
            assert_eq!(
                cx.debug_bounds("state-button").unwrap().size.width,
                px(160.)
            );
            cx.simulate_mouse_down(position, MouseButton::Left, Modifiers::default());
            cx.update(|window, cx| window.draw(cx).clear(cx));
            assert_eq!(
                cx.debug_bounds("state-button").unwrap().size.width,
                px(200.)
            );
            cx.simulate_mouse_up(position, MouseButton::Left, Modifiers::default());
        }
    }
}
