//! A keyboard menu composed from the base Popover and Button primitives.
use crate::{ActiveTheme, ButtonVariant, IconName, button, icon};
use gpui_kit::base::Popover;
use gpui_kit::rems;
use gpui_kit::{
    App, ElementId, Focusable, KeyDownEvent, ParentElement, SharedString, Window, div, prelude::*,
};
use std::rc::Rc;

/// Row height, and the gap that follows it, in rems.
const ROW_HEIGHT: f32 = 1.75;
const ROW_GAP: f32 = 0.125;
/// A separator costs its padding on both sides plus its own hairline.
const SEPARATOR_HEIGHT: f32 = 0.5625;
const MENU_PADDING: f32 = 0.375;

#[derive(Clone)]
pub struct MenuItem {
    pub label: SharedString,
    pub icon: Option<IconName>,
    pub shortcut: Option<SharedString>,
    pub disabled: bool,
    pub checked: Option<bool>,
    pub separator_before: bool,
    /// Child rows, each paired with the index reported to `on_select`.
    pub children: Vec<(usize, MenuItem)>,
}
impl MenuItem {
    pub fn new(label: impl Into<SharedString>) -> Self {
        Self {
            label: label.into(),
            icon: None,
            shortcut: None,
            disabled: false,
            checked: None,
            separator_before: false,
            children: Vec::new(),
        }
    }
    /// Open a second panel beside this row instead of selecting it.
    ///
    /// Each child carries the index `on_select` receives, so a submenu choice
    /// is reported like any other item and the parent needs no index of its own.
    pub fn submenu(mut self, children: Vec<(usize, MenuItem)>) -> Self {
        self.children = children;
        self
    }
    /// Display an exclusive choice with its check on the trailing edge.
    pub fn checked(mut self, checked: bool) -> Self {
        self.checked = Some(checked);
        self
    }
    pub fn separator_before(mut self) -> Self {
        self.separator_before = true;
        self
    }
    pub fn icon(mut self, icon: IconName) -> Self {
        self.icon = Some(icon);
        self
    }
    pub fn shortcut(mut self, shortcut: impl Into<SharedString>) -> Self {
        self.shortcut = Some(shortcut.into());
        self
    }
    pub fn disabled(mut self, disabled: bool) -> Self {
        self.disabled = disabled;
        self
    }
}

/// Compact action menu. Main command-launcher menus can override row geometry separately.
/// Base positions the popup, dismisses outside/Escape and restores trigger focus.
pub fn menu(
    id: impl Into<ElementId>,
    trigger: impl gpui_kit::base::Selectable + IntoElement + 'static,
    items: Vec<MenuItem>,
    on_select: impl Fn(usize, &mut Window, &mut App) + 'static,
) -> Popover {
    let on_select = Rc::new(on_select);
    Popover::new(id)
        .trigger(trigger)
        .content(move |popover, window, cx| {
            let t = cx.omarchy().clone();
            let cursor = window.use_keyed_state("menu-cursor", cx, |_, _| {
                items.iter().position(|item| !item.disabled)
            });
            let focus = window
                .use_keyed_state("menu-focus", cx, |_, cx| cx.focus_handle())
                .read(cx)
                .clone();
            if popover.focus_handle(cx).is_focused(window) {
                focus.focus(window, cx);
            }
            // The open submenu, and the row highlighted inside it.
            let page = window.use_keyed_state("menu-page", cx, |_, _| None::<usize>);
            let child_cursor = window.use_keyed_state("submenu-cursor", cx, |_, _| None::<usize>);

            // Selection is one decision for both panels: open a submenu, or
            // dismiss and report. Every code path below routes through it, so
            // opening a submenu never closes the menu.
            let displayed = items.clone();
            let leaf_select = on_select.clone();
            let select_page = page.clone();
            let select_child = child_cursor.clone();
            let select_close = cx.entity();
            let on_select: Rc<dyn Fn(usize, &mut Window, &mut App)> =
                Rc::new(move |index, window, cx| {
                    if let Some(parent) = *select_page.read(cx)
                        && let Some(child) = *select_child.read(cx)
                    {
                        if let Some((action, item)) = displayed[parent].children.get(child)
                            && !item.disabled
                        {
                            select_close.update(cx, |state, cx| state.dismiss(window, cx));
                            leaf_select(*action, window, cx);
                        }
                        return;
                    }
                    let Some(item) = displayed.get(index) else {
                        return;
                    };
                    if !item.children.is_empty() {
                        select_page.update(cx, |page, cx| {
                            *page = Some(index);
                            cx.notify();
                        });
                        select_child.update(cx, |child, cx| {
                            *child = Some(0);
                            cx.notify();
                        });
                        window.refresh();
                    } else if !item.disabled {
                        select_close.update(cx, |state, cx| state.dismiss(window, cx));
                        leaf_select(index, window, cx);
                    }
                });

            let has_icons = items.iter().any(|item| item.icon.is_some());
            let open_page = *page.read(cx);
            let keyboard_items = items.clone();
            let keyboard_page = page.clone();
            let keyboard_child = child_cursor.clone();
            let keyboard_cursor = cursor.clone();
            let keyboard_select = on_select.clone();
            let confirm_cursor = cursor.clone();
            let confirm_select = on_select.clone();
            let submenu_items = items.clone();
            let submenu_cursor = child_cursor.clone();
            let submenu_page = page.clone();
            let submenu_select = on_select.clone();
            let main = div()
                .id("menu-items")
                .debug_selector(|| "omarchy-menu-content".into())
                .role(gpui_kit::Role::Menu)
                .track_focus(&focus)
                .w(rems(15.))
                .p(rems(MENU_PADDING))
                .flex()
                .flex_col()
                .gap(rems(ROW_GAP))
                .border_1()
                .border_color(t.border)
                .bg(t.background)
                .text_color(t.foreground)
                .font_family(t.font.clone())
                .text_size(rems(0.75))
                .on_action(move |_: &gpui_kit::base::actions::Confirm, window, cx| {
                    cx.stop_propagation();
                    if let Some(index) = *confirm_cursor.read(cx) {
                        confirm_select(index, window, cx);
                        window.refresh();
                    }
                })
                .on_key_down(move |event: &KeyDownEvent, window, cx| {
                    if event.keystroke.modifiers.modified() {
                        return;
                    }
                    let key = event.keystroke.key.as_str();
                    let current = *keyboard_cursor.read(cx);
                    if key == "left" && keyboard_page.read(cx).is_some() {
                        keyboard_page.update(cx, |page, cx| {
                            *page = None;
                            cx.notify();
                        });
                        keyboard_child.update(cx, |child, cx| {
                            *child = None;
                            cx.notify();
                        });
                        window.refresh();
                    } else if key == "right" {
                        if let Some(index) =
                            current.filter(|&i| !keyboard_items[i].children.is_empty())
                        {
                            keyboard_select(index, window, cx);
                        }
                    } else if matches!(key, "enter" | "space") {
                        if let Some(index) = current.filter(|&i| !keyboard_items[i].disabled) {
                            keyboard_select(index, window, cx);
                            window.refresh();
                        }
                    } else if matches!(key, "down" | "j" | "up" | "k" | "home" | "end") {
                        // While a submenu is open the arrows belong to it.
                        if let Some(parent) = *keyboard_page.read(cx) {
                            let enabled: Vec<_> = keyboard_items[parent]
                                .children
                                .iter()
                                .enumerate()
                                .filter_map(|(i, (_, item))| (!item.disabled).then_some(i))
                                .collect();
                            let next = next_item(&enabled, *keyboard_child.read(cx), key);
                            keyboard_child.update(cx, |child, cx| {
                                *child = next;
                                cx.notify();
                            });
                            window.refresh();
                            cx.stop_propagation();
                            return;
                        }
                        let enabled: Vec<_> = keyboard_items
                            .iter()
                            .enumerate()
                            .filter_map(|(i, item)| (!item.disabled).then_some(i))
                            .collect();
                        let next = next_item(&enabled, current, key);
                        keyboard_cursor.update(cx, |cursor, cx| {
                            *cursor = next;
                            cx.notify();
                        });
                        window.refresh();
                    } else {
                        return;
                    }
                    cx.stop_propagation();
                })
                .children(items.into_iter().enumerate().map(|(index, item)| {
                    let hover_cursor = cursor.clone();
                    let hover_page = page.clone();
                    let hover_child = child_cursor.clone();
                    let item_has_children = !item.children.is_empty();
                    let click_page = page.clone();
                    let click_child = child_cursor.clone();
                    let current = *cursor.read(cx) == Some(index);
                    let select = on_select.clone();
                    let row = button(("menu-item", index), "", ButtonVariant::Secondary, cx)
                        .accessibility_label(item.label.clone())
                        .role(gpui_kit::Role::MenuItem)
                        .when_some(item.checked, |row, checked| {
                            row.role(gpui_kit::Role::MenuItemRadio)
                                .aria_toggled(if checked {
                                    gpui_kit::accesskit::Toggled::True
                                } else {
                                    gpui_kit::accesskit::Toggled::False
                                })
                        })
                        .focusable(false)
                        .disabled(item.disabled)
                        .w_full()
                        .h(rems(ROW_HEIGHT))
                        .py(rems(0.))
                        .px(rems(0.5))
                        .justify_start()
                        .bg(if current {
                            t.hover_fill()
                        } else {
                            t.foreground.opacity(0.)
                        })
                        .text_color(t.foreground)
                        .when(has_icons, |row| {
                            row.child(
                                div()
                                    .w(rems(0.875))
                                    .flex_shrink_0()
                                    .when_some(item.icon, |slot, name| {
                                        slot.child(icon(name).size(rems(0.875)))
                                    }),
                            )
                        })
                        .child(div().flex_1().min_w_0().child(item.label))
                        .when(item_has_children, |row| {
                            row.child(icon(IconName::ChevronRight).size(rems(0.875)))
                        })
                        .when_some(item.checked, |row, checked| {
                            row.child(div().w(rems(0.875)).when(checked, |slot| {
                                slot.child(icon(IconName::Check).size(rems(0.875)))
                            }))
                        })
                        .when_some(item.shortcut, |row, shortcut| {
                            row.child(
                                div()
                                    .text_size(rems(0.6875))
                                    .text_color(t.secondary)
                                    .child(shortcut),
                            )
                        })
                        .on_hover(move |hovered, window, cx| {
                            if *hovered && !item.disabled {
                                hover_page.update(cx, |page, cx| {
                                    *page = item_has_children.then_some(index);
                                    cx.notify();
                                });
                                hover_child.update(cx, |child, cx| {
                                    *child = None;
                                    cx.notify();
                                });
                                hover_cursor.update(cx, |cursor, cx| {
                                    *cursor = Some(index);
                                    cx.notify();
                                });
                                window.refresh();
                            }
                        })
                        .on_click(move |_, window, cx| {
                            // A pointer selects the row under it, not whatever
                            // the keyboard left highlighted in a submenu.
                            click_page.update(cx, |page, _| *page = None);
                            click_child.update(cx, |child, _| *child = None);
                            select(index, window, cx);
                            window.refresh();
                        });
                    div()
                        .when(item.separator_before, |group| {
                            group.child(div().py(rems(0.25)).child(crate::separator(cx)))
                        })
                        .child(row)
                }));
            div()
                .flex()
                .flex_row_reverse()
                .items_start()
                .gap(rems(0.25))
                .child(main)
                .when_some(open_page, |surface, parent| {
                    surface.child(
                        div()
                            .id("submenu")
                            .debug_selector(|| "omarchy-submenu-content".into())
                            .mt(rems(submenu_offset(&submenu_items, parent)))
                            .w(rems(10.625))
                            .p(rems(MENU_PADDING))
                            .flex()
                            .flex_col()
                            .gap(rems(ROW_GAP))
                            .border_1()
                            .border_color(t.border)
                            .bg(t.background)
                            .text_color(t.foreground)
                            .font_family(t.font.clone())
                            .text_size(rems(0.75))
                            .children(submenu_items[parent].children.iter().enumerate().map(
                                |(index, (_, item))| {
                                    let hover_cursor = submenu_cursor.clone();
                                    let click_cursor = submenu_cursor.clone();
                                    let select = submenu_select.clone();
                                    let page = submenu_page.clone();
                                    button(
                                        ("submenu-item", index),
                                        "",
                                        ButtonVariant::Secondary,
                                        cx,
                                    )
                                    .accessibility_label(item.label.clone())
                                    .role(gpui_kit::Role::MenuItemRadio)
                                    .aria_toggled(if item.checked == Some(true) {
                                        gpui_kit::accesskit::Toggled::True
                                    } else {
                                        gpui_kit::accesskit::Toggled::False
                                    })
                                    .focusable(false)
                                    .disabled(item.disabled)
                                    .w_full()
                                    .h(rems(ROW_HEIGHT))
                                    .py(rems(0.))
                                    .px(rems(0.5))
                                    .bg(if *submenu_cursor.read(cx) == Some(index) {
                                        t.hover_fill()
                                    } else {
                                        t.foreground.opacity(0.)
                                    })
                                    .child(div().flex_1().child(item.label.clone()))
                                    .when(item.checked == Some(true), |row| {
                                        row.child(icon(IconName::Check).size(rems(0.875)))
                                    })
                                    .on_hover(move |hovered, window, cx| {
                                        if *hovered {
                                            hover_cursor.update(cx, |cursor, cx| {
                                                *cursor = Some(index);
                                                cx.notify();
                                            });
                                            window.refresh();
                                        }
                                    })
                                    .on_click(
                                        move |_, window, cx| {
                                            page.update(cx, |page, _| *page = Some(parent));
                                            click_cursor
                                                .update(cx, |cursor, _| *cursor = Some(index));
                                            select(parent, window, cx);
                                            window.refresh();
                                        },
                                    )
                                },
                            )),
                    )
                })
        })
}

/// How far the submenu sits below the top of the menu, so its first row lines
/// up with the parent row that opened it.
fn submenu_offset(items: &[MenuItem], parent: usize) -> f32 {
    let separator = |item: &MenuItem| {
        if item.separator_before {
            SEPARATOR_HEIGHT
        } else {
            0.
        }
    };
    MENU_PADDING
        + items
            .iter()
            .take(parent)
            .map(|item| ROW_HEIGHT + ROW_GAP + separator(item))
            .sum::<f32>()
        + items.get(parent).map_or(0., separator)
}

fn next_item(enabled: &[usize], current: Option<usize>, key: &str) -> Option<usize> {
    if enabled.is_empty() {
        return None;
    }
    let position = current.and_then(|i| enabled.iter().position(|&item| item == i));
    let index = match key {
        "home" => 0,
        "end" => enabled.len() - 1,
        "up" | "k" => position.map_or(enabled.len() - 1, |i| {
            (i + enabled.len() - 1) % enabled.len()
        }),
        _ => position.map_or(0, |i| (i + 1) % enabled.len()),
    };
    Some(enabled[index])
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn navigation_skips_disabled_and_wraps() {
        assert_eq!(next_item(&[0, 2], Some(0), "down"), Some(2));
        assert_eq!(next_item(&[0, 2], Some(2), "down"), Some(0));
        assert_eq!(next_item(&[0, 2], Some(0), "up"), Some(2));
        assert_eq!(next_item(&[], None, "home"), None);
    }

    #[test]
    fn submenu_lines_up_with_the_row_that_opened_it() {
        let items = vec![
            MenuItem::new("first"),
            MenuItem::new("second").separator_before(),
            MenuItem::new("third"),
        ];
        assert_eq!(submenu_offset(&items, 0), MENU_PADDING);
        assert_eq!(
            submenu_offset(&items, 1),
            MENU_PADDING + ROW_HEIGHT + ROW_GAP + SEPARATOR_HEIGHT
        );
        assert_eq!(
            submenu_offset(&items, 2),
            MENU_PADDING + 2. * (ROW_HEIGHT + ROW_GAP) + SEPARATOR_HEIGHT
        );
    }

    #[test]
    fn submenu_children_carry_their_own_action_index() {
        let item = MenuItem::new("Theme").submenu(vec![
            (20, MenuItem::new("System").checked(true)),
            (21, MenuItem::new("Light")),
        ]);
        assert_eq!(item.children.len(), 2);
        assert_eq!(item.children[0].0, 20);
        assert_eq!(item.children[1].0, 21);
    }
}
