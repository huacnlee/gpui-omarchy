use crate::{ButtonVariant, IconName, button, calendar, icon};
use gpui::{
    App, Context, ElementId, Entity, FocusHandle, MouseButton, Window, div, prelude::*, px,
};
use gpui_base::{CalendarEvent, CalendarState, DatePicker, Popup};

pub struct DatePickerState {
    pub calendar: Entity<CalendarState>,
    focus: FocusHandle,
    open: bool,
}

impl DatePickerState {
    pub fn new(window: &mut Window, cx: &mut Context<Self>) -> Self {
        let calendar = cx.new(|cx| CalendarState::new(window, cx));
        cx.subscribe_in(
            &calendar,
            window,
            |this, _, event: &CalendarEvent, window, cx| {
                let CalendarEvent::Selected(date) = event;
                if date.is_complete() {
                    this.set_open(false, window, cx);
                }
            },
        )
        .detach();
        cx.observe(&calendar, |_, _, cx| cx.notify()).detach();
        Self {
            calendar,
            focus: cx.focus_handle(),
            open: false,
        }
    }

    pub fn is_open(&self) -> bool {
        self.open
    }

    fn set_open(&mut self, open: bool, window: &mut Window, cx: &mut Context<Self>) {
        self.open = open;
        if open {
            self.calendar
                .read(cx)
                .focus_handle
                .clone()
                .focus(window, cx);
        } else {
            self.focus.focus(window, cx);
        }
        cx.notify();
    }
}

pub(crate) fn init(cx: &mut App) {
    cx.bind_keys([
        gpui::KeyBinding::new(
            "enter",
            gpui_base::actions::Confirm { secondary: false },
            Some("OmarchyDatePicker"),
        ),
        gpui::KeyBinding::new(
            "space",
            gpui_base::actions::Confirm { secondary: false },
            Some("OmarchyDatePicker"),
        ),
        gpui::KeyBinding::new(
            "escape",
            gpui_base::actions::Cancel,
            Some("OmarchyDatePicker"),
        ),
    ]);
}

/// Controlled base date picker with a styled calendar popup and focus return.
pub fn date_picker(
    id: impl Into<ElementId>,
    state: &Entity<DatePickerState>,
    cx: &App,
) -> DatePicker {
    let id = id.into();
    let current = state.read(cx);
    let open = current.open;
    let focus = current.focus.clone();
    let label = current
        .calendar
        .read(cx)
        .date()
        .format("%b %e, %Y")
        .unwrap_or_else(|| "Choose a date".into());
    let target = state.clone();
    let trigger = button("date-trigger", "", ButtonVariant::Outline, cx)
        .track_focus(&focus)
        .accessibility_label("Choose a date")
        .debug_selector(|| "date-picker-trigger".into())
        .w_full()
        .justify_start()
        .child(div().flex_1().child(label))
        .child(icon(IconName::Calendar).size(px(14.)))
        .on_click(move |_, window, cx| {
            target.update(cx, |state, cx| state.set_open(!open, window, cx))
        });
    let mut popup = Popup::new((id.clone(), "popup"), trigger);
    if open {
        let target = state.clone();
        popup = popup.content(
            div()
                .id("date-calendar-popup")
                .key_context("OmarchyPopoverContent")
                .occlude()
                .mt(px(4.))
                .on_mouse_down_out(move |_, window, cx| {
                    target.update(cx, |state, cx| state.set_open(false, window, cx))
                })
                .on_mouse_down(MouseButton::Left, |_, _, cx| cx.stop_propagation())
                .child(calendar("date-calendar", &current.calendar, cx)),
        );
    }
    let target = state.clone();
    DatePicker::new(id, &focus)
        .open(open)
        .w(px(248.))
        .key_context("OmarchyDatePicker")
        .on_open_change(move |open, window, cx| {
            target.update(cx, |state, cx| state.set_open(open, window, cx))
        })
        .child(popup)
}
