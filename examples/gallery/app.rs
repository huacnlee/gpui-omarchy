use gpui::{
    App, Bounds, ClickEvent, Context, Entity, FocusHandle, FontWeight, KeyDownEvent, Window,
    WindowBounds, WindowOptions, div, prelude::*, px, size,
};
use gpui_base::CheckboxState;
use gpui_omarchy::*;

const GROUPS: &[(&str, &[&str])] = &[
    ("Explore", &["overview"]),
    ("Actions", &["button", "button_group", "link", "toggle"]),
    (
        "Forms",
        &[
            "input",
            "textarea",
            "editor",
            "number_input",
            "select",
            "combobox",
            "calendar",
            "date_picker",
            "otp_input",
            "slider",
            "checkbox",
            "switch",
            "radio",
        ],
    ),
    (
        "Navigation",
        &[
            "menu",
            "tabs",
            "accordion",
            "collapsible",
            "nav_stack",
            "pagination",
        ],
    ),
    (
        "Overlays",
        &[
            "dialog",
            "alert_dialog",
            "popover",
            "tooltip",
            "hover_card",
            "toast",
        ],
    ),
    (
        "Display",
        &[
            "icon",
            "avatar",
            "panel",
            "table",
            "tree",
            "resizable",
            "dock",
            "separator",
            "keycap",
            "badge",
            "empty_state",
            "progress",
        ],
    ),
];

fn components() -> impl Iterator<Item = &'static str> {
    GROUPS.iter().flat_map(|(_, items)| items.iter().copied())
}

fn display_name(page: &str) -> String {
    let label = page.replace('_', " ");
    let mut letters = label.chars();
    letters.next().map_or(String::new(), |first| {
        first.to_uppercase().collect::<String>() + letters.as_str()
    })
}

fn description(page: &str) -> &'static str {
    match page {
        "overview" => "Explore the components together, then use the sidebar to inspect each one.",
        "button_group" => "Choose one setting from a row of mutually exclusive options.",
        "collapsible" => "Expand a single region for additional settings.",
        "toast" => "Brief feedback that leaves your current task in place.",
        "popover" => "Adjust contextual settings while keeping the workspace in view.",
        "tooltip" => "A short explanation for an action, shown on hover.",
        "select" => "Choose one value from a fixed set of options.",
        "combobox" => "Search a collection, then choose a matching option.",
        "menu" => "An anchored action menu with one pointer and keyboard cursor.",
        "dialog" => "A focused task with confirmation, cancellation and focus return.",
        "alert_dialog" => "An explicit decision that cannot be dismissed by clicking the backdrop.",
        "button" => "Content-sized actions with quiet hover, focus and pressed states.",
        "input" => "Single-line editing with selection, clipboard and IME support.",
        "textarea" => "Multi-line notes with native text editing.",
        "number_input" => "A compact numeric field with keyboard and button stepping.",
        "slider" => "Adjust one value or a range with the pointer or keyboard.",
        "checkbox" => "Independent choices, including a mixed selection.",
        "switch" => "An immediate on/off choice with a visible track and thumb.",
        "radio" => "Choose one option from a group.",
        "tabs" => "Switch between related views while keeping context.",
        "accordion" => "Reveal supporting content when it is needed.",
        "pagination" => "Move through a paged collection.",
        "table" => "Aligned columns for comparing records.",
        "editor" => "Edit source text with line numbers and indentation.",
        "nav_stack" => "Navigate between persistent pages and return to where you left off.",
        "dock" => "Rearrange document panels by dragging their tabs.",
        "tree" => "Explore nested folders and select a workspace document.",
        "resizable" => "Drag the divider to adjust space between panes.",
        "hover_card" => "Preview supporting details without leaving the page.",
        "otp_input" => "Enter a six-digit verification code.",
        "date_picker" => "Choose a date from a calendar anchored to a field.",
        "calendar" => "Choose a date with month and year navigation.",
        "avatar" => "Identify people and workspaces with a square image or initials.",
        "icon" => "Monochrome SVG icons that inherit the surrounding text color.",
        "panel" => "A surface for a related group of settings or information.",
        "separator" => "A quiet boundary between distinct sections.",
        "keycap" => "Compact, readable keyboard hints.",
        "badge" => "Short labels for neutral and semantic status.",
        "empty_state" => "Explain an empty collection and its next step.",
        "progress" => "Show how much of a known task is complete.",
        "toggle" => "Keep a command active until it is pressed again.",
        "link" => "Open a named destination.",
        _ => "",
    }
}

struct Gallery {
    workspace_name: Entity<gpui_base::input::InputState>,
    workspace_draft: Entity<gpui_base::input::InputState>,
    saved_workspace: String,
    theme_mode: usize,
    toolbar_position: usize,
    select_choice: Entity<ChoiceState>,
    combo_choice: Entity<ChoiceState>,
    disabled_choice: Entity<ChoiceState>,
    modal_open: bool,
    modal_focus: FocusHandle,
    modal_trigger: FocusHandle,
    modal_result: String,
    menu_result: String,
    slider_value: Entity<gpui_base::slider::SliderState>,
    slider_range: Entity<gpui_base::slider::SliderState>,
    slider_disabled: Entity<gpui_base::slider::SliderState>,
    navigation_focus: FocusHandle,
    expanded: [bool; 3],
    collapse_open: bool,
    toast_message: Option<&'static str>,
    toast_saved: bool,
    current_page: usize,
    number: Entity<gpui_base::input::InputState>,
    input: Entity<gpui_base::input::InputState>,
    textarea: Entity<gpui_base::input::TextareaState>,
    page: &'static str,
    count: usize,
    checked: bool,
    mixed: bool,
    enabled: bool,
    choice: usize,
    pressed: bool,
    tab: usize,
    progress: f32,
    calendar_state: Entity<gpui_base::CalendarState>,
    tree_state: Entity<gpui_base::TreeState>,
    otp_state: Entity<gpui_base::OtpState>,
    editor_state: Entity<gpui_base::input::EditorState>,
    nav_state: Entity<gpui_base::NavStackState>,
    date_picker_state: Entity<DatePickerState>,
    dock_state: Entity<gpui_base::dock::DockArea>,
}

impl Gallery {
    fn new(window: &mut Window, cx: &mut Context<Self>) -> Self {
        let number = cx.new(|cx| gpui_base::input::InputState::new(window, cx).default_value("1"));
        let input =
            cx.new(|cx| gpui_base::input::InputState::new(window, cx).placeholder("Project name"));
        let textarea = cx.new(|cx| {
            gpui_base::input::TextareaState::new(window, cx)
                .rows(4)
                .placeholder("Add notes")
        });
        let slider_value = cx.new(|_| {
            gpui_base::slider::SliderState::new()
                .step(5.)
                .default_value(40.)
        });
        let slider_range = cx.new(|_| {
            gpui_base::slider::SliderState::new()
                .step(5.)
                .default_value((20., 80.))
        });
        let slider_disabled = cx.new(|_| gpui_base::slider::SliderState::new().default_value(60.));
        for state in [&slider_value, &slider_range] {
            cx.observe(state, |_, _, cx| cx.notify()).detach();
        }
        let workspace_name = cx.new(|cx| {
            gpui_base::input::InputState::new(window, cx).default_value("Personal workspace")
        });
        let workspace_draft = cx.new(|cx| {
            gpui_base::input::InputState::new(window, cx).default_value("Personal workspace")
        });
        for state in [&workspace_name, &workspace_draft] {
            cx.observe(state, |_, _, cx| cx.notify()).detach();
        }
        let options = || {
            vec![
                ChoiceItem::new("personal", "Personal workspace"),
                ChoiceItem::new("team", "Team workspace"),
                ChoiceItem::new("archive", "Archived workspace").disabled(true),
                ChoiceItem::new("sandbox", "Sandbox"),
            ]
        };
        let select_choice = cx.new(|cx| {
            ChoiceState::new(options(), window, cx)
                .label("Default workspace")
                .default_selected(0)
        });
        let combo_choice = cx.new(|cx| {
            ChoiceState::new(options(), window, cx)
                .label("Find a workspace")
                .placeholder("Find a workspace…")
        });
        let disabled_choice = cx.new(|cx| {
            ChoiceState::new(options(), window, cx)
                .label("Managed workspace")
                .default_selected(1)
                .disabled(true)
        });
        for state in [&select_choice, &combo_choice] {
            cx.observe(state, |_, _, cx| cx.notify()).detach();
        }
        let calendar_state =
            cx.new(|cx| gpui_base::CalendarState::new(window, cx).disabled_matcher(vec![0, 6]));
        cx.observe(&calendar_state, |_, _, cx| cx.notify()).detach();
        let tree_state = cx.new(|cx| {
            gpui_base::TreeState::new(cx).items(vec![
                gpui_base::TreeItem::new("documents", "Documents")
                    .expanded(true)
                    .child(gpui_base::TreeItem::new("brief", "Project brief.md"))
                    .child(gpui_base::TreeItem::new("notes", "Meeting notes.md")),
                gpui_base::TreeItem::new("projects", "Projects")
                    .expanded(true)
                    .child(
                        gpui_base::TreeItem::new("website", "Website")
                            .child(gpui_base::TreeItem::new("homepage", "Homepage.md"))
                            .child(gpui_base::TreeItem::new("assets", "Assets.md")),
                    ),
                gpui_base::TreeItem::new("archive", "Archive (unavailable)").disabled(true),
            ])
        });
        cx.observe(&tree_state, |_, _, cx| cx.notify()).detach();
        let otp_state = cx.new(|cx| gpui_base::OtpState::new(6, window, cx));
        cx.observe(&otp_state, |_, _, cx| cx.notify()).detach();
        let editor_state = cx.new(|cx| gpui_base::input::EditorState::new(window, cx)
            .line_number(true).indent_guides(true)
            .default_value("fn main() {\n    let workspace = \"Personal\";\n    println!(\"Hello, {workspace}\");\n}\n"));
        let nav_state = cx.new(|_| gpui_base::NavStackState::new());
        let task_page = cx.new(|cx| NavigationPage {
            level: 2,
            next: None,
            navigation: nav_state.downgrade(),
            notes: cx.new(|cx| {
                gpui_base::input::InputState::new(window, cx)
                    .default_value("Check the narrow window layout before Friday.")
            }),
        });
        let project_page = cx.new(|cx| NavigationPage {
            level: 1,
            next: Some(task_page),
            navigation: nav_state.downgrade(),
            notes: cx.new(|cx| gpui_base::input::InputState::new(window, cx)),
        });
        let root_page = cx.new(|cx| NavigationPage {
            level: 0,
            next: Some(project_page),
            navigation: nav_state.downgrade(),
            notes: cx.new(|cx| gpui_base::input::InputState::new(window, cx)),
        });
        nav_state.update(cx, |state, cx| {
            state.push(root_page, gpui_base::NavMotion::Immediate, cx)
        });
        cx.observe(&nav_state, |_, _, cx| cx.notify()).detach();
        let date_picker_state = cx.new(|cx| DatePickerState::new(window, cx));
        cx.observe(&date_picker_state, |_, _, cx| cx.notify())
            .detach();
        let dock_state = cx.new(|cx| dock_area("gallery-workspace", window, cx));
        let layout = demo_dock_layout(cx);
        dock_state.update(cx, |state, cx| state.set_center(layout, window, cx));
        Self {
            dock_state,
            date_picker_state,
            editor_state,
            nav_state,
            otp_state,
            tree_state,
            calendar_state,
            select_choice,
            combo_choice,
            disabled_choice,
            workspace_name,
            workspace_draft,
            saved_workspace: "Personal workspace".into(),
            theme_mode: 0,
            toolbar_position: 0,
            modal_open: false,
            modal_focus: cx.focus_handle(),
            modal_trigger: cx.focus_handle(),
            modal_result: String::new(),
            menu_result: "No action selected".into(),
            slider_value,
            slider_range,
            slider_disabled,
            navigation_focus: cx.focus_handle(),
            expanded: [true, false, false],
            collapse_open: false,
            toast_message: None,
            toast_saved: false,
            current_page: 1,
            number,
            input,
            textarea,
            page: components()
                .find(|name| std::env::args().nth(1).as_deref() == Some(*name))
                .unwrap_or("overview"),
            count: 0,
            checked: true,
            mixed: false,
            enabled: true,
            choice: 0,
            pressed: false,
            tab: 0,
            progress: 30.,
        }
    }
    fn save_workspace(&mut self, modal: bool, window: &mut Window, cx: &mut Context<Self>) {
        let value = if modal {
            self.workspace_draft.read(cx)
        } else {
            self.workspace_name.read(cx)
        }
        .value()
        .to_string();
        if value.trim().is_empty() {
            self.modal_result = "Enter a workspace name".into();
        } else {
            self.saved_workspace = value.trim().into();
            if modal {
                let value = self.saved_workspace.clone();
                self.workspace_name
                    .update(cx, |state, cx| state.set_value(value, window, cx));
            }
            self.modal_result = format!("Saved “{}”", self.saved_workspace);
        }
        cx.notify();
    }

    fn reset_workspace(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        self.saved_workspace = "Personal workspace".into();
        self.workspace_name.update(cx, |state, cx| {
            state.set_value("Personal workspace", window, cx)
        });
        self.modal_result = "Workspace defaults restored".into();
        cx.notify();
    }

    fn workspace_form(
        &self,
        modal: bool,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) -> gpui::Div {
        let t = cx.omarchy().clone();
        let state = if modal {
            &self.workspace_draft
        } else {
            &self.workspace_name
        };
        let valid = !state.read(cx).value().trim().is_empty();
        div()
            .flex()
            .flex_col()
            .gap(px(18.))
            .child(
                div()
                    .flex()
                    .flex_col()
                    .gap(px(6.))
                    .child(dialog_title("Workspace settings", cx))
                    .child(dialog_description(
                        "Give this workspace a name you can recognize.",
                        cx,
                    )),
            )
            .child(
                div()
                    .flex()
                    .flex_col()
                    .gap(px(6.))
                    .child("Name")
                    .child(input(
                        if modal { "modal-name" } else { "specimen-name" },
                        state,
                        window,
                        cx,
                    ))
                    .child(
                        div()
                            .text_size(px(11.))
                            .text_color(t.secondary)
                            .child(if valid {
                                "Shown in the workspace switcher."
                            } else {
                                "Enter a workspace name"
                            })
                            .text_color(if valid { t.secondary } else { t.danger }),
                    ),
            )
            .child(
                div()
                    .flex()
                    .items_center()
                    .gap(px(8.))
                    .py(px(8.))
                    .child(icon(IconName::Settings).text_color(t.secondary))
                    .child(
                        div()
                            .text_color(t.secondary)
                            .child(format!("Current workspace: {}", self.saved_workspace)),
                    ),
            )
            .child(separator(cx))
            .child(
                div()
                    .flex()
                    .justify_end()
                    .gap(px(8.))
                    .child(
                        dialog_button(
                            if modal {
                                "modal-cancel"
                            } else {
                                "specimen-cancel"
                            },
                            "Cancel",
                            ButtonVariant::Secondary,
                            cx,
                        )
                        .on_click(cx.listener(
                            move |this, _, window, cx| {
                                if modal {
                                    window
                                        .dispatch_action(Box::new(gpui_base::actions::Cancel), cx);
                                } else {
                                    let value = this.saved_workspace.clone();
                                    this.workspace_name
                                        .update(cx, |state, cx| state.set_value(value, window, cx));
                                    this.modal_result = "Changes discarded".into();
                                    cx.notify();
                                }
                            },
                        )),
                    )
                    .child(
                        dialog_button(
                            if modal {
                                "modal-confirm"
                            } else {
                                "specimen-confirm"
                            },
                            "Save",
                            ButtonVariant::Primary,
                            cx,
                        )
                        .disabled(!valid)
                        .on_click(cx.listener(
                            move |this, _, window, cx| {
                                if modal {
                                    window.dispatch_action(
                                        Box::new(gpui_base::actions::Confirm { secondary: false }),
                                        cx,
                                    );
                                } else {
                                    this.save_workspace(false, window, cx);
                                }
                            },
                        )),
                    ),
            )
    }

    fn reset_form(&self, modal: bool, cx: &mut Context<Self>) -> gpui::Div {
        let t = cx.omarchy();
        div().flex().flex_col().gap(px(18.))
            .child(icon(IconName::TriangleAlert).size(px(24.)).text_color(t.danger))
            .child(dialog_title("Reset workspace settings?", cx))
            .child(dialog_description(format!("The custom name “{}” will be replaced with “Personal workspace”. Your files will stay in place.", self.saved_workspace), cx))
            .child(div().flex().justify_end().gap(px(8.))
                .child(dialog_button(if modal { "modal-cancel" } else { "specimen-cancel" }, "Cancel", ButtonVariant::Secondary, cx)
                    .on_click(cx.listener(move |this, _, window, cx| {
                        if modal { window.dispatch_action(Box::new(gpui_base::actions::Cancel), cx); }
                        else { this.modal_result = "Workspace unchanged".into(); cx.notify(); }
                    })))
                .child(dialog_button(if modal { "modal-confirm" } else { "specimen-confirm" }, "Reset", ButtonVariant::Danger, cx)
                    .on_click(cx.listener(move |this, _, window, cx| {
                        if modal { window.dispatch_action(Box::new(gpui_base::actions::Confirm { secondary: false }), cx); }
                        else { this.reset_workspace(window, cx); }
                    }))))
    }
}

impl Render for Gallery {
    fn render(&mut self, window: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        let t = cx.omarchy().clone();
        let mut content = div()
            .flex()
            .flex_col()
            .items_start()
            .w_full()
            .gap(px(14.))
            .min_w_0();
        match self.page {
            "overview" => {
                let form = self.workspace_form(false, window, cx);
                content = content
                    .child(
                        div()
                            .flex()
                            .flex_wrap()
                            .items_start()
                            .gap(px(24.))
                            .child(div().w(px(420.)).max_w(gpui::relative(1.)).child(form))
                            .child(
                                div()
                                    .w(px(220.))
                                    .flex()
                                    .flex_col()
                                    .gap(px(18.))
                                    .child(
                                        div()
                                            .text_size(px(13.))
                                            .font_weight(FontWeight::BOLD)
                                            .child("Preferences"),
                                    )
                                    .child(
                                        checkbox(
                                            "overview-hidden",
                                            "Show hidden files",
                                            if self.checked {
                                                CheckboxState::Checked
                                            } else {
                                                CheckboxState::Unchecked
                                            },
                                            cx,
                                        )
                                        .on_change(change(
                                            cx.listener(|this, state, _, cx| {
                                                this.checked = *state == CheckboxState::Checked;
                                                cx.notify();
                                            }),
                                        )),
                                    )
                                    .child(
                                        switch("overview-sync", "Sync enabled", self.enabled, cx)
                                            .on_change(change(cx.listener(
                                                |this, value, _, cx| {
                                                    this.enabled = *value;
                                                    cx.notify();
                                                },
                                            ))),
                                    )
                                    .child(separator(cx))
                                    .child(
                                        div()
                                            .text_size(px(13.))
                                            .font_weight(FontWeight::BOLD)
                                            .child("Theme"),
                                    )
                                    .child(div().text_color(t.secondary).child(t.name.clone()))
                                    .child(
                                        div()
                                            .text_color(t.secondary)
                                            .child("Settings in this gallery stay in memory."),
                                    ),
                            ),
                    )
                    .child(div().mt(px(18.)).w_full().child(separator(cx)))
                    .child(
                        div()
                            .text_size(px(13.))
                            .font_weight(FontWeight::BOLD)
                            .child("Explore components"),
                    )
                    .child(
                        div().flex().flex_wrap().gap(px(8.)).children(
                            [
                                ("button", "Buttons"),
                                ("input", "Text fields"),
                                ("menu", "Menus"),
                                ("dialog", "Dialogs"),
                            ]
                            .into_iter()
                            .map(|(page, label)| {
                                dialog_button(
                                    (gpui::ElementId::from("overview-open"), page),
                                    label,
                                    ButtonVariant::Secondary,
                                    cx,
                                )
                                .on_click(cx.listener(
                                    move |this, _, _, cx| {
                                        this.page = page;
                                        cx.notify();
                                    },
                                ))
                            }),
                        ),
                    );
            }
            "popover" => {
                let target = cx.entity();
                content = content
                    .child(
                        div()
                            .w(px(360.))
                            .max_w(gpui::relative(1.))
                            .p(px(14.))
                            .bg(t.normal_fill())
                            .flex()
                            .flex_col()
                            .gap(px(8.))
                            .child(self.saved_workspace.clone())
                            .child("Documents")
                            .child("Projects")
                            .when(self.checked, |preview| {
                                preview.child(div().text_color(t.secondary).child(".config"))
                            }),
                    )
                    .child(popover(
                        "display-options",
                        button(
                            "display-options-trigger",
                            "Display options",
                            ButtonVariant::Secondary,
                            cx,
                        )
                        .child(icon(IconName::ChevronDown).size(px(14.))),
                        move |_, _, cx| {
                            let checked = target.read(cx).checked;
                            let enabled = target.read(cx).enabled;
                            let hidden_target = target.clone();
                            let sync_target = target.clone();
                            div()
                                .flex()
                                .flex_col()
                                .gap(px(14.))
                                .child(div().font_weight(FontWeight::BOLD).child("Display options"))
                                .child(
                                    checkbox(
                                        "popover-hidden",
                                        "Show hidden files",
                                        if checked {
                                            CheckboxState::Checked
                                        } else {
                                            CheckboxState::Unchecked
                                        },
                                        cx,
                                    )
                                    .on_change(
                                        move |value, _, _, cx| {
                                            hidden_target.update(cx, |this, cx| {
                                                this.checked = value == CheckboxState::Checked;
                                                cx.notify();
                                            })
                                        },
                                    ),
                                )
                                .child(
                                    switch("popover-sync", "Sync workspace", enabled, cx)
                                        .on_change(move |value, _, _, cx| {
                                            sync_target.update(cx, |this, cx| {
                                                this.enabled = value;
                                                cx.notify();
                                            })
                                        }),
                                )
                        },
                    ))
                    .child(div().text_color(t.secondary).child(if self.enabled {
                        "Workspace sync is enabled."
                    } else {
                        "Workspace sync is paused."
                    }));
            }
            "tooltip" => {
                let action = if self.pressed {
                    "Remove from favorites"
                } else {
                    "Add to favorites"
                };
                content = content
                    .child(
                        div()
                            .w(px(360.))
                            .max_w(gpui::relative(1.))
                            .p(px(14.))
                            .bg(t.normal_fill())
                            .flex()
                            .items_center()
                            .gap(px(14.))
                            .child(
                                div()
                                    .flex_1()
                                    .flex()
                                    .flex_col()
                                    .gap(px(6.))
                                    .child(self.saved_workspace.clone())
                                    .child(div().text_color(t.secondary).child(if self.pressed {
                                        "In favorites"
                                    } else {
                                        "Not in favorites"
                                    })),
                            )
                            .child(with_tooltip(
                                button("tooltip-favorite", "", ButtonVariant::Secondary, cx)
                                    .accessibility_label(action)
                                    .selected(self.pressed)
                                    .child(icon(IconName::Star))
                                    .on_click(cx.listener(|this, _, _, cx| {
                                        this.pressed = !this.pressed;
                                        cx.notify();
                                    })),
                                action,
                            )),
                    )
                    .child(
                        div().text_color(t.secondary).child(
                            "Hover the star for its action. Tab and Return also activate it.",
                        ),
                    )
                    .child(div().mt(px(14.)).child("Tooltip appearance"))
                    .child(tooltip("Add to favorites", cx));
            }
            "select" | "combobox" => {
                let searchable = self.page == "combobox";
                let state = if searchable {
                    &self.combo_choice
                } else {
                    &self.select_choice
                };
                let selected = state
                    .read(cx)
                    .selected()
                    .map(|item| item.label.to_string())
                    .unwrap_or_else(|| "None".into());
                let control = if searchable {
                    combobox("workspace-choice", state, window, cx).into_any_element()
                } else {
                    select("workspace-choice", state, window, cx).into_any_element()
                };
                let disabled = if searchable {
                    combobox("managed-choice", &self.disabled_choice, window, cx).into_any_element()
                } else {
                    select("managed-choice", &self.disabled_choice, window, cx).into_any_element()
                };
                content = content
                    .child(
                        div()
                            .w(px(360.))
                            .max_w(gpui::relative(1.))
                            .flex()
                            .flex_col()
                            .gap(px(8.))
                            .child(if searchable {
                                "Find a workspace"
                            } else {
                                "Default workspace"
                            })
                            .child(control)
                            .child(
                                div()
                                    .text_color(t.secondary)
                                    .child("Archived workspaces cannot be selected."),
                            )
                            .child(div().mt(px(12.)).child(format!("Selected: {selected}"))),
                    )
                    .child(div().mt(px(18.)).w_full().child(separator(cx)))
                    .child(
                        div()
                            .w(px(360.))
                            .max_w(gpui::relative(1.))
                            .flex()
                            .flex_col()
                            .gap(px(8.))
                            .child("Managed workspace")
                            .child(disabled)
                            .child(
                                div()
                                    .text_color(t.secondary)
                                    .child("This setting is managed by your organization."),
                            ),
                    );
            }
            "menu" => {
                let target = cx.entity();
                content = content
                    .child(menu(
                        "workspace-menu",
                        button(
                            "menu-trigger",
                            "Workspace actions",
                            ButtonVariant::Secondary,
                            cx,
                        )
                        .child(icon(IconName::ChevronDown).text_color(t.foreground)),
                        vec![
                            MenuItem::new("New workspace").icon(IconName::Plus),
                            MenuItem::new("Favorite workspace").icon(IconName::Star),
                            MenuItem::new("Unavailable action").disabled(true),
                        ],
                        move |index, _, cx| {
                            target.update(cx, |this, cx| {
                                this.menu_result =
                                    ["New workspace", "Favorite workspace", "Unavailable action"]
                                        [index]
                                        .into();
                                cx.notify();
                            })
                        },
                    ))
                    .child(self.menu_result.clone());
            }
            "dialog" | "alert_dialog" => {
                let alert = self.page == "alert_dialog";
                let specimen = if alert {
                    self.reset_form(false, cx)
                } else {
                    self.workspace_form(false, window, cx)
                };
                content = content
                    .child(
                        div()
                            .text_size(px(13.))
                            .font_weight(FontWeight::BOLD)
                            .child(if alert {
                                "Destructive confirmation"
                            } else {
                                "Form dialog"
                            }),
                    )
                    .child(div().text_color(t.secondary).child(if alert {
                        "A named consequence, a clear way back, and a distinct destructive action."
                    } else {
                        "A short task with visible labels and outline actions."
                    }))
                    .child(dialog_popup(cx).w(px(460.)).child(specimen))
                    .child(
                        div()
                            .flex()
                            .items_center()
                            .gap(px(12.))
                            .mt(px(6.))
                            .child(
                                dialog_button(
                                    "open-modal",
                                    if alert {
                                        "Open alert dialog…"
                                    } else {
                                        "Open dialog…"
                                    },
                                    ButtonVariant::Secondary,
                                    cx,
                                )
                                .track_focus(&self.modal_trigger)
                                .on_click(cx.listener(
                                    |this, _, window, cx| {
                                        let value = this.saved_workspace.clone();
                                        this.workspace_draft.update(cx, |state, cx| {
                                            state.set_value(value, window, cx)
                                        });
                                        this.modal_open = true;
                                        this.modal_focus.focus(window, cx);
                                        cx.notify();
                                    },
                                )),
                            )
                            .child(div().text_color(t.secondary).child(if alert {
                                "Escape cancels · Backdrop keeps the dialog open"
                            } else {
                                "Escape cancels · Tab moves between controls"
                            })),
                    )
                    .when(!self.modal_result.is_empty(), |content| {
                        content.child(
                            div()
                                .text_color(t.secondary)
                                .child(self.modal_result.clone()),
                        )
                    });
                if self.modal_open {
                    let body = if alert {
                        self.reset_form(true, cx)
                    } else {
                        self.workspace_form(true, window, cx)
                    };
                    let popup = div()
                        .id("modal-surface")
                        .occlude()
                        .max_w(gpui::relative(0.9))
                        .child(dialog_popup(cx).w(px(460.)).child(body));
                    let close = cx.listener(|this, confirmed: &bool, window, cx| {
                        this.modal_open = false;
                        if *confirmed {
                            if this.page == "alert_dialog" {
                                this.reset_workspace(window, cx);
                            } else {
                                this.save_workspace(true, window, cx);
                            }
                        } else {
                            this.modal_result = "Changes discarded".into();
                        }
                        this.modal_trigger.focus(window, cx);
                        cx.notify();
                    });
                    if alert {
                        content = content.child(
                            alert_dialog(&self.modal_focus, cx)
                                .popup(
                                    div()
                                        .size_full()
                                        .flex()
                                        .items_center()
                                        .justify_center()
                                        .child(popup),
                                )
                                .request_close(move |confirmed, window, cx| {
                                    close(&confirmed, window, cx)
                                }),
                        );
                    } else {
                        content = content.child(
                            dialog(&self.modal_focus, cx)
                                .on_ok({
                                    let draft = self.workspace_draft.clone();
                                    move |_, _, cx| !draft.read(cx).value().trim().is_empty()
                                })
                                .popup(popup)
                                .request_close(move |confirmed, window, cx| {
                                    close(&confirmed, window, cx)
                                }),
                        );
                    }
                }
            }
            "slider" => {
                content = content
                    .child(format!("Volume: {}", self.slider_value.read(cx).value()))
                    .child(slider(&self.slider_value, false, window, cx))
                    .child(format!("Range: {}", self.slider_range.read(cx).value()))
                    .child(slider(&self.slider_range, false, window, cx))
                    .child("Disabled")
                    .child(slider(&self.slider_disabled, true, window, cx))
                    .child("Arrow keys / h l  adjust · Home / End  bounds · Tab  next thumb");
            }
            "icon" => {
                for (name, glyph) in [
                    ("Check", IconName::Check),
                    ("Minus", IconName::Minus),
                    ("Plus", IconName::Plus),
                    ("Chevron down", IconName::ChevronDown),
                    ("Chevron right", IconName::ChevronRight),
                    ("Star", IconName::Star),
                    ("External link", IconName::ExternalLink),
                    ("Close", IconName::Close),
                    ("Search", IconName::Search),
                    ("Menu", IconName::Menu),
                    ("Settings", IconName::Settings),
                    ("Alert", IconName::TriangleAlert),
                ] {
                    content = content.child(
                        div()
                            .flex()
                            .items_center()
                            .gap(px(8.))
                            .child(icon(glyph))
                            .child(name),
                    );
                }
            }
            "collapsible" => {
                content = content.child(
                    collapsible(self.collapse_open, cx)
                        .child(
                            button("collapse-trigger", "", ButtonVariant::Outline, cx)
                                .debug_selector(|| "collapse-trigger".into())
                                .accessibility_label("Advanced settings")
                                .aria_expanded(self.collapse_open)
                                .child(
                                    icon(if self.collapse_open {
                                        IconName::ChevronDown
                                    } else {
                                        IconName::ChevronRight
                                    })
                                    .size(px(14.)),
                                )
                                .child("Advanced settings")
                                .on_click(cx.listener(|this, _, _, cx| {
                                    this.collapse_open = !this.collapse_open;
                                    cx.notify();
                                })),
                        )
                        .content(
                            div()
                                .flex()
                                .flex_col()
                                .gap(px(14.))
                                .p(px(14.))
                                .bg(t.normal_fill())
                                .child("Workspace synchronization")
                                .child(
                                    switch("collapse-sync", "Sync workspace", self.enabled, cx)
                                        .debug_selector(|| "collapse-sync".into())
                                        .on_change(change(cx.listener(|this, next, _, cx| {
                                            this.enabled = *next;
                                            cx.notify();
                                        }))),
                                )
                                .child(div().text_color(t.secondary).child(
                                    "Your selection is preserved when this section is collapsed.",
                                )),
                        ),
                );
            }
            "toast" => {
                content = content.child(div().flex().flex_wrap().gap(px(8.))
                    .child(button("show-toast", "Save workspace", ButtonVariant::Outline, cx)
                        .on_click(cx.listener(|this, _, _, cx| { this.toast_saved = true; this.toast_message = Some("Workspace saved"); cx.notify(); })))
                    .child(button("show-error-toast", "Show error", ButtonVariant::Secondary, cx)
                        .on_click(cx.listener(|this, _, _, cx| { this.toast_message = Some("Could not sync workspace"); cx.notify(); }))))
                    .child(if self.toast_saved { "Example workspace: saved" } else { "Example workspace: unsaved" })
                    .child(div().text_color(t.secondary).child("Notifications appear at the bottom right. Dismiss them when you are finished."));
            }
            "accordion" => {
                let mut sections = accordion("sections", cx);
                for (index, (title, description)) in [
                    ("Appearance", "Uses the current Omarchy system theme, with Tokyo Night as the fallback. Change the theme from the application menu."),
                    ("Keyboard navigation", "Tab moves between controls. Return or Space activates the focused control. Escape closes an open menu or dialog."),
                    ("Workspace data", "Changes in this gallery stay in memory for this session. Resetting an example does not remove files on disk."),
                ].into_iter().enumerate() {
                    sections = sections.child(gpui_base::AccordionItem::new().open(self.expanded[index])
                        .header(gpui_base::AccordionHeader::new(accordion_trigger(("section", index), title, self.expanded[index], cx)
                            .debug_selector(move || format!("accordion-trigger-{index}"))
                            .on_change(change(cx.listener(move |this, next, _, cx| { this.expanded[index] = *next; cx.notify(); })))))
                        .panel(accordion_panel(cx).child(div().debug_selector(move || format!("accordion-panel-{index}")).child(description))));
                }
                content = content.child(sections);
            }
            "pagination" => {
                let listener = cx.listener(|this, page, _, cx| {
                    this.current_page = *page;
                    cx.notify();
                });
                let state = gpui_base::PaginationState::new(self.current_page, 12)
                    .on_change(move |page, window, cx| listener(&page, window, cx));
                content = content
                    .child(format!("Page {} of 12", self.current_page))
                    .child(pagination("pages", state, cx));
            }
            "table" => {
                let records = [
                    (
                        "Website refresh",
                        "Active",
                        Status::Success,
                        "Alex Lee",
                        "Sep 7",
                        "12 files",
                    ),
                    (
                        "Design system",
                        "Active",
                        Status::Success,
                        "Morgan Kim",
                        "Sep 6",
                        "28 files",
                    ),
                    (
                        "Release notes",
                        "Review",
                        Status::Warning,
                        "Sam Rivera",
                        "Sep 5",
                        "4 files",
                    ),
                    (
                        "Desktop client",
                        "Active",
                        Status::Success,
                        "Alex Lee",
                        "Sep 4",
                        "36 files",
                    ),
                    (
                        "Onboarding",
                        "Review",
                        Status::Warning,
                        "Morgan Kim",
                        "Sep 3",
                        "9 files",
                    ),
                    (
                        "Research archive",
                        "Archived",
                        Status::Neutral,
                        "Sam Rivera",
                        "Aug 28",
                        "42 files",
                    ),
                    (
                        "API reference",
                        "Active",
                        Status::Success,
                        "Alex Lee",
                        "Aug 26",
                        "17 files",
                    ),
                    (
                        "Brand assets",
                        "Archived",
                        Status::Neutral,
                        "Morgan Kim",
                        "Aug 21",
                        "24 files",
                    ),
                ];
                let mut heading = table_row("heading", 1, cx);
                for (index, title) in ["Project", "Status", "Owner", "Updated", "Files"]
                    .into_iter()
                    .enumerate()
                {
                    heading = heading.child(table_head(index, index + 1, cx).child(title));
                }
                content = content
                    .child(
                        div()
                            .flex()
                            .justify_between()
                            .child("Workspace projects")
                            .child(
                                div()
                                    .text_color(t.secondary)
                                    .child("8 projects · Sample data"),
                            ),
                    )
                    .child(
                        div()
                            .id("project-table-scroll")
                            .w_full()
                            .overflow_x_scroll()
                            .child(
                                table("projects", cx)
                                    .min_w(px(640.))
                                    .child(gpui_base::TableHeader::new("head").child(heading))
                                    .child(gpui_base::TableBody::new("body").children(
                                        records.into_iter().enumerate().map(
                                            |(
                                                index,
                                                (name, label, status, owner, updated, files),
                                            )| {
                                                table_row(index, index + 2, cx)
                                                    .child(
                                                        table_cell("name", 1, cx)
                                                            .child(div().truncate().child(name)),
                                                    )
                                                    .child(
                                                        table_cell("status", 2, cx).child(
                                                            div()
                                                                .text_color(match status {
                                                                    Status::Neutral => t.secondary,
                                                                    Status::Success => t.success,
                                                                    Status::Warning => t.warning,
                                                                    Status::Error => t.danger,
                                                                })
                                                                .child(label),
                                                        ),
                                                    )
                                                    .child(table_cell("owner", 3, cx).child(owner))
                                                    .child(
                                                        table_cell("updated", 4, cx).child(updated),
                                                    )
                                                    .child(table_cell("files", 5, cx).child(files))
                                            },
                                        ),
                                    )),
                            ),
                    );
            }
            "number_input" => {
                content = content
                    .child("Quantity")
                    .child(number_input(&self.number, cx))
                    .child("Arrow Up / Arrow Down  adjust by 1")
            }
            "input" => {
                content = content
                    .child("Workspace name")
                    .child(input("workspace-name", &self.input, window, cx).max_w(px(380.)))
                    .child(
                        div()
                            .flex()
                            .items_center()
                            .gap(px(8.))
                            .child(
                                button("submit-input", "Read value", ButtonVariant::Primary, cx)
                                    .on_click(cx.listener(|this, _, _, cx| {
                                        this.count = this.input.read(cx).value().chars().count();
                                        cx.notify();
                                    })),
                            )
                            .child(
                                button("reset-input", "Reset value", ButtonVariant::Outline, cx)
                                    .debug_selector(|| "reset-input".into())
                                    .on_click(cx.listener(|this, _, window, cx| {
                                        this.input.update(cx, |state, cx| {
                                            state.set_value("", window, cx);
                                            state.focus(window, cx);
                                        });
                                        this.count = 0;
                                        cx.notify();
                                    })),
                            ),
                    )
                    .child(format!("Submitted length: {} characters", self.count));
            }
            "textarea" => {
                content = content
                    .child("Workspace notes")
                    .child(textarea("notes", &self.textarea, window, cx).max_w(px(520.)))
                    .child("Supports multiple lines, selection, clipboard and IME")
            }
            "button" => {
                content = content.child(div().text_color(t.secondary).child("Appearance"));
                for (key, label, variant) in [
                    ("primary", "Primary", ButtonVariant::Primary),
                    ("outline", "Outline", ButtonVariant::Outline),
                    ("secondary", "Secondary", ButtonVariant::Secondary),
                    ("danger", "Danger", ButtonVariant::Danger),
                ] {
                    content = content.child(
                        div()
                            .flex()
                            .flex_wrap()
                            .items_center()
                            .gap(px(8.))
                            .child(div().w(px(90.)).text_color(t.secondary).child(label))
                            .child(button(key, "Apply", variant, cx).on_click(cx.listener(
                                |this, _, _, cx| {
                                    this.count += 1;
                                    cx.notify();
                                },
                            )))
                            .child(
                                button(
                                    (gpui::ElementId::from(key), "disabled"),
                                    "Unavailable",
                                    variant,
                                    cx,
                                )
                                .disabled(true),
                            ),
                    );
                }
                content = content
                    .child(div().text_color(t.secondary).child("Icons and actions"))
                    .child(
                        div()
                            .flex()
                            .flex_wrap()
                            .items_center()
                            .gap(px(8.))
                            .child(
                                button("icon-action", "", ButtonVariant::Outline, cx)
                                    .accessibility_label("Add workspace")
                                    .child(icon(IconName::Plus).size(px(14.)))
                                    .child("Add workspace")
                                    .on_click(cx.listener(|this, _, _, cx| {
                                        this.count += 1;
                                        cx.notify();
                                    })),
                            )
                            .child(with_tooltip(
                                button("icon-only", "", ButtonVariant::Outline, cx)
                                    .accessibility_label("Add workspace")
                                    .child(icon(IconName::Plus).size(px(14.)))
                                    .on_click(cx.listener(|this, _, _, cx| {
                                        this.count += 1;
                                        cx.notify();
                                    })),
                                "Add workspace",
                            ))
                            .child(
                                button("icon-disabled", "", ButtonVariant::Outline, cx)
                                    .accessibility_label("Add workspace unavailable")
                                    .child(icon(IconName::Plus).size(px(14.)))
                                    .disabled(true),
                            )
                            .child(
                                button("reset-count", "Reset", ButtonVariant::Secondary, cx)
                                    .on_click(cx.listener(|this, _, _, cx| {
                                        this.count = 0;
                                        cx.notify();
                                    })),
                            ),
                    )
                    .child(
                        div()
                            .text_color(t.secondary)
                            .child(format!("Activations: {}", self.count)),
                    );
            }
            "checkbox" => {
                let state = if self.mixed {
                    CheckboxState::Indeterminate
                } else if self.checked {
                    CheckboxState::Checked
                } else {
                    CheckboxState::Unchecked
                };
                content = content
                    .child(
                        checkbox("check", "Include hidden files", state, cx).on_change(change(
                            cx.listener(|this, next, _, cx| {
                                this.checked = *next == CheckboxState::Checked;
                                this.mixed = false;
                                cx.notify();
                            }),
                        )),
                    )
                    .child(
                        checkbox(
                            "check-disabled",
                            "Managed by policy",
                            CheckboxState::Checked,
                            cx,
                        )
                        .disabled(true),
                    )
                    .child(
                        button("mixed", "Set mixed state", ButtonVariant::Secondary, cx).on_click(
                            cx.listener(|this, _, _, cx| {
                                this.mixed = true;
                                cx.notify();
                            }),
                        ),
                    );
            }
            "switch" => {
                content = content
                    .child(
                        switch("switch", "Show metadata", self.enabled, cx).on_change(change(
                            cx.listener(|this, next, _, cx| {
                                this.enabled = *next;
                                cx.notify();
                            }),
                        )),
                    )
                    .child(if self.enabled {
                        "Metadata visible"
                    } else {
                        "Metadata hidden"
                    })
            }
            "radio" => {
                for (index, label) in ["Compact", "Comfortable", "Spacious"]
                    .into_iter()
                    .enumerate()
                {
                    content =
                        content.child(radio(index, label, self.choice == index, cx).on_change(
                            change(cx.listener(move |this, _, _, cx| {
                                this.choice = index;
                                cx.notify();
                            })),
                        ));
                }
            }
            "toggle" => {
                content = content.child(
                    toggle("toggle", "Favorite panel", self.pressed, cx).on_change(change(
                        cx.listener(|this, next, _, cx| {
                            this.pressed = *next;
                            cx.notify();
                        }),
                    )),
                )
            }
            "link" => {
                content = content
                    .child(link(
                        "manual",
                        "Open Omarchy manual",
                        "https://omarchy.org/manual",
                        cx,
                    ))
                    .child(
                        link(
                            "disabled-link",
                            "Unavailable link",
                            "https://omarchy.org",
                            cx,
                        )
                        .disabled(true),
                    )
            }
            "button_group" => {
                let labels = ["Top", "Right", "Bottom", "Left"];
                let target = cx.entity();
                let group = button_group(
                    "toolbar-position",
                    labels
                        .iter()
                        .map(|&label| ChoiceItem::new(label, label))
                        .collect(),
                    Some(self.toolbar_position),
                    move |index, _, cx| {
                        target.update(cx, |this, cx| {
                            this.toolbar_position = index;
                            cx.notify();
                        })
                    },
                    window,
                    cx,
                );
                content = content
                    .child("Toolbar position")
                    .child(group.aria_label("Toolbar position"))
                    .child(div().text_color(t.secondary).child(format!(
                        "Toolbar is placed at the {}.",
                        labels[self.toolbar_position].to_lowercase()
                    )))
                    .child(
                        div()
                            .text_color(t.secondary)
                            .child("Left / Right move the cursor · Return / Space choose"),
                    );
            }
            "tabs" => {
                let labels = ["Overview", "Activity", "Settings"];
                let target = cx.entity();
                let strip = tab_list(
                    "workspace-tabs",
                    labels
                        .iter()
                        .map(|&label| ChoiceItem::new(label, label))
                        .collect(),
                    Some(self.tab),
                    move |index, _, cx| {
                        target.update(cx, |this, cx| {
                            this.tab = index;
                            cx.notify();
                        })
                    },
                    window,
                    cx,
                );
                let mut body = div()
                    .id("workspace-tab-panel")
                    .role(gpui::Role::TabPanel)
                    .flex()
                    .flex_col()
                    .gap(px(14.))
                    .p(px(14.))
                    .w_full()
                    .min_h(px(240.))
                    .bg(t.normal_fill());
                match self.tab {
                    0 => {
                        body = body
                            .child(
                                div()
                                    .font_weight(gpui::FontWeight::BOLD)
                                    .child("Personal workspace"),
                            )
                            .child(
                                div()
                                    .text_color(t.secondary)
                                    .child("Your files and projects, organized in one place."),
                            );
                        for (name, detail) in [
                            ("Documents", "Notes and reference material"),
                            ("Projects", "Active work and experiments"),
                            ("Archive", "Completed projects"),
                        ] {
                            body = body.child(
                                div()
                                    .flex()
                                    .justify_between()
                                    .gap(px(14.))
                                    .border_b_1()
                                    .border_color(t.divider())
                                    .pb(px(10.))
                                    .child(name)
                                    .child(div().text_color(t.secondary).child(detail)),
                            );
                        }
                    }
                    1 => {
                        body = body
                            .child(
                                div()
                                    .font_weight(gpui::FontWeight::BOLD)
                                    .child("Recent activity"),
                            )
                            .child(
                                div()
                                    .text_color(t.secondary)
                                    .child("Sample workspace history"),
                            );
                        for (event, time) in [
                            ("Updated project notes", "Today · 09:42"),
                            ("Added a reference document", "Today · 09:15"),
                            ("Archived a completed project", "Yesterday · 16:30"),
                        ] {
                            body = body.child(
                                div()
                                    .flex()
                                    .justify_between()
                                    .gap(px(14.))
                                    .border_b_1()
                                    .border_color(t.divider())
                                    .pb(px(10.))
                                    .child(event)
                                    .child(div().text_color(t.secondary).child(time)),
                            );
                        }
                    }
                    _ => {
                        body = body.child("Workspace name")
                            .child(input("tab-workspace-name", &self.workspace_name, window, cx).max_w(px(360.)))
                            .child(switch("tab-sync", "Sync workspace", self.enabled, cx)
                                .debug_selector(|| "tab-sync".into())
                                .on_change(change(cx.listener(|this, next, _, cx| { this.enabled = *next; cx.notify(); }))))
                            .child(div().text_color(t.secondary).child("Changes apply immediately and remain available when you switch tabs."));
                    }
                }
                content = content
                    .child(strip.aria_label("Workspace pages"))
                    .child(body);
            }
            "editor" => {
                content = content
                    .child("main.rs")
                    .child(editor("source-editor", &self.editor_state, window, cx))
                    .child(
                        div()
                            .text_color(t.secondary)
                            .child("Tab indents · Use the system undo and clipboard shortcuts"),
                    )
                    .child(
                        button("reset-editor", "Reset example", ButtonVariant::Outline, cx)
                            .on_click(cx.listener(|this, _, window, cx| {
                                this.editor_state.update(cx, |state, cx| {
                                    state.set_value(
                                        "fn main() {\n    println!(\"Hello, workspace\");\n}\n",
                                        window,
                                        cx,
                                    );
                                })
                            })),
                    );
            }
            "nav_stack" => {
                content = content
                    .child(
                        div()
                            .flex()
                            .items_center()
                            .gap(px(8.))
                            .child(
                                button("nav-back", "Back", ButtonVariant::Outline, cx)
                                    .debug_selector(|| "nav-back".into())
                                    .disabled(self.nav_state.read(cx).depth() <= 1)
                                    .on_click(cx.listener(|this, _, _, cx| {
                                        this.nav_state.update(cx, |state, cx| {
                                            state.pop(gpui_base::NavMotion::Immediate, cx);
                                        });
                                    })),
                            )
                            .child(
                                button("nav-forward", "Forward", ButtonVariant::Outline, cx)
                                    .debug_selector(|| "nav-forward".into())
                                    .disabled(self.nav_state.read(cx).forward_views().len() == 0)
                                    .on_click(cx.listener(|this, _, _, cx| {
                                        this.nav_state.update(cx, |state, cx| {
                                            state.forward(gpui_base::NavMotion::Immediate, cx);
                                        });
                                    })),
                            )
                            .child(div().text_color(t.secondary).child(
                                match self.nav_state.read(cx).depth() {
                                    1 => "Projects",
                                    2 => "Projects / Website refresh",
                                    _ => "Projects / Website refresh / Review homepage",
                                },
                            )),
                    )
                    .child(nav_stack(&self.nav_state, cx).h(px(340.)))
                    .child(div().text_color(t.secondary).child(
                        "Try it: open Website refresh, open its task, edit the note, then go Back and Forward. Your note stays on the task page.",
                    ));
            }
            "otp_input" => {
                content = content
                    .child("Verification code")
                    .child(otp_input(&self.otp_state, window, cx))
                    .child(div().text_color(t.secondary).child(
                        "Demo only — no code is sent. Type six digits; Backspace removes a digit.",
                    ))
                    .child(if self.otp_state.read(cx).value().len() == 6 {
                        "Code complete"
                    } else {
                        "Waiting for six digits"
                    })
                    .child(
                        button("reset-otp", "Reset code", ButtonVariant::Outline, cx).on_click(
                            cx.listener(|this, _, window, cx| {
                                this.otp_state.update(cx, |state, cx| {
                                    state.set_value("", window, cx);
                                    state.focus(window, cx);
                                })
                            }),
                        ),
                    );
            }
            "hover_card" => {
                content = content
                    .child("Workspace owner")
                    .child(hover_card(
                        "member-preview",
                        div()
                            .flex()
                            .items_center()
                            .gap(px(8.))
                            .child(avatar("AL", cx))
                            .child("Alex Lee"),
                        |_, _, cx| {
                            div()
                                .flex()
                                .flex_col()
                                .gap(px(10.))
                                .child(div().font_weight(FontWeight::BOLD).child("Alex Lee"))
                                .child("Design engineer · Workspace owner")
                                .child(div().text_color(cx.omarchy().secondary).child(
                                    "Maintains the design system and reviews desktop releases.",
                                ))
                        },
                    ))
                    .child(
                        div()
                            .text_color(t.secondary)
                            .child("Hover over the member to preview their profile."),
                    );
            }
            "dock" => {
                content = content
                    .child(button("reset-dock", "Reset layout", ButtonVariant::Outline, cx)
                        .on_click(cx.listener(|this, _, window, cx| {
                            let layout = demo_dock_layout(cx);
                            this.dock_state.update(cx, |state, cx| state.set_center(layout, window, cx));
                        })))
                    .child(div().w_full().h(px(360.)).child(self.dock_state.clone()))
                    .child(div().text_color(t.secondary).child("Drag tabs to merge or split panes. Drag a divider to resize. Reset layout restores all three panels."));
            }
            "tree" => {
                content = content
                    .child("Workspace files")
                    .child(tree(&self.tree_state, cx).max_w(px(440.)))
                    .child(
                        div().text_color(t.secondary).child(
                            self.tree_state
                                .read(cx)
                                .selected_item()
                                .map(|item| format!("Selected: {}", item.label))
                                .unwrap_or_else(|| "Select a file or folder".into()),
                        ),
                    )
                    .child(
                        div()
                            .text_color(t.secondary)
                            .child("Arrow keys navigate · Left / Right collapse and expand"),
                    );
            }
            "resizable" => {
                content = content.child("Horizontal").child(div().w_full().h(px(300.)).border_1().border_color(t.border)
                    .child(resizable("workspace-panes", gpui::Axis::Horizontal, cx)
                        .child(resizable_panel().size(px(220.)).size_range(px(140.)..px(420.))
                            .child(div().size_full().p(px(14.)).flex().flex_col().gap(px(10.))
                                .child("Documents").child("Project brief.md").child("Meeting notes.md")))
                        .child(resizable_panel().size_range(px(180.)..px(1600.))
                            .child(div().size_full().p(px(14.)).flex().flex_col().gap(px(14.))
                                .child(div().font_weight(FontWeight::BOLD).child("Project brief"))
                                .child("A focused desktop workspace for files, notes and project activity.")
                                .child(div().text_color(t.secondary).child("Drag the divider to give this preview more room."))))));
                content = content.child("Vertical").child(
                    div()
                        .w_full()
                        .h(px(240.))
                        .border_1()
                        .border_color(t.border)
                        .child(
                            resizable("preview-console", gpui::Axis::Vertical, cx)
                                .child(
                                    resizable_panel()
                                        .size(px(140.))
                                        .size_range(px(80.)..px(180.))
                                        .child(
                                            div()
                                                .size_full()
                                                .p(px(14.))
                                                .flex()
                                                .flex_col()
                                                .gap(px(10.))
                                                .child("Preview")
                                                .child("The workspace is ready for review."),
                                        ),
                                )
                                .child(
                                    resizable_panel().size_range(px(60.)..px(160.)).child(
                                        div()
                                            .size_full()
                                            .p(px(14.))
                                            .flex()
                                            .flex_col()
                                            .gap(px(10.))
                                            .child("Activity")
                                            .child(
                                                div()
                                                    .text_color(t.secondary)
                                                    .child("All changes saved · No pending tasks"),
                                            ),
                                    ),
                                ),
                        ),
                );
            }
            "date_picker" => {
                content = content
                    .child("Review date")
                    .child(date_picker("review-date", &self.date_picker_state, cx))
                    .child(
                        div()
                            .text_color(t.secondary)
                            .child("Select a day to confirm. Escape cancels the calendar."),
                    );
            }
            "calendar" => {
                content = content
                    .child("Schedule a workspace review")
                    .child(calendar("review-calendar", &self.calendar_state, cx))
                    .child(
                        div()
                            .text_color(t.secondary)
                            .child("Choose a weekday. Weekends are unavailable."),
                    )
                    .child(
                        self.calendar_state
                            .read(cx)
                            .date()
                            .format("%A, %B %e, %Y")
                            .unwrap_or_else(|| "No date selected".into()),
                    )
                    .child(
                        button("clear-date", "Clear date", ButtonVariant::Outline, cx).on_click(
                            cx.listener(|this, _, window, cx| {
                                this.calendar_state.update(cx, |state, cx| {
                                    state.set_date(gpui_base::Date::Single(None), window, cx)
                                });
                            }),
                        ),
                    );
            }
            "avatar" => {
                content = content.child(
                    div()
                        .font_weight(FontWeight::BOLD)
                        .child("Workspace members"),
                );
                for (initials, name, role) in [
                    ("HL", "huacnlee", "Owner"),
                    ("MK", "Morgan Kim", "Editor"),
                    ("SR", "Sam Rivera", "Viewer"),
                ] {
                    content = content.child(
                        div()
                            .flex()
                            .items_center()
                            .gap(px(10.))
                            .pb(px(10.))
                            .border_b_1()
                            .border_color(t.divider())
                            .child(avatar(initials, cx).when(initials == "HL", |avatar| {
                                avatar.image(avatar_image(gallery_avatar()))
                            }))
                            .child(div().flex_1().child(name))
                            .child(div().text_color(t.secondary).child(role)),
                    );
                }
                content = content
                    .child(div().text_color(t.secondary).child("Sizes"))
                    .child(
                        div()
                            .flex()
                            .items_center()
                            .gap(px(14.))
                            .child(
                                avatar("HL", cx)
                                    .image(avatar_image(gallery_avatar()))
                                    .size(px(24.))
                                    .text_size(px(10.)),
                            )
                            .child(avatar("HL", cx).image(avatar_image(gallery_avatar())))
                            .child(
                                avatar("HL", cx)
                                    .image(avatar_image(gallery_avatar()))
                                    .size(px(48.))
                                    .text_size(px(16.)),
                            ),
                    );
            }
            "panel" => {
                content = content.child(
                    panel("Workspace", cx)
                        .child("Theme-aware surface with a title and composable children")
                        .child(badge("Ready", Status::Success, cx)),
                )
            }
            "separator" => {
                content = content
                    .child(div().text_color(t.secondary).child("Horizontal"))
                    .child("Appearance")
                    .child(separator(cx))
                    .child("Keyboard")
                    .child(div().mt(px(14.)).text_color(t.secondary).child("Vertical"))
                    .child(
                        div()
                            .flex()
                            .items_center()
                            .gap(px(10.))
                            .child(
                                button("separator-add", "Add", ButtonVariant::Secondary, cx)
                                    .on_click(cx.listener(|this, _, _, cx| {
                                        this.count += 1;
                                        cx.notify();
                                    })),
                            )
                            .child(vertical_separator(cx))
                            .child(
                                button("separator-reset", "Reset", ButtonVariant::Secondary, cx)
                                    .on_click(cx.listener(|this, _, _, cx| {
                                        this.count = 0;
                                        cx.notify();
                                    })),
                            )
                            .child(vertical_separator(cx))
                            .child(format!("{} items", self.count)),
                    )
            }
            "keycap" => {
                content = content.child(
                    div()
                        .flex()
                        .items_center()
                        .gap(px(8.))
                        .child(keycap("Tab", cx))
                        .child("Next control")
                        .child(keycap("Return", cx))
                        .child("Activate"),
                )
            }
            "badge" => {
                for (label, status) in [
                    ("Idle", Status::Neutral),
                    ("Applied", Status::Success),
                    ("Needs attention", Status::Warning),
                    ("Failed", Status::Error),
                ] {
                    content = content.child(badge(label, status, cx));
                }
            }
            "empty_state" => {
                content = if self.count == 0 {
                    content.child(
                        empty_state(
                            "No workspaces",
                            "Create a workspace to collect your projects.",
                            cx,
                        )
                        .child(
                            button("create", "Create workspace", ButtonVariant::Primary, cx)
                                .on_click(cx.listener(|this, _, _, cx| {
                                    this.count = 1;
                                    cx.notify();
                                })),
                        ),
                    )
                } else {
                    content.child("Workspace created").child(
                        button("reset-empty", "Reset example", ButtonVariant::Secondary, cx)
                            .on_click(cx.listener(|this, _, _, cx| {
                                this.count = 0;
                                cx.notify();
                            })),
                    )
                };
            }
            "progress" => {
                content = content
                    .child(format!("Progress: {:.0}%", self.progress))
                    .child(progress("progress", self.progress, cx))
                    .child(
                        div()
                            .flex()
                            .items_center()
                            .gap(px(8.))
                            .child(
                                button("advance", "Advance 10%", ButtonVariant::Primary, cx)
                                    .on_click(cx.listener(|this, _, _, cx| {
                                        this.progress = (this.progress + 10.).min(100.);
                                        cx.notify();
                                    })),
                            )
                            .child(
                                button("reset", "Reset", ButtonVariant::Secondary, cx).on_click(
                                    cx.listener(|this, _, _, cx| {
                                        this.progress = 0.;
                                        cx.notify();
                                    }),
                                ),
                            ),
                    );
            }
            _ => unreachable!(),
        }
        let sidebar_width = if window.viewport_size().width < px(700.) {
            148.
        } else {
            196.
        };
        let navigation = div()
            .id("component-sidebar")
            .track_focus(&self.navigation_focus)
            .w(px(sidebar_width))
            .h_full()
            .flex_shrink_0()
            .overflow_y_scroll()
            .border_r_1()
            .border_color(t.divider())
            .bg(t.background)
            .p(px(8.))
            .on_key_down(cx.listener(|this, event: &KeyDownEvent, _, cx| {
                if event.keystroke.modifiers.modified() {
                    return;
                }
                let items: Vec<_> = components().collect();
                let current = items
                    .iter()
                    .position(|&item| item == this.page)
                    .unwrap_or(0);
                let next = match event.keystroke.key.as_str() {
                    "down" | "j" => (current + 1).min(items.len() - 1),
                    "up" | "k" => current.saturating_sub(1),
                    "home" => 0,
                    "end" => items.len() - 1,
                    _ => return,
                };
                this.page = items[next];
                cx.stop_propagation();
                cx.notify();
            }))
            .children(GROUPS.iter().map(|(group, items)| {
                div()
                    .flex()
                    .flex_col()
                    .gap(px(2.))
                    .mb(px(12.))
                    .child(
                        div()
                            .px(px(8.))
                            .py(px(6.))
                            .text_size(px(10.))
                            .font_weight(FontWeight::BOLD)
                            .text_color(t.secondary)
                            .child(*group),
                    )
                    .children(items.iter().map(|&name| {
                        let selected = self.page == name;
                        button(name, display_name(name), ButtonVariant::Secondary, cx)
                            .w_full()
                            .justify_start()
                            .px(px(8.))
                            .py(px(5.))
                            .border_color(t.foreground.opacity(0.))
                            .selected(selected)
                            .focusable(false)
                            .styles(|styles| {
                                styles.selected(|style| {
                                    style
                                        .bg(t.hover_fill())
                                        .text_color(t.accent)
                                        .font_weight(FontWeight::NORMAL)
                                })
                            })
                            .on_click(cx.listener(move |this, _, window, cx| {
                                this.page = name;
                                window.focus(&this.navigation_focus, cx);
                                cx.notify();
                            }))
                    }))
            }));
        focus_scope("gallery")
            .relative()
            .debug_selector(|| "gallery-root".into())
            .size_full()
            .flex()
            .flex_col()
            .bg(t.background)
            .text_color(t.foreground)
            .font_family(t.font.clone())
            .text_size(px(12.))
            .child(
                div()
                    .flex()
                    .flex_wrap()
                    .items_center()
                    .justify_between()
                    .gap(px(8.))
                    .px(px(14.))
                    .py(px(10.))
                    .border_b_1()
                    .border_color(t.divider())
                    .child(
                        div()
                            .text_size(px(14.))
                            .font_weight(FontWeight::BOLD)
                            .flex_1()
                            .on_mouse_down(gpui::MouseButton::Left, |_, window, _| {
                                window.start_window_move()
                            })
                            .child("GPUI Omarchy"),
                    )
                    .child(menu(
                        "application-menu",
                        with_tooltip(
                            button(
                                "application-menu-trigger",
                                "Menu",
                                ButtonVariant::Secondary,
                                cx,
                            )
                            .child(icon(IconName::ChevronDown).size(px(14.))),
                            "Appearance and application commands",
                        ),
                        vec![
                            MenuItem::new("System theme").checked(self.theme_mode == 0),
                            MenuItem::new("Tokyo Night").checked(self.theme_mode == 1),
                            MenuItem::new("Flexoki Light").checked(self.theme_mode == 2),
                            MenuItem::new("Exit").separator_before(),
                        ],
                        {
                            let target = cx.entity();
                            move |index, _, cx| {
                                target.update(cx, |this, cx| {
                                    match index {
                                        0 => Theme::system_or_default().apply(cx),
                                        1 => Theme::tokyo_night().apply(cx),
                                        2 => Theme::flexoki_light().apply(cx),
                                        _ => {
                                            cx.quit();
                                            return;
                                        }
                                    }
                                    this.theme_mode = index;
                                    cx.notify();
                                })
                            }
                        },
                    )),
            )
            .child(
                div().flex().flex_1().min_h_0().child(navigation).child(
                    div()
                        .id("component-content")
                        .flex_1()
                        .min_w_0()
                        .h_full()
                        .overflow_y_scroll()
                        .p(px(28.))
                        .child(
                            div()
                                .flex()
                                .flex_col()
                                .gap(px(14.))
                                .max_w(px(760.))
                                .child(
                                    div()
                                        .text_size(px(16.))
                                        .font_weight(FontWeight::BOLD)
                                        .child(display_name(self.page)),
                                )
                                .child(div().text_color(t.secondary).child(description(self.page)))
                                .child(div().mt(px(14.)).child(content)),
                        ),
                ),
            )
            .child(
                div()
                    .w_full()
                    .min_w_0()
                    .flex_shrink_0()
                    .px(px(14.))
                    .py(px(8.))
                    .border_t_1()
                    .border_color(t.divider())
                    .text_color(t.secondary)
                    .flex()
                    .flex_wrap()
                    .items_center()
                    .justify_between()
                    .gap(px(8.))
                    .child(div().child(
                        "↑↓ / j k  component · Tab / Shift + Tab  focus · Return / Space  activate",
                    ))
                    .child(
                        div().flex().flex_1().min_w(px(320.)).justify_end().child(
                            link(
                                "repository",
                                "https://github.com/huacnlee/gpui-omarchy",
                                "https://github.com/huacnlee/gpui-omarchy",
                                cx,
                            )
                            .py(px(0.))
                            .px(px(0.))
                            .flex_shrink_0()
                            .debug_selector(|| "gallery-repository".into())
                            .text_color(t.secondary),
                        ),
                    ),
            )
            .when_some(self.toast_message, |root, message| {
                root.child(
                    div()
                        .absolute()
                        .right(px(14.))
                        .bottom(px(48.))
                        .w(px(320.))
                        .occlude()
                        .child(
                            toast("gallery-toast", cx)
                                .debug_selector(|| "gallery-toast".into())
                                .child(
                                    div()
                                        .flex()
                                        .items_center()
                                        .gap(px(10.))
                                        .child(
                                            icon(if message != "Could not sync workspace" {
                                                IconName::Check
                                            } else {
                                                IconName::TriangleAlert
                                            })
                                            .size(px(16.)),
                                        )
                                        .child(div().flex_1().child(message))
                                        .child(
                                            button(
                                                "dismiss-toast",
                                                "",
                                                ButtonVariant::Secondary,
                                                cx,
                                            )
                                            .size(px(18.))
                                            .p(px(0.))
                                            .flex_shrink_0()
                                            .debug_selector(|| "dismiss-toast".into())
                                            .accessibility_label("Dismiss notification")
                                            .child(icon(IconName::Close).size(px(14.)))
                                            .on_click(
                                                cx.listener(|this, _, _, cx| {
                                                    this.toast_message = None;
                                                    cx.notify();
                                                }),
                                            ),
                                        ),
                                )
                                .child(
                                    button(
                                        "toast-action",
                                        if message == "Workspace saved" {
                                            "Undo"
                                        } else if message == "Could not sync workspace" {
                                            "Retry"
                                        } else {
                                            "Dismiss"
                                        },
                                        ButtonVariant::Outline,
                                        cx,
                                    )
                                    .on_click(cx.listener(
                                        |this, _, _, cx| {
                                            match this.toast_message {
                                                Some("Workspace saved") => {
                                                    this.toast_saved = false;
                                                    this.toast_message = Some("Save undone");
                                                }
                                                Some("Could not sync workspace") => {
                                                    this.toast_saved = true;
                                                    this.toast_message = Some("Workspace saved");
                                                }
                                                _ => this.toast_message = None,
                                            }
                                            cx.notify();
                                        },
                                    )),
                                ),
                        ),
                )
            })
    }
}

fn demo_dock_layout(cx: &mut App) -> gpui_base::dock::DockLayout {
    use gpui_base::dock::DockLayout;
    let files = cx.new(|cx| DemoDockPanel {
        title: "Files",
        focus: cx.focus_handle(),
    });
    let notes = cx.new(|cx| DemoDockPanel {
        title: "Notes",
        focus: cx.focus_handle(),
    });
    let preview = cx.new(|cx| DemoDockPanel {
        title: "Preview",
        focus: cx.focus_handle(),
    });
    DockLayout::h_split()
        .child(DockLayout::tabs().panel(files).panel(notes), Some(px(280.)))
        .child(DockLayout::tabs().panel(preview), None)
}

struct DemoDockPanel {
    title: &'static str,
    focus: FocusHandle,
}
impl gpui::EventEmitter<gpui_base::dock::PanelEvent> for DemoDockPanel {}
impl gpui::Focusable for DemoDockPanel {
    fn focus_handle(&self, _: &App) -> FocusHandle {
        self.focus.clone()
    }
}
impl gpui_base::dock::Panel for DemoDockPanel {
    fn panel_name(&self) -> &'static str {
        self.title
    }
}
impl gpui::Render for DemoDockPanel {
    fn render(&mut self, _: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        div()
            .size_full()
            .p(px(14.))
            .flex()
            .flex_col()
            .gap(px(10.))
            .track_focus(&self.focus)
            .child(div().font_weight(FontWeight::BOLD).child(self.title))
            .children(
                match self.title {
                    "Files" => vec![
                        "Project brief.md",
                        "Meeting notes.md",
                        "Release checklist.md",
                    ],
                    "Notes" => vec![
                        "Workspace review",
                        "Refine the navigation and preview layout.",
                        "Prepare release documentation.",
                    ],
                    _ => vec![
                        "Project brief",
                        "A focused desktop workspace for files, notes and project activity.",
                    ],
                }
                .into_iter()
                .map(|text| div().text_color(cx.omarchy().secondary).child(text)),
            )
    }
}

fn gallery_avatar() -> std::sync::Arc<gpui::Image> {
    static IMAGE: std::sync::OnceLock<std::sync::Arc<gpui::Image>> = std::sync::OnceLock::new();
    IMAGE
        .get_or_init(|| {
            std::sync::Arc::new(gpui::Image::from_bytes(
                gpui::ImageFormat::Png,
                include_bytes!("../assets/huacnlee.png").to_vec(),
            ))
        })
        .clone()
}

struct NavigationPage {
    level: usize,
    next: Option<Entity<NavigationPage>>,
    navigation: gpui::WeakEntity<gpui_base::NavStackState>,
    notes: Entity<gpui_base::input::InputState>,
}
impl gpui::Render for NavigationPage {
    fn render(&mut self, window: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        let t = cx.omarchy().clone();
        let (title, description) = match self.level {
            0 => ("Projects", "Choose a project to see its tasks."),
            1 => (
                "Website refresh",
                "Update the homepage for the autumn release.",
            ),
            _ => ("Review homepage", "Website refresh · Alex Lee · Due Friday"),
        };
        let mut page = div()
            .id("navigation-page")
            .size_full()
            .overflow_y_scroll()
            .p(px(18.))
            .flex()
            .flex_col()
            .gap(px(14.))
            .child(
                div()
                    .text_size(px(16.))
                    .font_weight(FontWeight::BOLD)
                    .child(title),
            )
            .child(div().text_color(t.secondary).child(description));
        if self.level < 2 {
            let (name, detail) = if self.level == 0 {
                (
                    "Website refresh",
                    "Alex Lee · 1 task to review · Updated today",
                )
            } else {
                ("Review homepage", "In review · Due Friday")
            };
            page = page.child(
                button("nav-open", "", ButtonVariant::Outline, cx)
                    .debug_selector(|| "nav-open".to_string())
                    .w_full()
                    .justify_between()
                    .py(px(12.))
                    .child(
                        div()
                            .flex()
                            .flex_col()
                            .items_start()
                            .gap(px(4.))
                            .child(name)
                            .child(div().text_color(t.secondary).child(detail)),
                    )
                    .child(icon(IconName::ChevronRight))
                    .on_click(cx.listener(|this, _, _, cx| {
                        if let (Some(navigation), Some(next)) =
                            (this.navigation.upgrade(), this.next.clone())
                        {
                            navigation.update(cx, |state, cx| {
                                state.push(next, gpui_base::NavMotion::Immediate, cx)
                            });
                        }
                    })),
            );
            page = page.child(div().text_color(t.secondary).child(if self.level == 0 {
                "1 active project"
            } else {
                "Review the layout and leave a note before approving the release."
            }));
        } else {
            page =
                page.child(div().child("Review checklist"))
                    .child(div().text_color(t.secondary).child(
                        "Confirm the heading, navigation and images work in a narrow window.",
                    ))
                    .child("Review note")
                    .child(
                        input("nav-note", &self.notes, window, cx)
                            .debug_selector(|| "nav-note".to_string())
                            .w_full(),
                    )
                    .child(div().text_color(t.secondary).child(
                        "Kept in this demo while you navigate. Nothing is sent or saved to disk.",
                    ));
        }
        page
    }
}

pub fn run() {
    gpui_platform::application().run(move |cx| {
        gpui_omarchy::init(cx);
        cx.open_window(
            WindowOptions {
                titlebar: None,
                window_min_size: Some(size(px(680.), px(520.))),
                window_bounds: Some(WindowBounds::Windowed(Bounds::centered(
                    None,
                    size(px(1060.), px(760.)),
                    cx,
                ))),
                ..Default::default()
            },
            |window, cx| cx.new(|cx| Gallery::new(window, cx)),
        )
        .expect("open component gallery");
        cx.activate(true);
    });
}

fn change<T>(
    listener: impl Fn(&T, &mut Window, &mut App) + 'static,
) -> impl Fn(T, &ClickEvent, &mut Window, &mut App) {
    move |value, _, window, cx| listener(&value, window, cx)
}

#[cfg(test)]
mod tests {
    use super::*;
    use gpui::TestAppContext;

    #[gpui::test]
    fn dialogs_cancel_confirm_and_restore_focus(cx: &mut TestAppContext) {
        cx.update(gpui_omarchy::init);
        let (view, cx) = cx.add_window_view(Gallery::new);
        for page in ["dialog", "alert_dialog"] {
            for (key, result) in [("escape", "Cancelled"), ("enter", "Confirmed")] {
                view.update(cx, |this, cx| {
                    this.page = page;
                    this.modal_open = true;
                    cx.notify();
                });
                cx.update(|window, cx| {
                    view.read(cx).modal_focus.clone().focus(window, cx);
                    window.draw(cx).clear(cx);
                });
                cx.simulate_keystrokes(key);
                cx.update(|window, cx| {
                    window.draw(cx).clear(cx);
                    let this = view.read(cx);
                    assert!(!this.modal_open, "{page}: {key}");
                    assert_eq!(
                        this.modal_result,
                        if result == "Cancelled" {
                            "Changes discarded"
                        } else if page == "alert_dialog" {
                            "Workspace defaults restored"
                        } else {
                            "Saved “Personal workspace”"
                        }
                    );
                    assert!(this.modal_trigger.is_focused(window));
                });
            }
        }
    }

    #[gpui::test]
    fn dialog_rejects_blank_name_without_losing_draft(cx: &mut TestAppContext) {
        cx.update(gpui_omarchy::init);
        let (view, cx) = cx.add_window_view(Gallery::new);
        cx.update(|window, cx| {
            view.update(cx, |this, cx| {
                this.page = "dialog";
                this.modal_open = true;
                this.workspace_draft
                    .update(cx, |state, cx| state.set_value("   ", window, cx));
                this.modal_focus.focus(window, cx);
                cx.notify();
            });
            window.draw(cx).clear(cx);
        });
        cx.simulate_keystrokes("enter");
        cx.update(|window, cx| {
            window.draw(cx).clear(cx);
            let this = view.read(cx);
            assert!(this.modal_open);
            assert_eq!(this.saved_workspace, "Personal workspace");
            assert_eq!(this.workspace_draft.read(cx).value().as_ref(), "   ");
        });
    }

    #[gpui::test]
    fn sidebar_keys_switch_components_without_intercepting_text_input(cx: &mut TestAppContext) {
        cx.update(gpui_omarchy::init);
        let (view, cx) = cx.add_window_view(Gallery::new);
        cx.update(|window, cx| view.read(cx).navigation_focus.clone().focus(window, cx));
        cx.update(|window, cx| window.draw(cx).clear(cx));
        cx.simulate_keystrokes("j");
        cx.update(|_, cx| assert_eq!(view.read(cx).page, "button"));
        cx.simulate_keystrokes("end");
        cx.update(|_, cx| assert_eq!(view.read(cx).page, "progress"));
        cx.simulate_keystrokes("home");
        cx.update(|_, cx| assert_eq!(view.read(cx).page, "overview"));
        cx.update(|window, cx| {
            view.update(cx, |this, cx| {
                this.page = "input";
                this.input.update(cx, |state, cx| state.focus(window, cx));
                cx.notify();
            });
            window.draw(cx).clear(cx);
        });
        cx.simulate_input("jk");
        cx.update(|_, cx| assert_eq!(view.read(cx).page, "input"));
        cx.update(|_, cx| assert_eq!(view.read(cx).input.read(cx).value().as_ref(), "jk"));
    }

    #[gpui::test]
    fn toast_is_bottom_right_and_dismissible_over_page_content(cx: &mut TestAppContext) {
        cx.update(gpui_omarchy::init);
        let (view, cx) = cx.add_window_view(Gallery::new);
        view.update(cx, |this, cx| {
            this.page = "toast";
            this.toast_message = Some("Workspace saved");
            this.toast_saved = true;
            cx.notify();
        });
        cx.update(|window, cx| window.draw(cx).clear(cx));
        let root = cx.debug_bounds("gallery-root").unwrap();
        let notification = cx.debug_bounds("gallery-toast").unwrap();
        assert_eq!(root.right() - notification.right(), px(14.));
        assert_eq!(root.bottom() - notification.bottom(), px(48.));
        let close = cx.debug_bounds("dismiss-toast").unwrap();
        cx.simulate_click(close.center(), Default::default());
        cx.update(|window, cx| window.draw(cx).clear(cx));
        assert!(cx.debug_bounds("gallery-toast").is_none());
        cx.update(|_, cx| {
            assert!(
                view.read(cx).toast_saved,
                "dismissing does not undo the save"
            )
        });
    }

    #[gpui::test]
    fn disclosure_examples_preserve_independent_state(cx: &mut TestAppContext) {
        cx.update(gpui_omarchy::init);
        let (view, cx) = cx.add_window_view(Gallery::new);
        view.update(cx, |this, cx| {
            this.page = "accordion";
            cx.notify();
        });
        cx.update(|window, cx| window.draw(cx).clear(cx));
        assert!(cx.debug_bounds("accordion-panel-0").is_some());
        assert!(cx.debug_bounds("accordion-panel-1").is_none());
        for selector in ["accordion-trigger-1", "accordion-trigger-2"] {
            let bounds = cx.debug_bounds(selector).unwrap();
            cx.simulate_click(bounds.center(), Default::default());
            cx.update(|window, cx| window.draw(cx).clear(cx));
        }
        for selector in [
            "accordion-panel-0",
            "accordion-panel-1",
            "accordion-panel-2",
        ] {
            assert!(cx.debug_bounds(selector).is_some());
        }
        let first = cx.debug_bounds("accordion-trigger-0").unwrap();
        cx.simulate_click(first.center(), Default::default());
        cx.update(|window, cx| window.draw(cx).clear(cx));
        assert!(cx.debug_bounds("accordion-panel-0").is_none());
        assert!(cx.debug_bounds("accordion-panel-1").is_some());
        assert!(cx.debug_bounds("accordion-panel-2").is_some());

        view.update(cx, |this, cx| {
            this.page = "collapsible";
            this.enabled = false;
            cx.notify();
        });
        cx.update(|window, cx| window.draw(cx).clear(cx));
        assert!(cx.debug_bounds("collapse-sync").is_none());
        let trigger = cx.debug_bounds("collapse-trigger").unwrap().center();
        cx.simulate_click(trigger, Default::default());
        cx.update(|window, cx| window.draw(cx).clear(cx));
        let control = cx.debug_bounds("collapse-sync").unwrap().center();
        cx.simulate_click(control, Default::default());
        cx.update(|window, cx| window.draw(cx).clear(cx));
        cx.update(|_, cx| assert!(view.read(cx).enabled));
        cx.simulate_click(trigger, Default::default());
        cx.update(|window, cx| window.draw(cx).clear(cx));
        assert!(cx.debug_bounds("collapse-sync").is_none());
        cx.simulate_click(trigger, Default::default());
        cx.update(|window, cx| window.draw(cx).clear(cx));
        assert!(cx.debug_bounds("collapse-sync").is_some());
        cx.update(|_, cx| assert!(view.read(cx).enabled));
    }

    #[gpui::test]
    fn tab_settings_survive_switching_pages(cx: &mut TestAppContext) {
        cx.update(gpui_omarchy::init);
        let (view, cx) = cx.add_window_view(Gallery::new);
        view.update(cx, |this, cx| {
            this.page = "tabs";
            this.enabled = false;
            cx.notify();
        });
        cx.update(|window, cx| window.draw(cx).clear(cx));
        let settings = cx.debug_bounds("omarchy-tab-2").unwrap().center();
        cx.simulate_click(settings, Default::default());
        cx.update(|window, cx| window.draw(cx).clear(cx));
        let sync = cx.debug_bounds("tab-sync").unwrap().center();
        cx.simulate_click(sync, Default::default());
        cx.update(|window, cx| {
            let input = view.read(cx).workspace_name.clone();
            input.update(cx, |state, cx| state.focus(window, cx));
            window.draw(cx).clear(cx);
        });
        cx.simulate_keystrokes("cmd-a");
        cx.simulate_input("Studio");
        let overview = cx.debug_bounds("omarchy-tab-0").unwrap().center();
        cx.simulate_click(overview, Default::default());
        cx.update(|window, cx| window.draw(cx).clear(cx));
        assert!(cx.debug_bounds("tab-sync").is_none());
        cx.simulate_click(settings, Default::default());
        cx.update(|window, cx| window.draw(cx).clear(cx));
        assert!(cx.debug_bounds("tab-sync").is_some());
        cx.update(|_, cx| {
            assert!(view.read(cx).enabled);
            assert_eq!(
                view.read(cx).workspace_name.read(cx).value().as_ref(),
                "Studio"
            );
        });
    }

    #[gpui::test]
    fn input_reset_clears_value_and_returns_focus(cx: &mut TestAppContext) {
        cx.update(gpui_omarchy::init);
        let (view, cx) = cx.add_window_view(Gallery::new);
        cx.update(|window, cx| {
            view.update(cx, |this, cx| {
                this.page = "input";
                this.count = 6;
                this.input
                    .update(cx, |input, cx| input.set_value("Studio", window, cx));
                cx.notify();
            });
            window.draw(cx).clear(cx);
        });
        let reset = cx.debug_bounds("reset-input").unwrap().center();
        cx.simulate_click(reset, Default::default());
        cx.update(|window, cx| {
            window.draw(cx).clear(cx);
            let this = view.read(cx);
            assert!(this.input.read(cx).value().is_empty());
            assert_eq!(this.count, 0);
            use gpui::Focusable;
            assert!(this.input.read(cx).focus_handle(cx).is_focused(window));
        });
        cx.simulate_input("New name");
        cx.update(|_, cx| assert_eq!(view.read(cx).input.read(cx).value().as_ref(), "New name"));
    }

    #[gpui::test]
    fn date_picker_opens_and_escape_preserves_selection(cx: &mut TestAppContext) {
        cx.update(gpui_omarchy::init);
        let (view, cx) = cx.add_window_view(Gallery::new);
        view.update(cx, |this, cx| {
            this.page = "date_picker";
            cx.notify();
        });
        cx.update(|window, cx| window.draw(cx).clear(cx));
        let trigger = cx.debug_bounds("date-picker-trigger").unwrap().center();
        cx.simulate_click(trigger, Default::default());
        cx.update(|window, cx| {
            window.draw(cx).clear(cx);
            assert!(view.read(cx).date_picker_state.read(cx).is_open());
        });
        cx.simulate_keystrokes("escape");
        cx.update(|window, cx| {
            window.draw(cx).clear(cx);
            assert!(!view.read(cx).date_picker_state.read(cx).is_open());
            assert!(
                !view
                    .read(cx)
                    .date_picker_state
                    .read(cx)
                    .calendar
                    .read(cx)
                    .date()
                    .is_some()
            );
        });
        cx.simulate_keystrokes("enter");
        cx.update(|window, cx| {
            window.draw(cx).clear(cx);
            assert!(
                view.read(cx).date_picker_state.read(cx).is_open(),
                "focus returns to trigger for reopening"
            );
        });
    }

    #[gpui::test]
    fn repository_link_is_visible_inside_the_window(cx: &mut TestAppContext) {
        cx.update(gpui_omarchy::init);
        let (_, cx) = cx.add_window_view(Gallery::new);
        for width in [680., 1060., 1440.] {
            cx.simulate_resize(size(px(width), px(760.)));
            cx.update(|window, cx| window.draw(cx).clear(cx));
            let root = cx.debug_bounds("gallery-root").unwrap();
            let link = cx.debug_bounds("gallery-repository").unwrap();
            assert!(link.right() <= root.right(), "{link:?} vs {root:?}");
            assert!(link.left() >= root.left());
            assert!(
                link.bottom() <= root.bottom(),
                "footer link is clipped below the window: {link:?} vs {root:?}"
            );
            assert!(link.size.width > px(100.));
        }
    }

    #[gpui::test]
    fn dock_drag_merges_tabs_without_losing_panels(cx: &mut TestAppContext) {
        use gpui::MouseButton;
        use gpui_base::dock::DockPlacement;
        cx.update(gpui_omarchy::init);
        let (view, cx) = cx.add_window_view(Gallery::new);
        view.update(cx, |this, cx| {
            this.page = "dock";
            cx.notify();
        });
        for _ in 0..2 {
            cx.update(|window, cx| window.draw(cx).clear(cx));
        }
        let source = cx.debug_bounds("dock-tab-Notes").unwrap().center();
        let destination = cx.debug_bounds("dock-tab-Preview").unwrap().center();
        cx.simulate_mouse_down(source, MouseButton::Left, Default::default());
        cx.simulate_mouse_move(
            source + gpui::point(px(12.), px(0.)),
            Some(MouseButton::Left),
            Default::default(),
        );
        cx.simulate_mouse_move(destination, Some(MouseButton::Left), Default::default());
        cx.simulate_mouse_up(destination, MouseButton::Left, Default::default());
        cx.update(|window, cx| {
            window.draw(cx).clear(cx);
            let dock = view.read(cx).dock_state.read(cx);
            let layout = dock.layout(DockPlacement::Center).unwrap();
            assert_eq!(layout.panels().count(), 3);
            let find = |name| {
                layout
                    .panels()
                    .find(|id| dock.panel(*id).unwrap().panel_name(cx) == name)
                    .unwrap()
            };
            assert_eq!(
                layout.find_panel_node(find("Notes")),
                layout.find_panel_node(find("Preview"))
            );
            assert_ne!(
                layout.find_panel_node(find("Files")),
                layout.find_panel_node(find("Preview"))
            );
        });
        assert!(cx.debug_bounds("dock-tab-Notes").is_some());
    }

    #[gpui::test]
    fn navigation_task_note_survives_back_and_forward(cx: &mut TestAppContext) {
        cx.update(gpui_omarchy::init);
        let (view, cx) = cx.add_window_view(Gallery::new);
        view.update(cx, |this, cx| {
            this.page = "nav_stack";
            cx.notify();
        });
        for _ in 0..2 {
            cx.update(|window, cx| window.draw(cx).clear(cx));
            let target = cx.debug_bounds("nav-open").unwrap().center();
            cx.simulate_click(target, Default::default());
        }
        cx.update(|window, cx| window.draw(cx).clear(cx));
        let notes = cx.update(|_, cx| {
            let nav = view.read(cx).nav_state.read(cx);
            assert_eq!(nav.depth(), 3);
            nav.current()
                .unwrap()
                .clone()
                .downcast::<NavigationPage>()
                .unwrap()
                .read(cx)
                .notes
                .clone()
        });
        cx.update(|window, cx| {
            notes.update(cx, |state, cx| {
                state.set_value("", window, cx);
                state.focus(window, cx);
            })
        });
        cx.simulate_input("Ready for review");
        for selector in ["nav-back", "nav-back", "nav-forward", "nav-forward"] {
            cx.update(|window, cx| window.draw(cx).clear(cx));
            let target = cx.debug_bounds(selector).unwrap().center();
            cx.simulate_click(target, Default::default());
        }
        cx.update(|window, cx| {
            window.draw(cx).clear(cx);
            let nav = view.read(cx).nav_state.read(cx);
            assert_eq!(nav.depth(), 3);
            assert_eq!(
                nav.current()
                    .unwrap()
                    .clone()
                    .downcast::<NavigationPage>()
                    .unwrap()
                    .read(cx)
                    .notes,
                notes
            );
            assert_eq!(notes.read(cx).value().as_ref(), "Ready for review");
        });
    }

    #[gpui::test]
    fn every_component_renders_in_both_themes(cx: &mut TestAppContext) {
        cx.update(gpui_omarchy::init);
        let (view, cx) = cx.add_window_view(Gallery::new);
        for theme in [Theme::tokyo_night(), Theme::flexoki_light()] {
            cx.update(|_, cx| theme.apply(cx));
            for page in components() {
                cx.update(|window, cx| {
                    view.update(cx, |this, cx| {
                        this.page = page;
                        cx.notify();
                    });
                    window.draw(cx).clear(cx);
                });
            }
        }
    }
}
