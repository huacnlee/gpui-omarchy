//! Native, application-composed surfaces. These constructors retain ordinary
//! shell style and child composition without reproducing the Rust styling.
use super::element::{number, numeric, register_container, string, text};
use gpui_shell::{ArgumentDescriptor, ArgumentSchema, ComponentRegistry, RegistryError, anyhow};

pub(super) fn register(registry: &mut ComponentRegistry) -> Result<(), RegistryError> {
    use gpui_omarchy as ui;
    register_container(
        registry,
        "Tabs",
        "Native tab container; compound keyboard navigation is not provided by this primitive.",
        vec![text("id")],
        |args, cx| Ok(ui::tabs(string(args, 0)?, cx)),
    )?;
    register_container(
        registry,
        "ToggleGroup",
        "Native group of independently controlled toggles.",
        vec![text("id")],
        |args, cx| Ok(ui::toggle_group(string(args, 0)?, cx)),
    )?;
    register_container(
        registry,
        "FocusScope",
        "Native Tab and Shift+Tab traversal for a composed region.",
        vec![text("id")],
        |args, _| Ok(ui::focus_scope(string(args, 0)?)),
    )?;
    register_container(
        registry,
        "Tooltip",
        "Native tooltip content surface. The owner supplies the tooltip lifecycle.",
        vec![text("text")],
        |args, cx| Ok(ui::tooltip(string(args, 0)?, cx)),
    )?;
    register_container(
        registry,
        "Panel",
        "Native Omarchy panel with a title and application-owned children.",
        vec![text("title")],
        |args, cx| Ok(ui::panel(string(args, 0)?, cx)),
    )?;
    register_container(
        registry,
        "Separator",
        "Native horizontal divider.",
        vec![],
        |_, cx| Ok(ui::separator(cx)),
    )?;
    register_container(
        registry,
        "VerticalSeparator",
        "Native vertical toolbar divider.",
        vec![],
        |_, cx| Ok(ui::vertical_separator(cx)),
    )?;
    register_container(
        registry,
        "Keycap",
        "Native keyboard shortcut key.",
        vec![text("key")],
        |args, cx| Ok(ui::keycap(string(args, 0)?, cx)),
    )?;
    register_container(
        registry,
        "Badge",
        "Native status badge; status is neutral, success, warning or error.",
        vec![
            text("label"),
            ArgumentDescriptor::new(
                "status",
                ArgumentSchema::Enum(&["neutral", "success", "warning", "error"]),
            ),
        ],
        |args, cx| {
            let status = match string(args, 1)?.as_str() {
                "neutral" => ui::Status::Neutral,
                "success" => ui::Status::Success,
                "warning" => ui::Status::Warning,
                "error" => ui::Status::Error,
                _ => anyhow::bail!("invalid badge status"),
            };
            Ok(ui::badge(string(args, 0)?, status, cx))
        },
    )?;
    register_container(
        registry,
        "EmptyState",
        "Native empty state with title, description and optional action children.",
        vec![text("title"), text("description")],
        |args, cx| Ok(ui::empty_state(string(args, 0)?, string(args, 1)?, cx)),
    )?;
    register_container(
        registry,
        "Progress",
        "Native determinate progress, normalized to 0 through 100.",
        vec![text("id"), numeric("value")],
        |args, cx| Ok(ui::progress(string(args, 0)?, number(args, 1)? as f32, cx)),
    )?;
    register_container(
        registry,
        "Toast",
        "Native notification content; the application owns stacking and lifetime.",
        vec![text("id")],
        |args, cx| Ok(ui::toast(string(args, 0)?, cx)),
    )?;

    register_container(
        registry,
        "Table",
        "Native table; the application supplies rows and columns as children.",
        vec![text("id")],
        |args, cx| Ok(ui::table(string(args, 0)?, cx)),
    )?;
    register_container(
        registry,
        "TableRow",
        "Native table row with a one-based accessibility row index.",
        vec![text("id"), numeric("index")],
        |args, cx| {
            Ok(ui::table_row(
                string(args, 0)?,
                number(args, 1)? as usize,
                cx,
            ))
        },
    )?;
    register_container(
        registry,
        "TableHead",
        "Native table header cell with a one-based accessibility column index.",
        vec![text("id"), numeric("index")],
        |args, cx| {
            Ok(ui::table_head(
                string(args, 0)?,
                number(args, 1)? as usize,
                cx,
            ))
        },
    )?;
    register_container(
        registry,
        "TableCell",
        "Native table data cell with a one-based accessibility column index.",
        vec![text("id"), numeric("index")],
        |args, cx| {
            Ok(ui::table_cell(
                string(args, 0)?,
                number(args, 1)? as usize,
                cx,
            ))
        },
    )?;

    register_container(
        registry,
        "DialogBackdrop",
        "Native modal backdrop; place it in a dialog host.",
        vec![],
        |_, _| Ok(ui::dialog_backdrop()),
    )?;
    register_container(
        registry,
        "DialogPopup",
        "Native dialog content surface.",
        vec![],
        |_, cx| Ok(ui::dialog_popup(cx)),
    )?;
    register_container(
        registry,
        "DialogTitle",
        "Native dialog title with heading semantics.",
        vec![text("title")],
        |args, cx| Ok(ui::dialog_title(string(args, 0)?, cx)),
    )?;
    register_container(
        registry,
        "DialogDescription",
        "Native dialog description.",
        vec![text("description")],
        |args, cx| Ok(ui::dialog_description(string(args, 0)?, cx)),
    )?;
    register_container(
        registry,
        "SheetSurface",
        "Native right-edge sheet content surface.",
        vec![],
        |_, cx| Ok(ui::sheet_surface(cx)),
    )?;
    register_container(
        registry,
        "PopoverSurface",
        "Native floating popover content surface.",
        vec![],
        |_, cx| Ok(ui::popover_surface(cx)),
    )?;
    register_container(
        registry,
        "AccordionPanel",
        "Native accordion content panel.",
        vec![],
        |_, cx| Ok(ui::accordion_panel(cx)),
    )?;
    Ok(())
}
