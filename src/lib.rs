//! Omarchy's presentation language on gpui-base's interaction primitives.
//!
//! Call [`init`] once, then use the constructors in [`controls`] and [`surface`]
//! inside `Render`. They return ordinary base elements with their builder APIs.
pub mod button_group;
pub mod calendar;
pub mod controls;
pub mod date_picker;
pub mod dialog;
pub mod dock;
pub mod focus;
pub mod hover_card;
pub mod icon;
pub mod input;
pub mod menu;
pub mod navigation;
pub mod otp_input;
pub mod popover;
pub mod resizable;
pub mod select;
pub mod slider;
pub mod surface;
mod system_theme;
pub mod table;
pub mod theme;
pub mod tooltip;
pub mod tree;

pub use button_group::{button_group, tab_list};
pub use calendar::calendar;
pub use controls::*;
pub use date_picker::{DatePickerState, date_picker};
pub use dialog::*;
pub use dock::dock_area;
pub use focus::focus_scope;
pub use hover_card::hover_card;
pub use icon::{IconName, icon};
pub use input::{editor, input, number_input, textarea};
pub use menu::{MenuItem, menu};
pub use navigation::*;
pub use otp_input::otp_input;
pub use popover::{popover, popover_surface};
pub use resizable::{resizable, resizable_panel};
pub use select::{ChoiceItem, ChoiceState, combobox, select};
pub use slider::slider;
pub use surface::*;
pub use system_theme::ThemeLoadError;
pub use table::*;
pub use theme::{ActiveTheme, Theme};
pub use tooltip::{tooltip, with_tooltip};
pub use tree::tree;

/// Initialize base behavior and the current Omarchy theme (Tokyo Night when unavailable).
pub fn init(cx: &mut gpui::App) {
    gpui_base::init(cx);
    focus::init(cx);
    button_group::init(cx);
    popover::init(cx);
    date_picker::init(cx);
    Theme::system_or_default().apply(cx);
}
