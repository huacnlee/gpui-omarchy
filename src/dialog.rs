//! Modal presentation built from gpui-base's dialog hosts and content slots.
use crate::ActiveTheme;
use gpui_kit::base::{
    AlertDialog, Dialog, DialogBackdrop, DialogDescription, DialogPopup, DialogTitle,
};
use gpui_kit::rems;
use gpui_kit::{App, FocusHandle, FontWeight, ParentElement, SharedString, Styled, rgb};

/// Supply a stable focus handle, focus it on opening, and restore trigger focus on close.
/// Base owns the focus trap, Escape, confirmation and backdrop dismissal.
pub fn dialog(focus: &FocusHandle, cx: &mut App) -> Dialog {
    Dialog::new(cx)
        .focus_handle(focus.clone())
        .flex()
        .items_center()
        .justify_center()
        .backdrop(dialog_backdrop())
}

/// An explicit decision: backdrop presses never dismiss this modal.
pub fn alert_dialog(focus: &FocusHandle, cx: &mut App) -> AlertDialog {
    // AlertDialog intentionally retains base's distinct accessibility role.
    AlertDialog::new(cx)
        .focus_handle(focus.clone())
        .backdrop(dialog_backdrop())
}

pub fn dialog_backdrop() -> DialogBackdrop {
    DialogBackdrop::new()
        .absolute()
        .size_full()
        .bg(gpui_kit::Hsla::from(rgb(0)).opacity(0.6))
}

/// A single edged surface. Content slots and peer actions go inside this popup.
pub fn dialog_popup(cx: &App) -> DialogPopup {
    let t = cx.omarchy();
    DialogPopup::new()
        .relative()
        .flex()
        .flex_col()
        .gap(rems(0.875))
        .w(rems(26.25))
        .max_w(gpui_kit::relative(1.))
        .p(rems(1.125))
        .border_1()
        .border_color(t.border)
        .rounded_none()
        .bg(t.background)
        .text_color(t.foreground)
        .font_family(t.font.clone())
        .text_size(rems(0.75))
}

pub fn dialog_title(title: impl Into<SharedString>, cx: &App) -> DialogTitle {
    DialogTitle::new()
        .text_size(rems(1.))
        .font_weight(FontWeight::BOLD)
        .text_color(cx.omarchy().foreground)
        .child(title.into())
}

pub fn dialog_description(text: impl Into<SharedString>, cx: &App) -> DialogDescription {
    DialogDescription::new()
        .text_color(cx.omarchy().secondary)
        .child(text.into())
}

/// Outline actions for modal footers; semantic emphasis lives in the edge and label.
pub fn dialog_button(
    id: impl Into<gpui_kit::ElementId>,
    label: impl Into<SharedString>,
    variant: crate::ButtonVariant,
    cx: &App,
) -> crate::Button {
    let t = cx.omarchy();
    let color = match variant {
        crate::ButtonVariant::Primary => t.accent,
        crate::ButtonVariant::Outline | crate::ButtonVariant::Secondary => t.foreground,
        crate::ButtonVariant::Danger => t.danger,
    };
    crate::button(id, label, variant, cx)
        .bg(t.foreground.opacity(0.))
        .border_color(if variant == crate::ButtonVariant::Secondary {
            t.control_border()
        } else {
            color
        })
        .text_color(color)
}
