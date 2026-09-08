//! Styled constructors retain gpui-base's controlled-state builder APIs.
use crate::{ActiveTheme, Button, IconName, Link, icon};
use gpui_kit::base::{
    Checkbox, CheckboxIndicator, CheckboxState, Radio, Switch, SwitchThumb, SwitchTrack, Tab, Tabs,
    Toggle,
};
use gpui_kit::prelude::FluentBuilder;
use gpui_kit::rems;
use gpui_kit::{
    App, ElementId, FontWeight, InteractiveElement, ParentElement, SharedString,
    StatefulInteractiveElement, Styled, div,
};

#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub enum ButtonVariant {
    Primary,
    Outline,
    #[default]
    Secondary,
    Danger,
}

pub fn button(
    id: impl Into<ElementId>,
    label: impl Into<SharedString>,
    variant: ButtonVariant,
    cx: &App,
) -> Button {
    let t = cx.omarchy();
    let (bg, fg) = match variant {
        ButtonVariant::Primary => (t.foreground.opacity(0.), t.accent),
        ButtonVariant::Outline | ButtonVariant::Secondary => {
            (t.foreground.opacity(0.), t.foreground)
        }
        ButtonVariant::Danger => (t.foreground.opacity(0.), t.danger),
    };
    let interaction_border = if variant == ButtonVariant::Primary {
        t.accent
    } else {
        t.focus_border()
    };
    let label = label.into();
    Button::new(id)
        .accessibility_label(label.clone())
        .when(!label.is_empty(), |button| button.child(label))
        .py(rems(0.375))
        .px(rems(0.625))
        .gap(rems(0.5))
        .border_1()
        .rounded_none()
        .border_color(if variant == ButtonVariant::Primary {
            t.accent
        } else if variant == ButtonVariant::Outline {
            t.control_border()
        } else {
            t.foreground.opacity(0.)
        })
        .font_family(t.font.clone())
        .text_size(rems(0.75))
        .font_weight(FontWeight::NORMAL)
        .bg(bg)
        .text_color(fg)
        .hover(|s| s.bg(t.hover_fill()).border_color(interaction_border))
        .focus_visible(|s| s.bg(t.hover_fill()).border_color(interaction_border))
        .active(|s| s.bg(t.pressed_fill()))
        .styles(|s| {
            s.selected(|s| s.bg(t.selected_fill()))
                .disabled(|s| s.opacity(0.45))
        })
}

pub fn checkbox(
    id: impl Into<ElementId>,
    label: impl Into<SharedString>,
    state: CheckboxState,
    cx: &App,
) -> Checkbox {
    let t = cx.omarchy();
    let label = label.into();
    Checkbox::new(id)
        .state(state)
        .accessibility_label(label.clone())
        .flex()
        .items_center()
        .gap(rems(0.5))
        .min_h(rems(1.75))
        .px(rems(0.25))
        .border_1()
        .border_color(t.foreground.opacity(0.))
        .text_color(t.foreground)
        .font_family(t.font.clone())
        .text_size(rems(0.75))
        .child(
            CheckboxIndicator::new()
                .state(state)
                .size(rems(1.))
                .flex_shrink_0()
                .flex()
                .items_center()
                .justify_center()
                .rounded_none()
                .border_1()
                .border_color(t.control_border())
                .bg(t.normal_fill())
                .text_color(t.foreground)
                .styles(|s| {
                    s.checked(|s| {
                        s.bg(t.selected_fill())
                            .border_color(t.foreground.opacity(0.))
                    })
                    .indeterminate(|s| {
                        s.bg(t.selected_fill())
                            .border_color(t.foreground.opacity(0.))
                    })
                })
                .when(state != CheckboxState::Unchecked, |indicator| {
                    indicator.child(
                        icon(if state == CheckboxState::Checked {
                            IconName::Check
                        } else {
                            IconName::Minus
                        })
                        .size(rems(0.875))
                        .text_color(t.foreground),
                    )
                }),
        )
        .child(label)
        .hover(|s| s.bg(t.hover_fill()).border_color(t.focus_border()))
        .focus_visible(|s| s.bg(t.hover_fill()).border_color(t.focus_border()))
        .active(|s| s.bg(t.pressed_fill()))
        .styles(|s| s.disabled(|s| s.opacity(0.45)))
}

pub fn switch(
    id: impl Into<ElementId>,
    label: impl Into<SharedString>,
    checked: bool,
    cx: &App,
) -> Switch {
    let t = cx.omarchy();
    let id = id.into();
    let label = label.into();
    Switch::new(id.clone())
        .checked(checked)
        .accessibility_label(label.clone())
        .flex()
        .items_center()
        .gap(rems(0.5))
        .py(rems(0.3125))
        .px(rems(0.3125))
        .border_1()
        .border_color(t.foreground.opacity(0.))
        .text_color(t.foreground)
        .font_family(t.font.clone())
        .text_size(rems(0.75))
        .hover(|s| s.bg(t.hover_fill()).border_color(t.focus_border()))
        .focus_visible(|s| s.bg(t.hover_fill()).border_color(t.focus_border()))
        .active(|s| s.bg(t.pressed_fill()))
        .styles(|s| s.disabled(|s| s.opacity(0.45)))
        .child(
            SwitchTrack::new(id)
                .checked(checked)
                .w(rems(2.625))
                .h(rems(1.375))
                .flex_shrink_0()
                .p(rems(0.125))
                .border_1()
                .border_color(if checked {
                    t.foreground.opacity(0.)
                } else {
                    t.control_border()
                })
                .rounded_none()
                .bg(if checked {
                    t.selected_fill()
                } else {
                    t.normal_fill()
                })
                .child(
                    SwitchThumb::new(checked)
                        .size(rems(1.))
                        .rounded_none()
                        .bg(if checked { t.foreground } else { t.secondary })
                        .ml(rems(if checked { 1.25 } else { 0. })),
                ),
        )
        .child(label)
}

pub fn radio(
    id: impl Into<ElementId>,
    label: impl Into<SharedString>,
    checked: bool,
    cx: &App,
) -> Radio {
    let t = cx.omarchy();
    let label = label.into();
    Radio::new(id)
        .checked(checked)
        .accessibility_label(label.clone())
        .flex()
        .items_center()
        .gap(rems(0.5))
        .min_h(rems(1.75))
        .px(rems(0.25))
        .border_1()
        .border_color(t.foreground.opacity(0.))
        .text_color(t.foreground)
        .font_family(t.font.clone())
        .text_size(rems(0.75))
        .child(
            div()
                .size(rems(1.))
                .flex_shrink_0()
                .rounded_none()
                .border_1()
                .border_color(t.control_border())
                .flex()
                .items_center()
                .justify_center()
                .when(checked, |s| {
                    s.child(div().size(rems(0.5)).rounded_none().bg(t.foreground))
                }),
        )
        .child(label)
        .hover(|s| s.bg(t.hover_fill()).border_color(t.focus_border()))
        .focus_visible(|s| s.bg(t.hover_fill()).border_color(t.focus_border()))
        .active(|s| s.bg(t.pressed_fill()))
        .styles(|s| s.disabled(|s| s.opacity(0.45)))
}

pub fn toggle(
    id: impl Into<ElementId>,
    label: impl Into<SharedString>,
    pressed: bool,
    cx: &App,
) -> Toggle {
    let t = cx.omarchy();
    let label = label.into();
    Toggle::new(id)
        .pressed(pressed)
        .accessibility_label(label.clone())
        .flex()
        .items_center()
        .gap(rems(0.5))
        .py(rems(0.375))
        .px(rems(0.625))
        .border_1()
        .rounded_none()
        .border_color(t.border)
        .text_color(t.foreground)
        .font_family(t.font.clone())
        .text_size(rems(0.75))
        .font_weight(FontWeight::NORMAL)
        .child(label)
        .hover(|s| s.bg(t.hover_fill()).border_color(t.focus_border()))
        .focus_visible(|s| s.bg(t.hover_fill()).border_color(t.focus_border()))
        .active(|s| s.border_color(t.bright))
        .styles(|s| {
            s.pressed(|s| s.bg(t.selected_fill()))
                .disabled(|s| s.opacity(0.45))
        })
}

/// A multi-choice toolbar. Compose independent `toggle` children; each retains
/// its own keyboard focus and controlled pressed state.
pub fn toggle_group(id: impl Into<ElementId>, cx: &App) -> gpui_kit::base::ToggleGroup {
    let t = cx.omarchy();
    gpui_kit::base::ToggleGroup::new(id)
        .flex()
        .flex_wrap()
        .items_center()
        .gap(rems(0.375))
        .font_family(t.font.clone())
        .text_size(rems(0.75))
        .text_color(t.foreground)
}

pub fn link(
    id: impl Into<ElementId>,
    label: impl Into<SharedString>,
    href: impl Into<SharedString>,
    cx: &App,
) -> Link {
    let t = cx.omarchy();
    let label = label.into();
    Link::new(id)
        .href(href)
        .open_with(|url, _, _, cx| cx.open_url(url))
        .accessibility_label(label.clone())
        .child(label)
        .flex()
        .items_center()
        .gap(rems(0.375))
        .text_size(rems(0.75))
        .font_family(t.font.clone())
        .text_color(t.accent)
        .underline()
        .border_1()
        .border_color(t.foreground.opacity(0.))
        .px(rems(0.25))
        .py(rems(0.375))
        .hover(|s| s.text_color(t.bright))
        .focus_visible(|s| s.bg(t.hover_fill()).border_color(t.focus_border()))
        .styles(|s| s.disabled(|s| s.opacity(0.45)))
}

/// A square segmented strip with gpui-base Tab semantics.
pub fn tabs(id: impl Into<ElementId>, cx: &App) -> Tabs {
    let t = cx.omarchy();
    Tabs::new(id)
        .flex()
        .items_center()
        .gap_1()
        .p_1()
        .border_1()
        .rounded_none()
        .border_color(t.divider())
        .bg(t.normal_fill())
}

pub fn tab(
    id: impl Into<ElementId>,
    label: impl Into<SharedString>,
    selected: bool,
    cx: &App,
) -> Tab {
    let t = cx.omarchy();
    let label = label.into();
    Tab::new(id)
        .selected(selected)
        .accessibility_label(label.clone())
        .child(label)
        .px_3()
        .py_1()
        .flex()
        .flex_shrink_0()
        .items_center()
        .gap_1()
        .border_1()
        .rounded_none()
        .border_color(t.foreground.opacity(0.))
        .font_family(t.font.clone())
        .font_weight(FontWeight::NORMAL)
        .text_color(t.secondary)
        .active(|s| s.bg(t.pressed_fill()))
        .styles(|s| {
            s.selected(|s| {
                s.bg(t.selected_fill())
                    .text_color(t.foreground)
                    .border_color(t.accent)
            })
            .disabled(|s| s.opacity(0.45))
        })
}
