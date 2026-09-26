//! Omarchy's shell motion, restated for components.
//!
//! Each timing below is an `omarchy` 4.0.4 shell fact
//! (`/usr/share/omarchy/shell/Ui`). The shell animates a few state colors, the
//! switch knob, slider progress and popup cards; menus, dropdowns, tooltips,
//! dialogs and text fields change state instantly, so their components here do
//! too. Reduced motion is honored by gpui-base's samplers.
use gpui_kit::base::motion::Transition;
use std::time::Duration;

/// `Button.qml` and `ToggleSwitch.qml`: state colors.
pub(crate) const CONTROL_COLOR: Duration = Duration::from_millis(120);
/// `PanelActionButton.qml` and `CursorSurface.qml`: compact icon actions and cursor rows.
pub(crate) const CURSOR_COLOR: Duration = Duration::from_millis(60);
/// `ToggleSwitch.qml`: the knob sliding between off and on.
pub(crate) const SWITCH_TRAVEL: Duration = Duration::from_millis(120);
/// `PopupCard.qml` and `KeyboardPanel.qml`: a popup card fading in and out.
pub(crate) const POPUP_FADE: Duration = Duration::from_millis(140);
/// `PanelSlider.qml`: fill and knob following a value change that is not a drag.
pub(crate) const SLIDER_TRAVEL: Duration = Duration::from_millis(140);
/// `PanelSlider.qml`: the knob growing while hot.
pub(crate) const SLIDER_KNOB_SCALE: Duration = Duration::from_millis(110);

/// QML's `ColorAnimation` default: linear.
pub(crate) fn color(duration: Duration) -> Transition {
    Transition::new(duration).ease(|t| t)
}

/// `Easing.OutCubic`, the shell's curve for movement and fades.
pub(crate) fn out_cubic(duration: Duration) -> Transition {
    Transition::new(duration).ease(|t| 1. - (1. - t).powi(3))
}
