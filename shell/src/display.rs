//! Leaf media and rich text use the existing native renderers.
use super::element::{register_leaf, string, text};
use gpui_shell::{
    ArgumentDescriptor, ArgumentSchema, ComponentArgument, ComponentRegistry, RegistryError, anyhow,
};

pub(super) fn register(registry: &mut ComponentRegistry) -> Result<(), RegistryError> {
    use gpui_omarchy as ui;
    register_leaf(
        registry,
        "Avatar",
        "Native initials avatar with an optional image resource; ordinary children are not accepted.",
        vec![
            text("initials"),
            ArgumentDescriptor::new(
                "image",
                ArgumentSchema::Optional(Box::new(ArgumentSchema::String)),
            ),
        ],
        |args, cx| {
            let mut avatar = ui::avatar(string(args, 0)?, cx);
            if let Some(ComponentArgument::Optional(Some(image))) = args.get(1) {
                if let ComponentArgument::String(source) = image.as_ref() {
                    avatar = avatar.image(ui::avatar_image(source.clone()));
                }
            }
            Ok(avatar)
        },
    )?;
    register_leaf(
        registry,
        "AvatarImage",
        "Native image beneath the application asset root; URLs, traversal and ordinary children are not accepted.",
        vec![text("asset")],
        |args, _| Ok(ui::avatar_image(string(args, 0)?)),
    )?;
    register_leaf(
        registry,
        "Markdown",
        "Native selectable Markdown using Omarchy's rich text styles.",
        vec![text("id"), text("source")],
        |args, cx| Ok(ui::markdown(string(args, 0)?, string(args, 1)?, cx)),
    )?;
    register_leaf(
        registry,
        "Html",
        "Native selectable HTML using Omarchy's rich text styles.",
        vec![text("id"), text("source")],
        |args, cx| Ok(ui::html(string(args, 0)?, string(args, 1)?, cx)),
    )?;
    register_leaf(
        registry,
        "Icon",
        "Native bundled icon; size and color inherit through normal element styles.",
        vec![ArgumentDescriptor::new(
            "name",
            ArgumentSchema::Enum(&[
                "check",
                "minus",
                "plus",
                "chevron-down",
                "chevron-right",
                "chevron-left",
                "calendar",
                "star",
                "external-link",
                "close",
                "search",
                "menu",
                "settings",
                "triangle-alert",
            ]),
        )],
        |args, _| {
            use ui::IconName;
            let name = match string(args, 0)?.as_str() {
                "check" => IconName::Check,
                "minus" => IconName::Minus,
                "plus" => IconName::Plus,
                "chevron-down" => IconName::ChevronDown,
                "chevron-right" => IconName::ChevronRight,
                "chevron-left" => IconName::ChevronLeft,
                "calendar" => IconName::Calendar,
                "star" => IconName::Star,
                "external-link" => IconName::ExternalLink,
                "close" => IconName::Close,
                "search" => IconName::Search,
                "menu" => IconName::Menu,
                "settings" => IconName::Settings,
                "triangle-alert" => IconName::TriangleAlert,
                _ => anyhow::bail!("unknown Omarchy icon"),
            };
            Ok(ui::icon(name))
        },
    )?;
    Ok(())
}
